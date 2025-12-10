"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@supabase/supabase-js"

const STORAGE_KEY = "berry:favorites"

export default function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const supabaseRef = useRef(
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    )
  )

  // Load favorites from Supabase on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabaseRef.current.auth.getUser()

        if (!user) {
          // Fallback to localStorage if not authenticated
          const raw = window.localStorage.getItem(STORAGE_KEY)
          if (raw) {
            try {
              const arr = JSON.parse(raw) as string[]
              setFavorites(new Set(arr))
            } catch {
              // ignore parse errors
            }
          }
          setLoading(false)
          return
        }

        setUserId(user.id)

        // Load from Supabase
        const { data, error } = await supabaseRef.current
          .from("student_favorites")
          .select("opportunity_id")
          .eq("student_id", user.id)

        if (error) {
          console.error("Error fetching favorites from DB:", error)
          throw error
        }

        const favoriteIds = new Set(data?.map((item) => item.opportunity_id) || [])
        setFavorites(favoriteIds)
      } catch (err) {
        console.error("Error loading favorites:", err)
        // Fallback to localStorage
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY)
          if (raw) {
            const arr = JSON.parse(raw) as string[]
            setFavorites(new Set(arr))
          }
        } catch {
          // ignore
        }
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()
  }, [])

  const toggleFavorite = useCallback(
    async (id: string) => {
      const isFav = favorites.has(id)

      // Update local state optimistically
      setFavorites((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })

      // If not authenticated, just use localStorage
      if (!userId) {
        try {
          setFavorites((prev) => {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(prev)))
            return prev
          })
        } catch {
          // ignore
        }
        return
      }

      // Sync with Supabase
      try {
        if (isFav) {
          // Remove favorite
          const { error } = await supabaseRef.current
            .from("student_favorites")
            .delete()
            .eq("student_id", userId)
            .eq("opportunity_id", id)

          if (error) {
            console.error("Error deleting favorite:", error.message, error.code)
            throw new Error(error.message || "Failed to delete favorite")
          }
        } else {
          // Add favorite
          const { error } = await supabaseRef.current
            .from("student_favorites")
            .insert({
              student_id: userId,
              opportunity_id: id,
            })

          if (error) {
            console.error("Error inserting favorite:", error.message, error.code)
            throw new Error(error.message || "Failed to add favorite")
          }
        }
      } catch (err) {
        console.error("Error toggling favorite:", err)
        // Revert optimistic update on error
        setFavorites((prev) => {
          const next = new Set(prev)
          if (isFav) {
            next.add(id)
          } else {
            next.delete(id)
          }
          return next
        })
      }
    },
    [favorites, userId]
  )

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites])

  const clear = useCallback(async () => {
    if (!userId) {
      setFavorites(new Set())
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
      return
    }

    try {
      const { error } = await supabaseRef.current
        .from("student_favorites")
        .delete()
        .eq("student_id", userId)

      if (error) {
        console.error("Error clearing favorites:", error.message)
        throw error
      }
      setFavorites(new Set())
    } catch (err) {
      console.error("Error clearing favorites:", err)
    }
  }, [userId])

  return { favorites, toggleFavorite, isFavorite, clear, loading }
}
