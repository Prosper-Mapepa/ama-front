/**
 * Validates backend URL connectivity and SSL certificate
 * Optimized for Netlify deployments and Render backend
 * Returns true if the backend is accessible and SSL is valid (for HTTPS URLs)
 */
export async function validateBackendUrl(url: string, timeout?: number): Promise<{
  valid: boolean
  error?: string
}> {
  // Render backends can be slow to wake up (cold starts), use longer timeout
  const isRenderBackend = url.includes("render.com") || url.includes("onrender.com")
  const defaultTimeout = isRenderBackend ? 20000 : 15000 // 20s for Render, 15s for others
  
  const validationTimeout = timeout ?? defaultTimeout
  try {
    // For production HTTPS URLs (like Render), we want to validate SSL properly
    const isHttps = url.startsWith("https://")
    
    // Optimize timeout for Netlify serverless environment
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), validationTimeout)

    // Try multiple endpoints in order of preference
    // For Render/Netlify, /settings is a good lightweight endpoint
    const endpoints = [
      `${url}/settings`, // Most likely to exist and be lightweight (returns array)
      `${url.replace(/\/api\/?$/, "")}/health`, // Health check endpoint (if available)
      url, // Just the base API URL
    ]

    let lastError: Error | null = null

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "HEAD",
          signal: controller.signal,
          cache: "no-store",
          // For CORS issues in Netlify, credentials might help
          credentials: "omit",
        })
        
        clearTimeout(timeoutId)
        
        // Any response (even 401/403/404) means SSL is valid and backend is reachable
        // 404 might mean endpoint doesn't exist, but SSL is still valid
        if (response.ok || response.status === 401 || response.status === 403 || response.status === 404) {
          return {
            valid: true,
          }
        }
        
        // If we get a 5xx error, backend might be down but SSL is valid
        if (response.status >= 500) {
          return {
            valid: true, // SSL is valid, just backend having issues
            error: `Backend returned ${response.status}. Server may be experiencing issues.`,
          }
        }
        
        // Any other response means we got through, SSL is valid
        return {
          valid: true,
        }
      } catch (error) {
        if (error instanceof Error) {
          lastError = error
          
          // If it's an abort (timeout), break and report timeout
          if (error.name === "AbortError") {
            clearTimeout(timeoutId)
            return {
              valid: false,
              error: "Backend validation timeout. Please check your connection.",
            }
          }

          // Check for SSL/TLS related errors
          const message = error.message.toLowerCase()
          if (
            message.includes("certificate") ||
            message.includes("ssl") ||
            message.includes("tls") ||
            message.includes("cert") ||
            message.includes("self-signed") ||
            message.includes("unable to verify") ||
            message.includes("certificate has expired") ||
            message.includes("certificate authority")
          ) {
            clearTimeout(timeoutId)
            return {
              valid: false,
              error: `SSL certificate error: ${error.message}`,
            }
          }

          // If it's a network error (not SSL), try next endpoint
          // Network errors could mean the endpoint doesn't exist, but SSL might still be valid
          continue
        }
        lastError = error instanceof Error ? error : new Error(String(error))
      }
    }

    clearTimeout(timeoutId)

    // If we've tried all endpoints and failed, check what the error was
    if (lastError) {
      const message = lastError.message.toLowerCase()
      
      // Final check: if it's a CORS or network error, SSL might be valid but endpoint unreachable
      // For Netlify, CORS errors are common, but we still want to validate SSL
      if (
        message.includes("cors") ||
        message.includes("network") ||
        message.includes("failed to fetch") ||
        message.includes("load failed") ||
        message.includes("refused to connect")
      ) {
        // Try one more time with a GET request to verify SSL (even if CORS fails)
        // The fact that we get a CORS error means SSL worked!
        const finalController = new AbortController()
        const finalTimeoutId = setTimeout(() => finalController.abort(), 5000)
        
        try {
          // Try a simple GET request - if we get CORS error, SSL is valid
          const testResponse = await fetch(url, {
            method: "GET",
            signal: finalController.signal,
            cache: "no-store",
            credentials: "omit",
          })
          
          clearTimeout(finalTimeoutId)
          // If we got any response, SSL is valid
          return { valid: true }
        } catch (finalError) {
          clearTimeout(finalTimeoutId)
          
          // CORS errors actually mean SSL is valid (we got through SSL, just CORS blocked)
          if (finalError instanceof Error) {
            const finalMessage = finalError.message.toLowerCase()
            if (finalMessage.includes("cors")) {
              return {
                valid: true, // SSL is valid, just CORS issue
                error: "Backend is reachable, but CORS configuration may need adjustment.",
              }
            }
          }
          
          // For HTTPS URLs, if we can't connect at all, it might be SSL issue
          if (isHttps) {
            return {
              valid: false,
              error: "Unable to establish secure connection to backend. Please check SSL certificate.",
            }
          }
          
          return {
            valid: false,
            error: "Backend is unreachable. Please check if the server is running and accessible.",
          }
        }
      }

      return {
        valid: false,
        error: lastError.message || "Failed to connect to backend",
      }
    }

    return {
      valid: false,
      error: "Unknown error during backend validation",
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Failed to validate backend URL",
    }
  }
}

/**
 * Gets the backend base URL from environment variables
 */
export function getBackendUrl(): string {
  if (typeof window === "undefined") {
    // Server-side: check server-only env first, then public
    return (
      process.env.API_BASE_URL?.replace(/\/$/, "") ??
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
      "http://localhost:4000/api"
    )
  }
  
  // Client-side: only public env vars are available
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:4000/api"
  )
}
