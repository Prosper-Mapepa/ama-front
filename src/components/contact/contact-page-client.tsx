"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { CheckCircle2, Clock, Mail, MapPin, Send } from "lucide-react"

import type { ContactConfig, SocialConfig } from "@/lib/server-api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type ContactPageClientProps = {
  contact: ContactConfig
  socials: SocialConfig
}

export function ContactPageClient({ contact, socials }: ContactPageClientProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!statusMessage) return
    const timeout = window.setTimeout(() => setStatusMessage(null), 6000)
    return () => window.clearTimeout(timeout)
  }, [statusMessage])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    // TODO: Replace with backend integration (email service or API endpoint)
    console.log("Contact form submission:", formData)
    setStatusMessage("Thank you! Your message is on its way to the AMA CMU leadership team.")
    setFormData({ name: "", email: "", subject: "", message: "" })
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const socialButtons = [
    { label: "Instagram", href: socials.instagram },
    { label: "LinkedIn", href: socials.linkedin },
    // { label: "Facebook", href: socials.facebook },
    { label: "Website", href: socials.website },
  ].filter((item) => Boolean(item.href))

  return (
    <>
      <section className="border-b border-border px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="container mx-auto">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground text-balance sm:text-5xl">
              Get in Touch
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground text-pretty sm:text-xl">
              Have questions about AMA at CMU? We’d love to hear from you. Reach out and we’ll respond as soon as we can.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="container mx-auto">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
            {/* Contact Information */}
            <div className="space-y-6">
              <div>
                <h2 className="mb-6 text-2xl font-bold text-foreground">Contact Information</h2>

                <div className="space-y-4">
                  <Card>
                    <CardContent className="flex gap-4 pt-6">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="mb-1 font-semibold text-foreground text-base">Email</div>
                        {contact.email ? (
                          <a href={`mailto:${contact.email}`} className=" text-base text-muted-foreground hover:text-foreground">
                            {contact.email}
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground">Email address coming soon.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="flex gap-4 pt-6">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="mb-1 font-semibold text-foreground text-base">Location</div>
                        <p className="text-base text-muted-foreground">
                          {contact.locationLines.length
                            ? contact.locationLines.map((line) => (
                                <span key={line}>
                                  {line}
                                  <br />
                                </span>
                              ))
                            : "Central Michigan University, Mount Pleasant, MI"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {contact.officeHours ? (
                    <Card>
                      <CardContent className="flex gap-4 pt-6">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="mb-1 font-semibold text-foreground text-base">Office Hours</div>
                          <p className=" text-muted-foreground text-base">{contact.officeHours}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              </div>

              {socialButtons.length > 0 ? (
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-foreground">Connect With Us</h3>
                  <p className="mb-4 text-base leading-relaxed text-muted-foreground">
                    Follow us on social media to stay updated on events, news, and opportunities.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {socialButtons.map(({ label, href }) => (
                      <Button key={label} variant="outline" size="sm" asChild>
                        <a href={href} target="_blank" rel="noopener noreferrer">
                          {label}
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Contact Form */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="mb-6 text-2xl font-bold text-foreground">Send Us a Message</h2>

                {statusMessage ? (
                  <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-[0_18px_35px_-30px_rgba(16,185,129,0.55)]">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Message received!</p>
                      <p className="text-emerald-800/80">{statusMessage}</p>
                    </div>
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-6 ">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@cmich.edu"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-base">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is your message about?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-base">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us how we can help you..."
                      rows={6}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full text-base" size="lg">
                    Send Message
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="border-t border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8 ">
        <div className="container mx-auto text-base">
          <div className="mb-8 text-center text-base">
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Looking for Something Specific?</h2>
            <p className="text-muted-foreground">Quick links to common inquiries</p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent text-base" asChild>
              <a href="/membership">
                <div className="font-semibold">Membership</div>
                <div className="text-base text-muted-foreground">Join our chapter</div>
              </a>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent text-base" asChild>
              <a href="/events">
                <div className="font-semibold">Events</div>
                <div className="text-base text-muted-foreground">Upcoming activities</div>
              </a>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent text-base" asChild>
              <a href="/about#team">
                <div className="font-semibold">Leadership</div>
                <div className="text-base text-muted-foreground">Meet the team</div>
              </a>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent text-base  " asChild>
              <a href="/about">
                <div className="font-semibold">About</div>
                <div className="text-base text-muted-foreground">Learn more about us</div>
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

