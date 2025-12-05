import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"

import "./globals.css"
import { cn } from "@/lib/utils"
import { BackendValidator } from "@/components/backend-validator"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "AMA at CMU | American Marketing Association",
  description:
    "Join the American Marketing Association at Central Michigan University - Connect, Learn, and Grow Your Marketing Career",
  generator: "v0.app",
  keywords: [
    "AMA",
    "American Marketing Association",
    "CMU",
    "Central Michigan University",
    "Marketing",
    "Student Organization",
  ],
  authors: [{ name: "AMA at CMU" }],
  openGraph: {
    title: "AMA at CMU | American Marketing Association",
    description:
      "Join the American Marketing Association at Central Michigan University - Connect, Learn, and Grow Your Marketing Career",
    type: "website",
    locale: "en_US",
    siteName: "AMA at CMU",
  },
  twitter: {
    card: "summary_large_image",
    title: "AMA at CMU | American Marketing Association",
    description: "Join the American Marketing Association at Central Michigan University",
  },
  icons: {
    icon: [
      {
        url: "/favicon.jpg",
        type: "image/jpeg",
        rel: "icon",
        sizes: "32x32",
      },
      {
        url: "/favicon.jpg",
        type: "image/jpeg",
        rel: "shortcut icon",
      },
    ],
    shortcut: [
      {
        url: "/favicon.jpg",
      },
    ],
    apple: [
      {
        url: "/favicon.jpg",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={cn("font-sans antialiased", geistSans.variable, geistMono.variable)}>
        <BackendValidator>
          {children}
          <Analytics />
          <Toaster position="top-right" richColors />
        </BackendValidator>
      </body>
    </html>
  )
}
