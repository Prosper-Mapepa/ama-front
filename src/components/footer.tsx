import Link from "next/link"
import { Facebook, Instagram, Linkedin, Mail, Twitter, Youtube } from "lucide-react"

type FooterProps = {
  aboutSummary?: string
  contactEmail?: string
  locationLines?: string[]
  socials?: {
    instagram?: string
    linkedin?: string
    facebook?: string
    twitter?: string
    youtube?: string
    tiktok?: string
    website?: string
  }
}

const DEFAULT_ABOUT_SUMMARY =
  "The American Marketing Association at Central Michigan University empowers the next generation of marketers through immersive experiences, mentorship, and community."
const DEFAULT_CONTACT_EMAIL = "ama@cmich.edu"
const DEFAULT_LOCATION_LINES = ["Central Michigan University", "Mount Pleasant, MI 48859"]

export function Footer({
  aboutSummary = DEFAULT_ABOUT_SUMMARY,
  contactEmail = DEFAULT_CONTACT_EMAIL,
  locationLines = DEFAULT_LOCATION_LINES,
  socials,
}: FooterProps) {
  const socialLinks = [
    // {
    //   key: "email",
    //   href: contactEmail ? `mailto:${contactEmail}` : undefined,
    //   icon: Mail,
    //   label: "Email",
    // },
    {
      key: "linkedin",
      href: socials?.linkedin,
      icon: Linkedin,
      label: "LinkedIn",
    },
    {
      key: "instagram",
      href: socials?.instagram,
      icon: Instagram,
      label: "Instagram",
    },
    // {
    //   key: "facebook",
    //   href: socials?.facebook,
    //   icon: Facebook,
    //   label: "Facebook",
    // },
    // {
    //   key: "twitter",
    //   href: socials?.twitter,
    //   icon: Twitter,
    //   label: "Twitter / X",
    // },
    // {
    //   key: "youtube",
    //   href: socials?.youtube,
    //   icon: Youtube,
    //   label: "YouTube",
    // },
  ].filter((link) => Boolean(link.href))

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* About */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">AMA at CMU</h3>
            <p className="text-base leading-relaxed text-muted-foreground">{aboutSummary}</p>
            {locationLines?.length ? (
              <div className="text-sm text-primary">
                {locationLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-2 text-base">
              <li>
                <Link href="/about" className="text-muted-foreground transition-colors hover:text-foreground">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-muted-foreground transition-colors hover:text-foreground">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/about#team" className="text-muted-foreground transition-colors hover:text-foreground">
                  Team
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-muted-foreground transition-colors hover:text-foreground">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/membership" className="text-muted-foreground transition-colors hover:text-foreground">
                  Membership
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Resources</h3>
            <ul className="space-y-2 text-base">
              <li>
                <a
                  href="https://www.ama.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  AMA National
                </a>
              </li>
              <li>
                <a
                  href="https://www.cmich.edu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  CMU Website
                </a>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground transition-colors hover:text-foreground">
                  Contact Us
                </Link>
              </li>
            </ul>
            {socials?.website ? (
              <a
                href={socials.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-base text-primary transition-colors hover:text-foreground"
              >
                Visit our website
              </a>
            ) : null}
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Connect</h3>
            <div className="flex flex-wrap gap-4">
              {socialLinks.map(({ key, href, icon: Icon, label }) => (
                <a
                  key={key}
                  href={href}
                  target={key === "email" ? undefined : "_blank"}
                  rel={key === "email" ? undefined : "noopener noreferrer"}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={label}
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
            {/* {contactEmail ? <p className="text-base text-muted-foreground">{contactEmail}</p> : null} */}
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} American Marketing Association at Central Michigan University. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
