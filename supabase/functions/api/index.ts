import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? ""
const STRIPE_MONTHLY_PRICE_ID = Deno.env.get("STRIPE_MONTHLY_PRICE_ID") ?? ""
const STRIPE_YEARLY_PRICE_ID = Deno.env.get("STRIPE_YEARLY_PRICE_ID") ?? ""
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? ""
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://iretina.app"

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "access-control-allow-methods": "GET, POST, OPTIONS",
}

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  })
}

async function readJson(req: Request) {
  if (req.headers.get("content-type")?.includes("application/json")) {
    return await req.json()
  }
  return {}
}

function routePath(req: Request) {
  const path = new URL(req.url).pathname
  return path.replace(/^\/functions\/v1\/api/, "").replace(/^\/api/, "") || "/"
}

async function getUserFromRequest(req: Request) {
  const auth = req.headers.get("authorization") ?? ""
  const token = auth.replace(/^Bearer\s+/i, "").trim()
  if (!token) return { user: null, token: "" }

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return { user: null, token }
  return { user: data.user, token }
}

async function upsertProfile(userId: string, email: string, referralSource?: string) {
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("referral_source")
    .eq("id", userId)
    .maybeSingle()

  await supabaseAdmin.from("profiles").upsert({
    id: userId,
    email,
    referral_source: referralSource || existing?.referral_source || null,
    updated_at: new Date().toISOString(),
  })
}

async function getProfile(userId: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()
  return data
}

async function getSubscription(userId: string) {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

async function handleSignup(req: Request) {
  const { email, password, referralSource } = await readJson(req)
  if (!email || !password) return json({ message: "Email and password are required." }, 400)

  const { data, error } = await supabaseAnon.auth.signUp({ email, password })
  if (error) return json({ message: error.message }, 400)
  if (!data.user) return json({ message: "Could not create user." }, 400)

  await upsertProfile(data.user.id, data.user.email ?? email, referralSource)

  return json({
    token: data.session?.access_token ?? "",
    email: data.user.email ?? email,
    userId: data.user.id,
    plan: "free",
  })
}

async function handleLogin(req: Request) {
  const { email, password } = await readJson(req)
  if (!email || !password) return json({ message: "Email and password are required." }, 400)

  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password })
  if (error) return json({ message: error.message }, 401)
  if (!data.user || !data.session) return json({ message: "Login failed." }, 401)

  await upsertProfile(data.user.id, data.user.email ?? email)
  const profile = await getProfile(data.user.id)
  const subscription = await getSubscription(data.user.id)
  const plan = subscription?.status === "active" || subscription?.status === "trialing" ? "pro" : "free"

  return json({
    token: data.session.access_token,
    email: data.user.email ?? email,
    userId: data.user.id,
    customerId: profile?.stripe_customer_id ?? "",
    plan,
    subscriptionStatus: subscription?.status ?? "inactive",
  })
}

async function handleGoogleStart() {
  const { data, error } = await supabaseAnon.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${SITE_URL}/auth/callback`,
      skipBrowserRedirect: true,
    },
  })
  if (error) return json({ message: error.message }, 400)
  return json({ url: data.url })
}

async function handleCheckout(req: Request) {
  const { user } = await getUserFromRequest(req)
  if (!user) return json({ message: "Log in before starting checkout." }, 401)

  const { billing, successUrl, cancelUrl, referralSource, intervalMinutes, breakDurationSec } = await readJson(req)
  const priceId = billing === "monthly" ? STRIPE_MONTHLY_PRICE_ID : STRIPE_YEARLY_PRICE_ID
  if (!priceId) return json({ message: "Stripe price is not configured." }, 500)

  const email = user.email ?? ""
  let profile = await getProfile(user.id)
  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { user_id: user.id },
    })
    customerId = customer.id
    await supabaseAdmin
      .from("profiles")
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq("id", user.id)
    profile = await getProfile(user.id)
  }

  await supabaseAdmin.from("onboarding_events").insert({
    user_id: user.id,
    email,
    referral_source: referralSource || profile?.referral_source || null,
    interval_minutes: intervalMinutes ?? null,
    break_duration_sec: breakDurationSec ?? null,
    selected_billing: billing === "monthly" ? "monthly" : "yearly",
    selected_plan: "pro",
  })

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl || `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${SITE_URL}/checkout/cancel`,
    allow_promotion_codes: true,
    metadata: {
      user_id: user.id,
      billing: billing === "monthly" ? "monthly" : "yearly",
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        billing: billing === "monthly" ? "monthly" : "yearly",
      },
    },
  })

  return json({ url: session.url, customerId })
}

async function handleMe(req: Request) {
  const { user } = await getUserFromRequest(req)
  if (!user) return json({ message: "Unauthorized." }, 401)

  const profile = await getProfile(user.id)
  const subscription = await getSubscription(user.id)
  const plan = subscription?.status === "active" || subscription?.status === "trialing" ? "pro" : "free"

  return json({
    email: user.email,
    userId: user.id,
    customerId: profile?.stripe_customer_id ?? "",
    referralSource: profile?.referral_source ?? "",
    plan,
    subscriptionStatus: subscription?.status ?? "inactive",
    currentPeriodEnd: subscription?.current_period_end ?? null,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
  })
}

async function findUserIdForSubscription(subscription: Stripe.Subscription) {
  if (subscription.metadata?.user_id) return subscription.metadata.user_id
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle()
  return data?.id ?? null
}

async function saveSubscription(subscription: Stripe.Subscription) {
  const userId = await findUserIdForSubscription(subscription)
  if (!userId) return

  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id
  const item = subscription.items.data[0]
  await supabaseAdmin.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: item?.price.id ?? null,
    status: subscription.status,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: "stripe_subscription_id" })
}

async function handleWebhook(req: Request) {
  if (!STRIPE_WEBHOOK_SECRET) return json({ message: "Webhook secret is not configured." }, 500)

  const signature = req.headers.get("stripe-signature")
  if (!signature) return json({ message: "Missing Stripe signature." }, 400)

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid Stripe signature."
    return json({ message }, 400)
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id
    if (userId && customerId) {
      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq("id", userId)
    }
    if (typeof session.subscription === "string") {
      const subscription = await stripe.subscriptions.retrieve(session.subscription)
      await saveSubscription(subscription)
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await saveSubscription(event.data.object as Stripe.Subscription)
  }

  if (event.type === "invoice.payment_succeeded" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice
    if (typeof invoice.subscription === "string") {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
      await saveSubscription(subscription)
    }
  }

  return json({ received: true })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const path = routePath(req)

    if (req.method === "POST" && path === "/auth/signup") return await handleSignup(req)
    if (req.method === "POST" && path === "/auth/login") return await handleLogin(req)
    if (req.method === "POST" && path === "/auth/google/start") return await handleGoogleStart()
    if (req.method === "POST" && path === "/billing/checkout") return await handleCheckout(req)
    if (req.method === "POST" && path === "/stripe/webhook") return await handleWebhook(req)
    if (req.method === "GET" && (path === "/me" || path === "/subscription")) return await handleMe(req)

    return json({ message: "Not found." }, 404)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong."
    return json({ message }, 500)
  }
})
