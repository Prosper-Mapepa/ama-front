"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import logo from "../../assets/logo.png"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/events", label: "Events" },
    { href: "/gallery", label: "Gallery" },
    { href: "/membership", label: "FAQs" },
    { href: "/contact", label: "Contact" },
    // { href: "/admin", label: "Admin" }, // Added admin link to navigation
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "border-border bg-background/95 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/80"
          : "border-transparent bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40",
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative h-10 sm:h-12 transition-transform duration-300 group-hover:scale-105">
              <Image
                src={logo}
                alt="AMA at CMU"
                priority
                className="h-full w-auto object-contain rounded-lg"
              />
            </div>
            <div className="min-w-0 text-left text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
              <span className="block text-[0.72rem] font-semibold uppercase tracking-[0.28em] leading-tight sm:hidden">
                Central Michigan University
              </span>
              <div className="hidden sm:flex sm:flex-col sm:leading-tight">
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.25em] lg:text-xs lg:tracking-[0.3em]">
                  Central Michigan
                </span>
                <span className="mt-0.5 text-[0.72rem] font-semibold uppercase tracking-[0.25em] lg:text-xs lg:tracking-[0.3em]">
                  University
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative text-sm font-semibold transition-all duration-300 hover:text-foreground",
                  isActive(link.href) ? "text-foreground" : "text-foreground/70",
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute -bottom-1 left-0 h-0.5 w-full bg-gradient-to-r from-primary via-accent to-primary animate-gradient" />
                )}
              </Link>
            ))}
            <Button
              size="sm"
              className="ml-2 bg-gradient-to-r from-primary to-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              asChild
            >
              <Link href="/membership/register">Become a Member</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="group md:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            <div className="rounded-lg p-2 transition-colors duration-300 group-hover:bg-muted">
              {isOpen ? (
                <X className="h-6 w-6 text-foreground transition-transform duration-300 group-hover:rotate-90" />
              ) : (
                <Menu className="h-6 w-6 text-foreground transition-transform duration-300 group-hover:scale-110" />
              )}
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out md:hidden",
            isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="border-t border-border py-4">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-all duration-300 hover:translate-x-2 hover:text-foreground",
                    isActive(link.href) ? "text-foreground" : "text-foreground/70",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Button size="sm" className="w-full bg-gradient-to-r from-primary to-primary/90" asChild>
                <Link href="/membership/register">Become a Member</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
