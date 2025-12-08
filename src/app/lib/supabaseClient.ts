import { createClient, SupportedStorage } from '@supabase/supabase-js'

// Helper function to check if we're in a browser environment
function supportsLocalStorage() {
  try {
    return typeof window !== 'undefined' && window.localStorage != null
  } catch {
    return false
  }
}

// Cookie utility functions
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}

function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof document === 'undefined') return
  
  const expires = new Date()
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
  
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; ${
    process.env.NODE_ENV === 'production' ? 'Secure;' : ''
  }`
}

function removeCookie(name: string): void {
  if (typeof document === 'undefined') return
  
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;`
}

// Custom storage adapter that uses cookies as primary storage with localStorage fallback
const customStorageAdapter: SupportedStorage = {
  getItem: (key: string) => {
    // Try to get from cookies first
    const cookieValue = getCookie(key)
    if (cookieValue) {
      try {
        // Cookies store JSON stringified values, so we need to parse them
        return cookieValue
      } catch {
        console.warn('Failed to parse cookie value:', e)
      }
    }
    
    // Fallback to localStorage if available
    if (supportsLocalStorage()) {
      return globalThis.localStorage.getItem(key)
    }
    
    return null
  },
  
  setItem: (key: string, value: string) => {
    // Store in cookies
    setCookie(key, value, 7) // Store for 7 days
    
    // Also store in localStorage as backup if available
    if (supportsLocalStorage()) {
      try {
        globalThis.localStorage.setItem(key, value)
      } catch {
        console.warn('Failed to set localStorage item:', e)
      }
    }
  },
  
  removeItem: (key: string) => {
    // Remove from cookies
    removeCookie(key)
    
    // Also remove from localStorage if available
    if (supportsLocalStorage()) {
      try {
        globalThis.localStorage.removeItem(key)
      } catch {
        console.warn('Failed to remove localStorage item:', e)
      }
    }
  },
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
      storage: customStorageAdapter,
    },
  }
)