"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react"

import {
  adminApi,
  type MembershipRegistration,
  type MembershipStatus,
  type MembershipPaymentMethod,
} from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type LoadingState = "idle" | "loading" | "error"

const statusStyles: Record<MembershipStatus, string> = {
  pending: "bg-amber-100 text-amber-900 border border-amber-200",
  paid: "bg-emerald-100 text-emerald-900 border border-emerald-200",
  cancelled: "bg-slate-100 text-slate-900 border border-slate-200",
}

const paymentLabels: Record<MembershipPaymentMethod, string> = {
  card: "Card",
  paypal: "PayPal",
  cash: "Cash / In-Person",
}

export function MembershipsManager() {
  const [memberships, setMemberships] = useState<MembershipRegistration[]>([])
  const [loading, setLoading] = useState<LoadingState>("loading")
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    void refresh()
  }, [])

  const summary = useMemo(() => {
    const totals = memberships.reduce(
      (acc, membership) => {
        acc.total += 1
        const status = membership.status ?? "pending"
        acc.byStatus[status] = (acc.byStatus[status] ?? 0) + 1
        acc.revenue += membership.status === "paid" ? membership.amount : 0
        return acc
      },
      {
        total: 0,
        revenue: 0,
        byStatus: {
          pending: 0,
          paid: 0,
          cancelled: 0,
        } as Record<MembershipStatus, number>,
      },
    )
    return totals
  }, [memberships])

  async function refresh() {
    setLoading("loading")
    setError(null)
    try {
      const data = await adminApi.getMemberships()
      setMemberships(data)
      setLoading("idle")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load memberships.")
      setLoading("error")
    }
  }

  async function handleStatusChange(id: string, status: MembershipStatus) {
    setUpdatingId(id)
    try {
      await adminApi.updateMembershipStatus(id, status)
      setMemberships((prev) =>
        prev.map((membership) => (membership.id === id ? { ...membership, status } : membership)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update membership status.")
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading === "loading") {
    return (
      <Card className="border-border/60 bg-background/80">
        <CardContent className="flex h-56 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          Loading membership registrations…
        </CardContent>
      </Card>
    )
  }

  if (loading === "error") {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex flex-col gap-3 pt-8 text-destructive">
          <div className="font-semibold">We couldn’t load membership registrations.</div>
          <div className="text-sm text-destructive/80">{error}</div>
          <Button size="sm" variant="outline" className="w-fit" onClick={() => void refresh()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-background/90 shadow-lg">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
          <SummaryStat label="Total registrations" value={summary.total.toString()} />
          <SummaryStat
            label="Confirmed members"
            value={summary.byStatus.paid.toString()}
            caption={(summary.revenue / 100).toLocaleString(undefined, { style: "currency", currency: "USD" })}
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          />
          <SummaryStat
            label="Pending follow-ups"
            value={summary.byStatus.pending.toString()}
            caption={`${summary.byStatus.cancelled} cancelled`}
            icon={<Loader2 className="h-5 w-5 text-amber-500" />}
          />
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-background/80 shadow-lg">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Membership registrations</h2>
              <p className="text-sm text-muted-foreground">
                Review newly submitted members, confirm payments, and manage statuses.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => void refresh()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {memberships.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
              No registrations yet. Once students complete the membership checkout, they’ll appear here automatically.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Member</th>
                    <th className="px-4 py-3 text-left font-semibold">Plan</th>
                    <th className="px-4 py-3 text-left font-semibold">Payment</th>
                    <th className="px-4 py-3 text-left font-semibold">Submitted</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {memberships.map((membership) => (
                    <tr key={membership.id} className="align-top transition-colors hover:bg-muted/30">
                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">
                          {membership.firstName} {membership.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">{membership.email}</div>
                        {membership.phone ? (
                          <div className="text-xs text-muted-foreground">{membership.phone}</div>
                        ) : null}
                        {membership.notes ? (
                          <div className="mt-2 rounded-lg bg-muted/70 p-2 text-xs text-muted-foreground">
                            {membership.notes}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        <div className="font-semibold text-foreground capitalize">{membership.planType}</div>
                        <div>
                          {(membership.amount / 100).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        <div className="font-medium text-foreground">{paymentLabels[membership.paymentMethod]}</div>
                        {membership.transactionReference ? (
                          <div className="text-xs text-muted-foreground">
                            Ref: {membership.transactionReference}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {membership.createdAt
                          ? new Date(membership.createdAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={statusStyles[membership.status ?? "pending"]}>
                          {membership.status ?? "pending"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingId === membership.id}
                            onClick={() => void handleStatusChange(membership.id!, "paid")}
                          >
                            {updatingId === membership.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            Mark paid
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive"
                            disabled={updatingId === membership.id}
                            onClick={() => void handleStatusChange(membership.id!, "cancelled")}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

type SummaryStatProps = {
  label: string
  value: string
  caption?: string
  icon?: ReactNode
}

function SummaryStat({ label, value, caption, icon }: SummaryStatProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-sm">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-muted-foreground">
        {label}
        {icon}
      </div>
      <div className="mt-3 text-3xl font-bold text-foreground">{value}</div>
      {caption ? <div className="mt-1 text-xs text-muted-foreground">{caption}</div> : null}
    </div>
  )
}

