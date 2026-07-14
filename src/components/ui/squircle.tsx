"use client"

import * as React from "react"
import { getSvgPath } from "figma-squircle"

// Evite le warning useLayoutEffect cote serveur.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

export type SquircleOptions = {
  /** Rayon de coin en px (comme border-radius). Ignore si radiusRatio est fourni. */
  radius?: number
  /** Rayon en fraction de la plus petite dimension (0–0.5). Pour pills/avatars
   *  dont le rayon depend de la taille (ex 0.5 = pill/cercle -> superellipse). */
  radiusRatio?: number
  /** Lissage Apple : 0 = arc classique, 0.6 ≈ icone iOS, 1 = max. */
  smoothing?: number
}

/**
 * Applique une forme "squircle" (superellipse, courbure continue G2) a un
 * element via mask-image. Le path est regenere a la taille reelle (ResizeObserver)
 * -> coins uniformes quel que soit le ratio, zero distorsion. Universel (mask
 * supporte partout). Le fill ET le border suivent la forme ; combiner avec
 * `filter: drop-shadow(...)` pour une ombre elle aussi squircle.
 */
export function useSquircle<T extends HTMLElement>({
  radius = 12,
  radiusRatio,
  smoothing = 0.6,
}: SquircleOptions = {}) {
  const ref = React.useRef<T | null>(null)

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const apply = () => {
      const { width, height } = el.getBoundingClientRect()
      if (!width || !height) return
      const base =
        radiusRatio != null ? Math.min(width, height) * radiusRatio : radius
      const path = getSvgPath({
        width,
        height,
        cornerRadius: Math.min(base, width / 2, height / 2),
        cornerSmoothing: smoothing,
      })
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><path d='${path}' fill='#000'/></svg>`
      const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
      el.style.setProperty("mask-image", url)
      el.style.setProperty("-webkit-mask-image", url)
      el.style.setProperty("mask-size", "100% 100%")
      el.style.setProperty("-webkit-mask-size", "100% 100%")
      el.style.setProperty("mask-repeat", "no-repeat")
    }

    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [radius, radiusRatio, smoothing])

  return ref
}

/** Fusionne un ref interne (squircle) avec un ref transfere (forwardRef). */
export function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (node) => {
    for (const r of refs) {
      if (!r) continue
      if (typeof r === "function") r(node)
      else (r as React.MutableRefObject<T | null>).current = node
    }
  }
}
