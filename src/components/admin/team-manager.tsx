"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, Plus, Trash2, Mail, Linkedin, Loader2 } from "lucide-react"
import { adminApi, TeamMemberPayload } from "@/lib/api"
import { cn, resolveMediaUrl } from "@/lib/utils"
import { toast } from "sonner"

type ManagedMember = TeamMemberPayload & {
  id?: string
  clientId: string
  isSaving?: boolean
  isDeleting?: boolean
  isNew?: boolean
  pendingFile?: File | null
  previewUrl?: string | null
}

const newMember = (): ManagedMember => ({
  clientId: crypto.randomUUID(),
  name: "",
  role: "",
  major: "",
  bio: "",
  email: "",
  linkedin: "",
  imageUrl: undefined,
  displayOrder: 0,
  isNew: true,
  pendingFile: null,
  previewUrl: null,
})

export function TeamManager() {
  const [members, setMembers] = useState<ManagedMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasMembers = useMemo(() => members.length > 0, [members])
  const blobUrlRegistry = useRef<Set<string>>(new Set())
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024

  const revokePreview = (url?: string | null) => {
    if (url && url.startsWith("blob:") && blobUrlRegistry.current.has(url)) {
      URL.revokeObjectURL(url)
      blobUrlRegistry.current.delete(url)
    }
  }

  useEffect(() => {
    let active = true
    adminApi
      .getTeam()
      .then((data) => {
        if (!active) return
        setMembers(
          data.map((member) => {
            const normalized = resolveMediaUrl(member.imageUrl) ?? member.imageUrl ?? undefined
            return {
              ...member,
              imageUrl: normalized,
              clientId: member.id ?? crypto.randomUUID(),
              isNew: false,
              pendingFile: null,
              previewUrl: normalized ?? null,
            }
          }),
        )
        setError(null)
      })
      .catch((err) => {
        if (!active) return
        const message = err instanceof Error ? err.message : "Failed to load team members"
        setError(message)
        toast.error("Unable to load team members", { description: message })
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const registry = blobUrlRegistry.current
    return () => {
      registry.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url)
        }
      })
      registry.clear()
    }
  }, [])

  const addMember = () => {
    setMembers((prev) => [...prev, newMember()])
    toast.info("Draft team member added")
  }

  const updateField = (clientId: string, field: keyof TeamMemberPayload, value: string) => {
    setMembers((prev) =>
      prev.map((member) => {
        if (member.clientId !== clientId) return member
        if (field === "displayOrder") {
          const parsed = Number(value)
          return { ...member, displayOrder: Number.isNaN(parsed) ? 0 : parsed }
        }
        return { ...member, [field]: value }
      }),
    )
  }

  const handleImageSelection = (clientId: string, files: FileList | null) => {
    const file = files?.[0] ?? null

    if (file && file.size > MAX_IMAGE_SIZE) {
      toast.error("Image too large", {
        description: "Please choose an image under 10MB.",
      })
      return
    }

    setMembers((prev) =>
      prev.map((member) => {
        if (member.clientId !== clientId) return member
        if (member.pendingFile && member.previewUrl) {
          revokePreview(member.previewUrl)
        }
        if (!file) {
          return {
            ...member,
            pendingFile: null,
            previewUrl: member.imageUrl ?? null,
          }
        }
        const previewUrl = URL.createObjectURL(file)
        blobUrlRegistry.current.add(previewUrl)
        return {
          ...member,
          pendingFile: file,
          previewUrl,
        }
      }),
    )

    if (file) {
      toast.success("Profile image ready", {
        description: `${file.name} selected`,
      })
    }
  }

  const handleClearImage = (clientId: string) => {
    setMembers((prev) =>
      prev.map((member) => {
        if (member.clientId !== clientId) return member
        if (member.pendingFile && member.previewUrl) {
          revokePreview(member.previewUrl)
        }
        return {
          ...member,
          pendingFile: null,
          previewUrl: null,
          imageUrl: undefined,
        }
      }),
    )
    toast.info("Profile image removed")
  }

  const handleDelete = async (memberRecord: ManagedMember) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.clientId === memberRecord.clientId ? { ...member, isDeleting: true } : member,
      ),
    )

    try {
      if (memberRecord.id) {
        await adminApi.deleteTeamMember(memberRecord.id)
      }
      setMembers((prev) => {
        const target = prev.find((member) => member.clientId === memberRecord.clientId)
        if (target?.pendingFile && target.previewUrl) {
          revokePreview(target.previewUrl)
        }
        return prev.filter((member) => member.clientId !== memberRecord.clientId)
      })
      toast.success("Team member removed")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete member"
      setError(message)
      toast.error("Unable to delete member", { description: message })
      setMembers((prev) =>
        prev.map((member) =>
          member.clientId === memberRecord.clientId ? { ...member, isDeleting: false } : member,
        ),
      )
    }
  }

  const handleSave = async (memberRecord: ManagedMember) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.clientId === memberRecord.clientId ? { ...member, isSaving: true } : member,
      ),
    )

    try {
      let uploadedUrl: string | undefined
      if (memberRecord.pendingFile) {
        const { url } = await adminApi.uploadImage(memberRecord.pendingFile)
        uploadedUrl = url
      }

      const shouldClearImage =
        !memberRecord.pendingFile &&
        (memberRecord.previewUrl === null || memberRecord.previewUrl === undefined) &&
        !memberRecord.imageUrl
      const imageUrlValue = uploadedUrl ?? (shouldClearImage ? null : memberRecord.imageUrl ?? null)

      if (memberRecord.pendingFile && memberRecord.previewUrl) {
        revokePreview(memberRecord.previewUrl)
      }

      let saved: TeamMemberPayload
      if (memberRecord.id) {
        saved = await adminApi.updateTeamMember(memberRecord.id, {
          name: memberRecord.name,
          role: memberRecord.role,
          major: memberRecord.major,
          bio: memberRecord.bio,
          email: memberRecord.email,
          linkedin: memberRecord.linkedin,
          imageUrl: imageUrlValue,
          displayOrder: memberRecord.displayOrder,
        })
      } else {
        saved = await adminApi.createTeamMember({
          name: memberRecord.name,
          role: memberRecord.role,
          major: memberRecord.major,
          bio: memberRecord.bio,
          email: memberRecord.email,
          linkedin: memberRecord.linkedin,
          imageUrl: imageUrlValue,
          displayOrder: memberRecord.displayOrder ?? members.length,
        })
      }

      setMembers((prev) =>
        prev.map((member) =>
          member.clientId === memberRecord.clientId
            ? {
                ...member,
                ...saved,
                imageUrl: resolveMediaUrl(saved.imageUrl) ?? saved.imageUrl ?? undefined,
                clientId: member.clientId,
                isSaving: false,
                isNew: false,
                pendingFile: null,
                previewUrl: resolveMediaUrl(saved.imageUrl) ?? saved.imageUrl ?? null,
              }
            : member,
        ),
      )
      setError(null)
      toast.success(memberRecord.id ? "Team member updated" : "Team member created")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save member"
      setError(message)
      toast.error("Unable to save member", { description: message })
      setMembers((prev) =>
        prev.map((member) =>
          member.clientId === memberRecord.clientId ? { ...member, isSaving: false } : member,
        ),
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Team Management</h2>
          <p className="text-muted-foreground">Manage executive board members and leadership</p>
        </div>
        <Button onClick={addMember} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Member
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading team roster...
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !hasMembers && (
        <div className="rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center text-muted-foreground">
          No team members yet. Add leaders to showcase your executive board.
        </div>
      )}

      {members.map((member) => (
        <Card key={member.clientId} className={cn("transition-opacity", member.isDeleting && "opacity-50")}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-foreground">{member.name || "New Team Member"}</CardTitle>
                <CardDescription>{member.role || "Position"}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(member)}
                disabled={member.isSaving || member.isDeleting}
                className="text-destructive hover:text-destructive"
              >
                {member.isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`name-${member.clientId}`} className="text-foreground">
                  Full Name
                </Label>
                <Input
                  id={`name-${member.clientId}`}
                  value={member.name}
                  onChange={(event) => updateField(member.clientId, "name", event.target.value)}
                  placeholder="Enter member name"
                  className="bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`role-${member.clientId}`} className="text-foreground">
                  Role/Position
                </Label>
                <Input
                  id={`role-${member.clientId}`}
                  value={member.role}
                  onChange={(event) => updateField(member.clientId, "role", event.target.value)}
                  placeholder="President, VP, etc."
                  className="bg-background text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`major-${member.clientId}`} className="text-foreground">
                Major & Class Year
              </Label>
              <Input
                id={`major-${member.clientId}`}
                value={member.major ?? ""}
                onChange={(event) => updateField(member.clientId, "major", event.target.value)}
                placeholder="Marketing, Class of 2025"
                className="bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`bio-${member.clientId}`} className="text-foreground">
                Biography
              </Label>
              <Textarea
                id={`bio-${member.clientId}`}
                value={member.bio ?? ""}
                onChange={(event) => updateField(member.clientId, "bio", event.target.value)}
                placeholder="Enter member biography"
                rows={4}
                className="bg-background text-foreground"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3 md:items-end">
              <div className="space-y-2">
                <Label htmlFor={`email-${member.clientId}`} className="text-foreground">
                  <Mail className="mr-1 inline h-4 w-4" />
                  Email
                </Label>
                <Input
                  id={`email-${member.clientId}`}
                  type="email"
                  value={member.email ?? ""}
                  onChange={(event) => updateField(member.clientId, "email", event.target.value)}
                  placeholder="email@cmich.edu"
                  className="bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`linkedin-${member.clientId}`} className="text-foreground">
                  <Linkedin className="mr-1 inline h-4 w-4" />
                  LinkedIn
                </Label>
                <Input
                  id={`linkedin-${member.clientId}`}
                  type="url"
                  value={member.linkedin ?? ""}
                  onChange={(event) => updateField(member.clientId, "linkedin", event.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`order-${member.clientId}`} className="text-foreground">
                  Display Order
                </Label>
                <Input
                  id={`order-${member.clientId}`}
                  type="number"
                  min={0}
                  value={member.displayOrder ?? 0}
                  onChange={(event) => updateField(member.clientId, "displayOrder", event.target.value)}
                  className="bg-background text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`image-${member.clientId}`} className="text-foreground">
                Profile Image
              </Label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-28 w-full overflow-hidden rounded-lg border border-dashed border-border bg-muted/50 sm:w-40">
                  {member.previewUrl || member.imageUrl ? (
                    <div
                      className="flex h-full w-full items-center justify-center bg-cover bg-center text-xs text-muted-foreground"
                      style={{ backgroundImage: `url(${member.previewUrl ?? member.imageUrl ?? ""})` }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No headshot selected
                    </div>
                  )}
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto">
                  <Input
                    id={`image-${member.clientId}`}
                    type="file"
                    accept="image/*"
                    disabled={member.isSaving || member.isDeleting}
                    className="cursor-pointer bg-background text-foreground file:mr-4 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
                    onChange={(event) => {
                      handleImageSelection(member.clientId, event.target.files)
                      event.target.value = ""
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Upload JPG, PNG, or WEBP up to 10MB.</p>
                  {(member.previewUrl ?? member.imageUrl) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleClearImage(member.clientId)}
                      disabled={member.isSaving || member.isDeleting}
                    >
                      Remove image
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <Button
              className="w-full gap-2"
              onClick={() => handleSave(member)}
              disabled={member.isSaving || member.isDeleting}
            >
              {member.isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {member.id ? "Update Member" : "Save Member"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
