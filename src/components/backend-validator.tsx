"use client"

import { useEffect, useState, type ReactNode } from "react"
import { validateBackendUrl, getBackendUrl } from "@/lib/backend-validation"

interface BackendValidatorProps {
  children: ReactNode
  fallback?: ReactNode
  onValidationComplete?: (valid: boolean) => void
}

export function BackendValidator({
  children,
  fallback,
  onValidationComplete,
}: BackendValidatorProps) {
  const [isValidating, setIsValidating] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      try {
        const result = await validateBackendUrl(backendUrl)
        
        if (mounted) {
          setIsValid(result.valid)
          setError(result.error || null)
          setIsValidating(false)
          onValidationComplete?.(result.valid)
        }
      } catch (err) {
        if (mounted) {
          setIsValid(false)
          setError(err instanceof Error ? err.message : "Failed to validate backend")
          setIsValidating(false)
          onValidationComplete?.(false)
        }
      }
    }

    // Validate backend URL on mount
    validateBackend()

    return () => {
      mounted = false
    }
  }, [onValidationComplete])

  // Show loading state while validating
  if (isValidating) {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Validating backend connection...</p>
          </div>
        </div>
      )
    )
  }

  // Show error state if validation failed
  if (!isValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-destructive">Backend Connection Error</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {error || "Unable to connect to the backend server. Please check your connection and try again."}
          </p>
          <button
            onClick={async () => {
              setIsValidating(true)
              setIsValid(false)
              setError(null)
              
              // Re-validate backend
              const backendUrl = getBackendUrl()
              try {
                const result = await validateBackendUrl(backendUrl)
                setIsValid(result.valid)
                setError(result.error || null)
                setIsValidating(false)
                onValidationComplete?.(result.valid)
              } catch (err) {
                setIsValid(false)
                setError(err instanceof Error ? err.message : "Failed to validate backend")
                setIsValidating(false)
                onValidationComplete?.(false)
              }
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Backend is valid, render children
  return <>{children}</>
}