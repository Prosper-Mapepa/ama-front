"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, Calendar, Users, ImageIcon, FileText, Settings, Shield, CreditCard, ListChecks } from "lucide-react"
import { ContentEditor } from "@/components/admin/content-editor"
import { EventsManager } from "@/components/admin/events-manager"
import { TeamManager } from "@/components/admin/team-manager"
import { GalleryManager } from "@/components/admin/gallery-manager"
import { AdminAuth } from "@/components/admin/admin-auth"
import { SettingsManager } from "@/components/admin/settings-manager"
import { MembershipsManager } from "@/components/admin/memberships-manager"
import { EventRsvpsManager } from "@/components/admin/event-rsvps-manager"
import { getAdminToken } from "@/lib/api"

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAdminToken()))

  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1 bg-muted/30">
        {/* Header */}
        <div className="border-b border-border bg-background">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage your AMA website content</p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Tabs defaultValue="home" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-8 lg:w-auto">
              <TabsTrigger value="home" className="gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Events</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Team</span>
              </TabsTrigger>
              <TabsTrigger value="gallery" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Gallery</span>
              </TabsTrigger>
              <TabsTrigger value="memberships" className="gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Memberships</span>
              </TabsTrigger>
              <TabsTrigger value="rsvps" className="gap-2">
                <ListChecks className="h-4 w-4" />
                <span className="hidden sm:inline">RSVPs</span>
              </TabsTrigger>
              <TabsTrigger value="about" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">About</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="space-y-6">
              <ContentEditor section="home" />
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              <EventsManager />
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <TeamManager />
            </TabsContent>

            <TabsContent value="gallery" className="space-y-6">
              <GalleryManager />
            </TabsContent>

            <TabsContent value="memberships" className="space-y-6">
              <MembershipsManager />
            </TabsContent>

            <TabsContent value="rsvps" className="space-y-6">
              <EventRsvpsManager />
            </TabsContent>

            <TabsContent value="about" className="space-y-6">
              <ContentEditor section="about" />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <SettingsManager />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
