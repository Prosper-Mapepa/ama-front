"use client"

import { useEffect, useState, type ReactNode } from "react"
import Image from "next/image"
import { validateBackendUrl, getBackendUrl } from "@/lib/backend-validation"
import cmuLogo from "../../assets/cmulogo.png"

interface BackendValidatorProps {
  children: ReactNode
  fallback?: ReactNode
  onValidationComplete?: (valid: boolean) => void
  /**
   * If true, site will load even if validation fails (non-blocking)
   * @default true
   */
  nonBlocking?: boolean
  /**
   * Show a warning banner instead of blocking the site
   * @default true
   */
  showWarning?: boolean
}

export function BackendValidator({
  children,
  fallback,
  onValidationComplete,
  nonBlocking = true,
  showWarning = true,
}: BackendValidatorProps) {
  // In non-blocking mode, site loads immediately while validation runs in background
  const [isValidating, setIsValidating] = useState(!nonBlocking)
  const [isValid, setIsValid] = useState(nonBlocking) // Start as true if non-blocking (allow site to load immediately)
  const [error, setError] = useState<string | null>(null)
  const [showErrorBanner, setShowErrorBanner] = useState(false)

  useEffect(() => {
    let mounted = true

    async function validateBackend() {
      const backendUrl = getBackendUrl()
      
      // Skip validation if explicitly disabled via environment variable
      const skipValidation = process.env.NEXT_PUBLIC_SKIP_BACKEND_VALIDATION === "true"
      
      // Skip validation for localhost in development (unless explicitly enabled)
      const isLocalhost = backendUrl.includes("localhost") || backendUrl.includes("127.0.0.1")
      const isDevelopment = process.env.NODE_ENV === "development"
      
      // Skip validation if no backend URL is configured (edge case)
      if (!backendUrl || backendUrl === "undefined") {
        if (mounted) {
          setIsValid(true) // Allow site to load, let it fail gracefully later
          setIsValidating(false)
          onValidationComplete?.(true)
        }
        return
      }
      
      if (skipValidation || (isLocalhost && isDevelopment)) {
        if (mounted) {
          setIsValid(true)
          setIsValidating(false)
          onValidationComplete?.(true)
        }
        return
      }

      // Start validation (only show loading if blocking mode)
      if (!nonBlocking && mounted) {
        setIsValidating(true)
      }

      try {
        // Use longer timeout for Render backends (cold start delays)
        const timeout = backendUrl.includes("render.com") || backendUrl.includes("onrender.com") 
          ? 20000 
          : 15000
        const result = await validateBackendUrl(backendUrl, timeout)
        
        if (mounted) {
          setIsValid(result.valid)
          setError(result.error || null)
          setIsValidating(false)
          setShowErrorBanner(!result.valid && showWarning)
          
          // If non-blocking, always allow site to load
          if (nonBlocking && !result.valid) {
            setIsValid(true) // Allow site to load even if validation failed
          }
          
          onValidationComplete?.(result.valid)
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : "Failed to validate backend"
          setIsValid(nonBlocking) // Allow site to load if non-blocking
          setError(errorMessage)
          setIsValidating(false)
          setShowErrorBanner(nonBlocking && showWarning) // Show banner if non-blocking
          onValidationComplete?.(false)
        }
      }
    }

    // Validate backend URL on mount
    validateBackend()

    return () => {
      mounted = false
    }
  }, [onValidationComplete, nonBlocking, showWarning])

  // Show loading state while validating
  if (isValidating) {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
          <div className="flex flex-col items-center gap-8 px-4">
            <div className="relative h-24 w-24 animate-pulse">
              <Image
                src={cmuLogo}
                alt="CMU Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-r-secondary/30" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-primary">Connecting to AMA at CMU</p>
                <p className="mt-2 text-sm text-muted-foreground">Validating secure connection...</p>
              </div>
            </div>
          </div>
        </div>
      )
    )
  }

  // Show error state if validation failed AND it's blocking
  if (!isValid && !nonBlocking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
        <div className="max-w-md rounded-xl border-2 border-[oklch(0.57_0.22_25.51)]/30 bg-card shadow-lg p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative h-20 w-20">
              <Image
                src={cmuLogo}
                alt="CMU Logo"
                fill
                className="object-contain opacity-80"
                priority
              />
            </div>
          </div>
          <h2 className="mb-3 text-2xl font-bold text-primary">Connection Error</h2>
          <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
            {error || "Unable to connect to the backend server. Please check your connection and try again."}
          </p>
          <button
            onClick={async () => {
              setIsValidating(true)
              setIsValid(false)
              setError(null)
              
              // Re-validate backend
              const backendUrl = getBackendUrl()
              const timeout = backendUrl.includes("render.com") || backendUrl.includes("onrender.com") 
                ? 20000 
                : 15000
              try {
                const result = await validateBackendUrl(backendUrl, timeout)
                setIsValid(result.valid)
                setError(result.error || null)
                setIsValidating(false)
                setShowErrorBanner(!result.valid && showWarning)
                onValidationComplete?.(result.valid)
              } catch (err) {
                setIsValid(false)
                setError(err instanceof Error ? err.message : "Failed to validate backend")
                setIsValidating(false)
                setShowErrorBanner(showWarning)
                onValidationComplete?.(false)
              }
            }}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary-dark hover:shadow-lg active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Backend is valid OR non-blocking mode, render children with optional warning banner
  return (
    <>
      {showErrorBanner && error && (
        <div className="sticky top-0 z-50 border-b-2 border-secondary/40 bg-gradient-to-r from-secondary/10 via-secondary/5 to-transparent px-4 py-3 shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/20 ring-2 ring-secondary/30">
                <span className="text-sm font-bold text-primary">!</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">
                  Connection Warning
                </p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  setIsValidating(true)
                  setShowErrorBanner(false)
                  
                  const backendUrl = getBackendUrl()
                  const timeout = backendUrl.includes("render.com") || backendUrl.includes("onrender.com") 
                    ? 20000 
                    : 15000
                  try {
                    const result = await validateBackendUrl(backendUrl, timeout)
                    setIsValid(result.valid)
                    setError(result.error || null)
                    setIsValidating(false)
                    setShowErrorBanner(!result.valid && showWarning)
                    onValidationComplete?.(result.valid)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to validate backend")
                    setIsValidating(false)
                    setShowErrorBanner(showWarning)
                    onValidationComplete?.(false)
                  }
                }}
                className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-dark hover:shadow-md active:scale-95"
              >
                Retry
              </button>
              <button
                onClick={() => setShowErrorBanner(false)}
                className="rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  )
}
