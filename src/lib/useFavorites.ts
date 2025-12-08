"use client"

import { useEffect, useState, useCallback } from "react"

const STORAGE_KEY = "berry:favorites"

export default function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const arr = JSON.parse(raw) as string[]
        setFavorites(new Set(arr))
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favorites)))
    } catch {
      // ignore
    }
  }, [favorites])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites])

  const clear = useCallback(() => setFavorites(new Set()), [])

  return { favorites, toggleFavorite, isFavorite, clear }
}
