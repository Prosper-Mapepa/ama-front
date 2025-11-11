"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { adminApi, SettingPayload } from "@/lib/api"
import { Loader2, Plus, Save, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type ManagedSetting = SettingPayload & {
  clientId: string
  rawValue: string
  isSaving?: boolean
  isDeleting?: boolean
  isNew?: boolean
  error?: string | null
}

const createSetting = (): ManagedSetting => ({
  clientId: crypto.randomUUID(),
  key: "",
  value: {},
  rawValue: "{\n  \n}",
  isNew: true,
})

export function SettingsManager() {
  const [settings, setSettings] = useState<ManagedSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasSettings = useMemo(() => settings.length > 0, [settings])

  useEffect(() => {
    let mounted = true
    adminApi
      .getSettings()
      .then((data) => {
        if (!mounted) return
        setSettings(
          data.map((setting) => ({
            ...setting,
            clientId: crypto.randomUUID(),
            rawValue: JSON.stringify(setting.value ?? {}, null, 2),
            isNew: false,
          })),
        )
        setError(null)
      })
      .catch((err) => {
        if (!mounted) return
        const message = err instanceof Error ? err.message : "Failed to load settings"
        setError(message)
        toast.error("Unable to load settings", { description: message })
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const addSetting = () => {
    setSettings((prev) => [...prev, createSetting()])
    toast.info("Draft setting added")
  }

  const updateSettingKey = (clientId: string, key: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.clientId === clientId ? { ...setting, key } : setting,
      ),
    )
  }

  const updateSettingValue = (clientId: string, value: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.clientId === clientId ? { ...setting, rawValue: value, error: null } : setting,
      ),
    )
  }

  const handleDelete = async (clientId: string, key: string, isNew?: boolean) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.clientId === clientId ? { ...setting, isDeleting: true } : setting,
      ),
    )

    try {
      if (!isNew) {
        await adminApi.deleteSetting(key)
      }
      setSettings((prev) => prev.filter((setting) => setting.clientId !== clientId))
      toast.success("Setting removed")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete setting"
      setError(message)
      toast.error("Unable to delete setting", { description: message })
      setSettings((prev) =>
        prev.map((setting) =>
          setting.clientId === clientId ? { ...setting, isDeleting: false } : setting,
        ),
      )
    }
  }

  const handleSave = async (settingRecord: ManagedSetting) => {
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(settingRecord.rawValue || "{}")
    } catch (parseError) {
      setSettings((prev) =>
        prev.map((setting) =>
          setting.clientId === settingRecord.clientId
            ? {
                ...setting,
                error:
                  parseError instanceof Error ? parseError.message : "Invalid JSON value",
              }
            : setting,
        ),
      )
      toast.error("Invalid JSON", {
        description:
          parseError instanceof Error ? parseError.message : "Please provide valid JSON data.",
      })
      return
    }

    setSettings((prev) =>
      prev.map((setting) =>
        setting.clientId === settingRecord.clientId
          ? { ...setting, isSaving: true, error: null }
          : setting,
      ),
    )

    try {
      const saved = await adminApi.upsertSetting({
        key: settingRecord.key,
        value: parsed,
      })

      setSettings((prev) =>
        prev.map((setting) =>
          setting.clientId === settingRecord.clientId
            ? {
                ...setting,
                key: saved.key,
                value: saved.value,
                rawValue: JSON.stringify(saved.value ?? {}, null, 2),
                isSaving: false,
                isNew: false,
                error: null,
              }
            : setting,
        ),
      )
      setError(null)
      toast.success(settingRecord.isNew ? "Setting created" : "Setting updated")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save setting"
      setError(message)
      toast.error("Unable to save setting", { description: message })
      setSettings((prev) =>
        prev.map((setting) =>
          setting.clientId === settingRecord.clientId
            ? { ...setting, isSaving: false }
            : setting,
        ),
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Site Settings</h2>
          <p className="text-muted-foreground">
            Manage global configuration such as contact information and social handles.
          </p>
        </div>
        <Button onClick={addSetting} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Setting
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading settings...
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !hasSettings && (
        <div className="rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center text-muted-foreground">
          No settings configured yet. Create entries for contact info, hero banners, and more.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {settings.map((setting) => (
          <Card key={setting.clientId} className={cn("transition-opacity", setting.isDeleting && "opacity-50")}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg text-foreground">{setting.key || "New Setting"}</CardTitle>
                  <CardDescription>Store JSON objects for flexible configuration</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(setting.clientId, setting.key, setting.isNew)}
                  disabled={setting.isSaving || setting.isDeleting}
                  className="text-destructive hover:text-destructive"
                >
                  {setting.isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`key-${setting.clientId}`} className="text-foreground">
                  Setting Key
                </Label>
                <Input
                  id={`key-${setting.clientId}`}
                  value={setting.key}
                  placeholder="e.g. contact, socials, hero"
                  onChange={(event) => updateSettingKey(setting.clientId, event.target.value)}
                  className="bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`value-${setting.clientId}`} className="text-foreground">
                  JSON Value
                </Label>
                <Textarea
                  id={`value-${setting.clientId}`}
                  value={setting.rawValue}
                  onChange={(event) => updateSettingValue(setting.clientId, event.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder='{\n  "email": "ama@cmich.edu"\n}'
                />
                {setting.error && <p className="text-sm text-destructive">{setting.error}</p>}
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => handleSave(setting)}
                disabled={setting.isSaving || setting.isDeleting || !setting.key}
              >
                {setting.isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {setting.isNew ? "Save Setting" : "Update Setting"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

