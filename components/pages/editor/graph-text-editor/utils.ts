import type { GraphDirection, IndexMode, ValidationIssue } from "@/types"
import { INTEGER_TOKEN_RE, NUMBER_TOKEN_RE } from "@/utils"

export function parseIntegerToken(token: string): number | null {
  if (!INTEGER_TOKEN_RE.test(token)) return null
  const value = Number(token)
  return Number.isInteger(value) ? value : null
}

export function formatIssueLineLabel(line: number) {
  if (line === 1) return "Node Count"
  return `Line ${line - 1}`
}

export function validateGraphText(
  text: string,
  indexMode: IndexMode,
  direction: GraphDirection
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const lines = text.split("\n")
  const firstLineRaw = (lines[0] || "").trim()
  const nodeCount = parseIntegerToken(firstLineRaw)
  const hasValidNodeCount =
    firstLineRaw !== "" && nodeCount !== null && nodeCount >= 0

  if (!hasValidNodeCount) {
    issues.push({
      line: 1,
      message: "Node count must be a non-negative integer.",
    })
  }

  const offset = indexMode === "1-index" ? 1 : 0
  const seenEdges = new Map<string, number>()

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i].trim()
    if (!raw) continue

    const lineNo = i + 1
    const parts = raw.split(/\s+/)
    if (parts.length < 2) {
      issues.push({
        line: lineNo,
        message: "Each edge line needs two node indices.",
      })
      continue
    }

    const a = parseIntegerToken(parts[0])
    const b = parseIntegerToken(parts[1])
    if (a === null || b === null) {
      issues.push({ line: lineNo, message: "Node indices must be integers." })
      continue
    }

    const src = a - offset
    const tgt = b - offset

    if (src === tgt) {
      issues.push({ line: lineNo, message: "Self-loop edges are not allowed." })
      continue
    }

    if (
      hasValidNodeCount &&
      (src < 0 || src >= nodeCount! || tgt < 0 || tgt >= nodeCount!)
    ) {
      issues.push({
        line: lineNo,
        message: `Index out of range for node count ${nodeCount}.`,
      })
      continue
    }

    if (parts.length >= 3) {
      const third = parts[2]
      const thirdAsNumber = Number(third)
      const looksLikeWeightPrefix =
        third.startsWith("w:") || third.startsWith("weight=")

      if (looksLikeWeightPrefix) {
        issues.push({
          line: lineNo,
          message:
            "Weight must be plain number after target (e.g. `0 1 2.5 label`).",
        })
      } else if (
        NUMBER_TOKEN_RE.test(third) &&
        !Number.isFinite(thirdAsNumber)
      ) {
        issues.push({
          line: lineNo,
          message: "Edge weight must be a finite number.",
        })
      }
    }

    const edgeKey =
      direction === "undirected"
        ? src < tgt
          ? `${src}-${tgt}`
          : `${tgt}-${src}`
        : `${src}->${tgt}`
    const previousLine = seenEdges.get(edgeKey)
    if (previousLine) {
      issues.push({
        line: lineNo,
        message: `Duplicate edge (already defined on line ${previousLine - 1}).`,
      })
      continue
    }
    seenEdges.set(edgeKey, lineNo)
  }

  return issues
}
