import { Config } from "@/config"
import type { ShareableGraphState } from "@/types"

export type { ShareableGraphState } from "@/types"

const SHARE_PARAM = Config.keys.shareParam

function bytesToBase64(bytes: Uint8Array) {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToBytes(base64: string) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value)
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function fromBase64Url(value: string) {
  const padded =
    value.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((value.length + 3) % 4)
  const bytes = base64ToBytes(padded)
  return new TextDecoder().decode(bytes)
}

export function isShareableGraphState(
  value: unknown
): value is ShareableGraphState {
  if (!value || typeof value !== "object") return false
  const candidate = value as Record<string, unknown>
  const canvasSize = candidate.canvasSize
  const canvasCandidate =
    canvasSize && typeof canvasSize === "object" && !Array.isArray(canvasSize)
      ? (canvasSize as Record<string, unknown>)
      : null
  const canvasWidth = canvasCandidate?.width
  const canvasHeight = canvasCandidate?.height
  const hasValidCanvasSize =
    canvasSize === undefined ||
    (typeof canvasWidth === "number" &&
      Number.isFinite(canvasWidth) &&
      canvasWidth >= 0 &&
      typeof canvasHeight === "number" &&
      Number.isFinite(canvasHeight) &&
      canvasHeight >= 0)
  return (
    Array.isArray(candidate.nodes) &&
    Array.isArray(candidate.edges) &&
    typeof candidate.direction === "string" &&
    typeof candidate.indexMode === "string" &&
    !!candidate.config &&
    typeof candidate.config === "object" &&
    !!candidate.customLabels &&
    typeof candidate.customLabels === "object" &&
    hasValidCanvasSize
  )
}

export function encodeGraphStateForShare(state: ShareableGraphState) {
  return toBase64Url(JSON.stringify(state))
}

export function decodeGraphStateFromShare(value: string) {
  try {
    const parsed = JSON.parse(fromBase64Url(value)) as unknown
    return isShareableGraphState(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function buildShareUrl(baseUrl: string, encodedState: string) {
  const url = new URL(baseUrl)
  url.searchParams.set(SHARE_PARAM, encodedState)
  return url.toString()
}

export function getSharedGraphFromUrl(urlValue: string) {
  try {
    const url = new URL(urlValue)
    const raw = url.searchParams.get(SHARE_PARAM)
    if (!raw) return null
    return decodeGraphStateFromShare(raw)
  } catch {
    return null
  }
}
