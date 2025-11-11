"use client"

import { useMemo, useState, type FormEvent } from "react"

import {
  submitMembershipRegistration,
  type MembershipPaymentMethod,
  type MembershipPlan,
  type MembershipRegistration,
} from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type CheckoutFormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  planType: MembershipPlan
  notes: string
  paymentMethod: MembershipPaymentMethod
  transactionReference: string
  cardNumber: string
  cardExpiry: string
  cardCvc: string
}

const MEMBERSHIP_PLANS: Record<
  MembershipPlan,
  {
    label: string
    description: string
    amount: number
    frequency: string
    benefits: string[]
  }
> = {
  chapter: {
    label: "Chapter Member",
    description: "Access every CMU AMA event, resource, and mentorship opportunity for a single annual rate.",
    amount: 29_00,
    frequency: "per year",
    benefits: [
      "Unlimited workshops & on-campus events",
      "Networking with CMU AMA leaders & alumni",
      "Leadership & resume-building opportunities",
      "Career coaching and internship alerts",
    ],
  },
}

const PAYMENT_LABELS: Record<MembershipPaymentMethod, string> = {
  card: "Credit / Debit Card",
  paypal: "PayPal",
  cash: "Cash / In-Person",
}

type MembershipCheckoutFormProps = {
  defaultPlan?: MembershipPlan
}

export function MembershipCheckoutForm({ defaultPlan }: MembershipCheckoutFormProps) {
  const [form, setForm] = useState<CheckoutFormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    planType: defaultPlan ?? "chapter",
    notes: "",
    paymentMethod: "card",
    transactionReference: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<MembershipRegistration | null>(null)

  const selectedPlan = useMemo(() => MEMBERSHIP_PLANS[form.planType], [form.planType])

  const handlePaymentMethodChange = (method: MembershipPaymentMethod) => {
    setForm((prev) => ({
      ...prev,
      paymentMethod: method,
      transactionReference: method === "cash" ? prev.transactionReference : "",
      cardNumber: method === "card" ? prev.cardNumber : "",
      cardExpiry: method === "card" ? prev.cardExpiry : "",
      cardCvc: method === "card" ? prev.cardCvc : "",
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    setError(null)
    setIsSubmitting(true)

    try {
      let transactionReference = form.transactionReference.trim() || undefined
      if (form.paymentMethod === "card") {
        const digits = form.cardNumber.replace(/\D/g, "")
        if (digits.length < 12) {
          setError("Please enter a valid card number (only last 4 digits are stored).")
          setIsSubmitting(false)
          return
        }
        if (!/\d{2}\/\d{2}/.test(form.cardExpiry)) {
          setError("Please enter card expiry in MM/YY format.")
          setIsSubmitting(false)
          return
        }
        if (form.cardCvc.replace(/\D/g, "").length < 3) {
          setError("Please enter a valid CVC.")
          setIsSubmitting(false)
          return
        }
        transactionReference = `CARD-${digits.slice(-4)}`
      } else if (form.paymentMethod === "paypal" && !transactionReference) {
        setError("Please provide your PayPal email or confirmation ID.")
        setIsSubmitting(false)
        return
      }

      const submission = await submitMembershipRegistration({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        planType: form.planType,
        paymentMethod: form.paymentMethod,
        amount: selectedPlan.amount,
        notes: form.notes || undefined,
        transactionReference,
      })
      setSuccess(submission)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while saving your registration.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formattedPrice = useMemo(() => {
    const dollars = selectedPlan.amount / 100
    return dollars.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    })
  }, [selectedPlan.amount])

  if (success) {
    return (
      <Card className="border-primary/40 bg-primary/5 shadow-xl">
        <CardContent className="space-y-6 pt-8">
          <div className="space-y-3 text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Registration Complete</div>
            <h2 className="text-3xl font-bold text-foreground">Welcome to AMA at CMU!</h2>
            <p className="text-base leading-relaxed text-foreground/80">
              We&apos;ve recorded your membership request and sent a confirmation to{" "}
              <span className="font-semibold text-foreground">{success.email}</span>. Our team will finalize your
              checkout within 1-2 business days and share next steps.
            </p>
          </div>

          <div className="grid gap-4 rounded-2xl border border-primary/20 bg-background/70 p-6 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.32em] text-foreground/50">Plan</div>
              <div className="text-lg font-semibold text-foreground">{MEMBERSHIP_PLANS[success.planType].label}</div>
              <div className="text-sm text-foreground/70">{MEMBERSHIP_PLANS[success.planType].frequency}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.32em] text-foreground/50">Amount</div>
              <div className="text-lg font-semibold text-foreground">
                {(success.amount / 100).toLocaleString(undefined, {
                  style: "currency",
                  currency: "USD",
                })}
              </div>
              <div className="text-sm text-foreground/70">Payment due at time of onboarding</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.32em] text-foreground/50">Payment method</div>
              <div className="text-lg font-semibold text-foreground">{PAYMENT_LABELS[success.paymentMethod]}</div>
              {success.transactionReference ? (
                <div className="text-sm text-foreground/70">Reference: {success.transactionReference}</div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-6 text-sm leading-relaxed text-primary/90">
            Watch for an onboarding email from <strong>ama@cmich.edu</strong> with payment instructions and your kickoff
            checklist. Have questions? Reply to that email any time.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
      <Card className="border-border/70 bg-background/70 shadow-xl">
        <CardContent className="space-y-8 pt-8">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Member Details</h2>
            <p className="text-sm text-foreground/70">
              Tell us a little about yourself so we can personalize your AMA experience.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
                  required
                  placeholder="Taylor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
                  required
                  placeholder="Jordan"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">CMU email</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                  placeholder="you@cmich.edu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="(989) 555-0123"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">What excites you about AMA? (optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Share any goals or experiences you'd like us to know about."
                rows={4}
              />
            </div>

            <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/30 p-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Payment Options</div>
                <h3 className="mt-1 text-lg font-semibold text-foreground">Choose how you&apos;d like to check out</h3>
                <p className="text-sm text-foreground/70">
                  Select a payment method below. Card details are encrypted in transit and only the last 4 digits are
                  stored for reference.
                </p>
              </div>

              <div className="grid gap-3">
                <PaymentOption
                  method="card"
                  label="Credit / Debit Card"
                  description="Pay securely now with Visa, Mastercard, Discover, or AMEX."
                  activeMethod={form.paymentMethod}
                  onSelect={handlePaymentMethodChange}
                />
                <PaymentOption
                  method="paypal"
                  label="PayPal"
                  description="Use your PayPal balance or connected bank/card."
                  activeMethod={form.paymentMethod}
                  onSelect={handlePaymentMethodChange}
                />
                <PaymentOption
                  method="cash"
                  label="Cash / Campus Drop-off"
                  description="Bring dues to the next AMA meeting or the marketing office."
                  activeMethod={form.paymentMethod}
                  onSelect={handlePaymentMethodChange}
                />
              </div>

              {form.paymentMethod === "card" ? (
                <div className="grid gap-4 rounded-xl border border-primary/20 bg-background/80 p-4">
                  <div className="space-y-1">
                    <Label htmlFor="cardNumber">Card number</Label>
                    <Input
                      id="cardNumber"
                      inputMode="numeric"
                      placeholder="1234 5678 9012 3456"
                      value={form.cardNumber}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, cardNumber: event.target.value.replace(/[^\d\s]/g, "") }))
                      }
                    />
                    <p className="text-xs text-foreground/60">We only store the last four digits for receipt tracking.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="cardExpiry">Expiry (MM/YY)</Label>
                      <Input
                        id="cardExpiry"
                        placeholder="09/27"
                        value={form.cardExpiry}
                        onChange={(event) => setForm((prev) => ({ ...prev, cardExpiry: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="cardCvc">CVC</Label>
                      <Input
                        id="cardCvc"
                        placeholder="123"
                        inputMode="numeric"
                        value={form.cardCvc}
                        onChange={(event) => setForm((prev) => ({ ...prev, cardCvc: event.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="transactionReference">
                    {form.paymentMethod === "paypal" ? "PayPal email or confirmation ID" : "Payment notes (optional)"}
                  </Label>
                  <Input
                    id="transactionReference"
                    placeholder={
                      form.paymentMethod === "paypal" ? "you@paypal.com or Transaction ID" : "Let us know when you plan to pay"
                    }
                    value={form.transactionReference}
                    onChange={(event) => setForm((prev) => ({ ...prev, transactionReference: event.target.value }))}
                    required={form.paymentMethod === "paypal"}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-foreground/70">
                By continuing you consent to receive AMA onboarding updates and agree to our member policies.
              </div>
              <Button
                type="submit"
                className="rounded-full px-8 py-5 text-base font-semibold shadow-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Complete Registration"}
              </Button>
            </div>

            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-primary/5 shadow-lg">
        <CardContent className="space-y-6 pt-8">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">Your Plan</div>
            <h3 className="text-2xl font-semibold text-foreground">{selectedPlan.label}</h3>
            <p className="text-sm text-foreground/75">{selectedPlan.description}</p>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-background/90 p-6">
            <div className="flex items-baseline justify-between">
              <span className="text-base font-medium text-foreground">Membership dues</span>
              <span className="text-3xl font-bold text-foreground">{formattedPrice}</span>
            </div>
            <div className="mt-1 text-sm text-foreground/70">{selectedPlan.frequency}</div>
          </div>

          <div className="space-y-3">
            {Object.entries(MEMBERSHIP_PLANS).map(([planKey, plan]) => {
              const typedPlan = planKey as MembershipPlan
              const isActive = typedPlan === form.planType
              return (
                <button
                  key={planKey}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, planType: typedPlan }))}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-4 text-left transition-all duration-300",
                    isActive
                      ? "border-primary bg-primary/15 shadow-lg"
                      : "border-border/60 bg-background/70 hover:border-primary/40 hover:bg-primary/5",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{plan.label}</div>
                      <div className="text-xs text-foreground/70">{plan.frequency}</div>
                    </div>
                    <div className="text-base font-semibold text-foreground">
                      {(plan.amount / 100).toLocaleString(undefined, {
                        style: "currency",
                        currency: "USD",
                      })}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="space-y-3 text-sm text-foreground/75">
            <div className="font-semibold uppercase tracking-[0.28em] text-primary">What&apos;s included</div>
            <ul className="space-y-2">
              {selectedPlan.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/10 p-5 text-sm text-primary/90">
            <div className="font-semibold uppercase tracking-[0.28em]">Secure Checkout</div>
            <ul className="space-y-2 text-primary/80">
              <li>• Card payments are encrypted and reviewed by the AMA finance team.</li>
              <li>• PayPal transfers go to <strong>paypal.me/amacmu</strong>.</li>
              <li>• Cash payments can be dropped off at meetings or the marketing office.</li>
            </ul>
            <div className="rounded-xl border border-primary/20 bg-background/70 p-4 text-xs text-primary/70">
              Need help? Email <strong>ama@cmich.edu</strong> and we’ll walk you through your preferred checkout method.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

type PaymentOptionProps = {
  method: MembershipPaymentMethod
  label: string
  description: string
  activeMethod: MembershipPaymentMethod
  onSelect: (method: MembershipPaymentMethod) => void
}

function PaymentOption({ method, label, description, activeMethod, onSelect }: PaymentOptionProps) {
  const isActive = activeMethod === method
  return (
    <button
      type="button"
      onClick={() => onSelect(method)}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200",
        isActive
          ? "border-primary bg-primary/15 text-foreground shadow-md"
          : "border-border/60 bg-background/80 text-foreground/80 hover:border-primary/40 hover:bg-primary/10",
      )}
    >
      <span
        className={cn(
          "mt-1 inline-flex h-3 w-3 shrink-0 rounded-full border-2 transition-colors",
          isActive ? "border-primary bg-primary" : "border-border bg-transparent",
        )}
      />
      <span>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-foreground/70">{description}</div>
      </span>
    </button>
  )
}

