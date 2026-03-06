import type { GraphEdge, GraphNode, QTCell } from "@/types"

const DAMPING = 0.88
const BASE_REPULSION = 5000
const ATTRACTION = 0.008
const CENTER_GRAVITY = 0.015
const MIN_VELOCITY = 0.001
const BASE_IDEAL_LENGTH = 100

const ALPHA_INITIAL = 1.0
const ALPHA_MIN = 0.001
const ALPHA_DECAY = 0.0228

const BH_THETA_SQ = 0.81
const BH_NODE_THRESHOLD = 60

function qtNew(x0: number, y0: number, x1: number, y1: number): QTCell {
  return {
    x0,
    y0,
    x1,
    y1,
    cx: 0,
    cy: 0,
    mass: 0,
    bodyIdx: -1,
    children: [null, null, null, null],
  }
}

function qtQuadrant(px: number, py: number, mx: number, my: number): number {
  return (px > mx ? 1 : 0) + (py > my ? 2 : 0)
}

function qtChild(cell: QTCell, q: number): QTCell {
  if (cell.children[q]) return cell.children[q]!
  const mx = (cell.x0 + cell.x1) / 2
  const my = (cell.y0 + cell.y1) / 2
  const c = qtNew(
    q & 1 ? mx : cell.x0,
    q & 2 ? my : cell.y0,
    q & 1 ? cell.x1 : mx,
    q & 2 ? cell.y1 : my
  )
  cell.children[q] = c
  return c
}

function qtInsert(
  cell: QTCell,
  idx: number,
  px: number,
  py: number,
  xs: Float64Array,
  ys: Float64Array,
  depth: number
): void {
  if (depth > 40) return
  if (cell.mass === 0) {
    cell.bodyIdx = idx
    cell.mass = 1
    return
  }
  const mx = (cell.x0 + cell.x1) / 2
  const my = (cell.y0 + cell.y1) / 2
  if (cell.bodyIdx >= 0) {
    const ei = cell.bodyIdx
    cell.bodyIdx = -1
    cell.mass = 0
    qtInsert(
      qtChild(cell, qtQuadrant(xs[ei], ys[ei], mx, my)),
      ei,
      xs[ei],
      ys[ei],
      xs,
      ys,
      depth + 1
    )
  }
  qtInsert(
    qtChild(cell, qtQuadrant(px, py, mx, my)),
    idx,
    px,
    py,
    xs,
    ys,
    depth + 1
  )
}

function qtMass(cell: QTCell, xs: Float64Array, ys: Float64Array): void {
  if (cell.bodyIdx >= 0) {
    cell.cx = xs[cell.bodyIdx]
    cell.cy = ys[cell.bodyIdx]
    cell.mass = 1
    return
  }
  cell.cx = 0
  cell.cy = 0
  cell.mass = 0
  for (let i = 0; i < 4; i++) {
    const c = cell.children[i]
    if (!c) continue
    qtMass(c, xs, ys)
    cell.cx += c.cx * c.mass
    cell.cy += c.cy * c.mass
    cell.mass += c.mass
  }
  if (cell.mass > 0) {
    cell.cx /= cell.mass
    cell.cy /= cell.mass
  }
}

function qtForce(
  cell: QTCell,
  ni: number,
  nx: number,
  ny: number,
  rep: number,
  vxArr: Float64Array,
  vyArr: Float64Array
): void {
  if (cell.mass === 0) return
  const dx = cell.cx - nx
  const dy = cell.cy - ny
  const dSq = dx * dx + dy * dy
  if (cell.bodyIdx >= 0) {
    if (cell.bodyIdx !== ni && dSq > 0) {
      const d = Math.sqrt(dSq)
      const f = rep / Math.max(dSq, 1)
      vxArr[ni] -= (dx / d) * f
      vyArr[ni] -= (dy / d) * f
    }
    return
  }
  const w = cell.x1 - cell.x0
  if (dSq > 0 && (w * w) / dSq < BH_THETA_SQ) {
    const d = Math.sqrt(dSq)
    const f = (rep * cell.mass) / Math.max(dSq, 1)
    vxArr[ni] -= (dx / d) * f
    vyArr[ni] -= (dy / d) * f
    return
  }
  for (let i = 0; i < 4; i++) {
    if (cell.children[i])
      qtForce(cell.children[i]!, ni, nx, ny, rep, vxArr, vyArr)
  }
}

export class ForceSimulation {
  x: Float64Array = new Float64Array(0)
  y: Float64Array = new Float64Array(0)
  vx: Float64Array = new Float64Array(0)
  vy: Float64Array = new Float64Array(0)
  fixed: Uint8Array = new Uint8Array(0)
  count = 0
  nodeIds: string[] = []
  nodeLabels: string[] = []

  private idToIdx = new Map<string, number>()
  private eSrc: Int32Array = new Int32Array(0)
  private eTgt: Int32Array = new Int32Array(0)
  private eCount = 0

  alpha = ALPHA_INITIAL
  centerX = 300
  centerY = 250
  idealLength = 140
  boundaryMargin = 30

  syncNodes(nodes: GraphNode[]): void {
    const n = nodes.length
    if (n !== this.count) {
      this.x = new Float64Array(n)
      this.y = new Float64Array(n)
      this.vx = new Float64Array(n)
      this.vy = new Float64Array(n)
      this.fixed = new Uint8Array(n)
      this.count = n
    }
    this.nodeIds.length = 0
    this.nodeLabels.length = 0
    this.idToIdx.clear()
    for (let i = 0; i < n; i++) {
      const nd = nodes[i]
      this.nodeIds.push(nd.id)
      this.nodeLabels.push(nd.label)
      this.idToIdx.set(nd.id, i)
      this.x[i] = nd.x
      this.y[i] = nd.y
      this.vx[i] = nd.vx
      this.vy[i] = nd.vy
      this.fixed[i] = nd.fixed ? 1 : 0
    }
  }

  mergeSyncNodes(nodes: GraphNode[]): void {
    const n = nodes.length
    const prevX = new Map<string, number>()
    const prevY = new Map<string, number>()
    const prevVx = new Map<string, number>()
    const prevVy = new Map<string, number>()
    for (let i = 0; i < this.count; i++) {
      prevX.set(this.nodeIds[i], this.x[i])
      prevY.set(this.nodeIds[i], this.y[i])
      prevVx.set(this.nodeIds[i], this.vx[i])
      prevVy.set(this.nodeIds[i], this.vy[i])
    }

    if (n !== this.count) {
      this.x = new Float64Array(n)
      this.y = new Float64Array(n)
      this.vx = new Float64Array(n)
      this.vy = new Float64Array(n)
      this.fixed = new Uint8Array(n)
      this.count = n
    }
    this.nodeIds.length = 0
    this.nodeLabels.length = 0
    this.idToIdx.clear()

    for (let i = 0; i < n; i++) {
      const nd = nodes[i]
      this.nodeIds.push(nd.id)
      this.nodeLabels.push(nd.label)
      this.idToIdx.set(nd.id, i)
      if (prevX.has(nd.id)) {
        this.x[i] = prevX.get(nd.id)!
        this.y[i] = prevY.get(nd.id)!
        this.vx[i] = prevVx.get(nd.id)!
        this.vy[i] = prevVy.get(nd.id)!
      } else {
        this.x[i] = nd.x
        this.y[i] = nd.y
        this.vx[i] = nd.vx
        this.vy[i] = nd.vy
      }
      this.fixed[i] = nd.fixed ? 1 : 0
    }
  }

  syncEdges(edges: GraphEdge[]): void {
    const src: number[] = []
    const tgt: number[] = []
    for (const e of edges) {
      const si = this.idToIdx.get(e.source)
      const ti = this.idToIdx.get(e.target)
      if (si !== undefined && ti !== undefined) {
        src.push(si)
        tgt.push(ti)
      }
    }
    this.eCount = src.length
    this.eSrc = new Int32Array(src)
    this.eTgt = new Int32Array(tgt)
  }

  setCenter(cx: number, cy: number): void {
    this.centerX = cx
    this.centerY = cy
  }

  setIdealLength(len: number): void {
    this.idealLength = len
  }

  reheat(a = 0.3): void {
    this.alpha = Math.max(this.alpha, a)
  }

  indexOfId(id: string): number {
    return this.idToIdx.get(id) ?? -1
  }

  setPosition(idx: number, px: number, py: number): void {
    if (idx < 0 || idx >= this.count) return
    this.x[idx] = px
    this.y[idx] = py
    this.vx[idx] = 0
    this.vy[idx] = 0
  }

  setFixed(idx: number, val: boolean): void {
    if (idx >= 0 && idx < this.count) this.fixed[idx] = val ? 1 : 0
  }

  tick(): boolean {
    const n = this.count
    if (n === 0) return false
    this.alpha += (0 - this.alpha) * ALPHA_DECAY
    if (this.alpha < ALPHA_MIN) {
      this.alpha = 0
      return false
    }

    const { x, y, vx, vy, fixed, alpha } = this
    const lr = this.idealLength / BASE_IDEAL_LENGTH
    const rep = BASE_REPULSION * lr * lr * alpha

    // ── Repulsion ──
    if (n > BH_NODE_THRESHOLD) {
      let bx0 = x[0],
        by0 = y[0],
        bx1 = x[0],
        by1 = y[0]
      for (let i = 1; i < n; i++) {
        if (x[i] < bx0) bx0 = x[i]
        if (y[i] < by0) by0 = y[i]
        if (x[i] > bx1) bx1 = x[i]
        if (y[i] > by1) by1 = y[i]
      }
      const sz = Math.max(bx1 - bx0, by1 - by0, 1) + 2
      const cx = (bx0 + bx1) / 2
      const cy = (by0 + by1) / 2
      const root = qtNew(cx - sz / 2, cy - sz / 2, cx + sz / 2, cy + sz / 2)
      for (let i = 0; i < n; i++) qtInsert(root, i, x[i], y[i], x, y, 0)
      qtMass(root, x, y)
      for (let i = 0; i < n; i++) {
        if (!fixed[i]) qtForce(root, i, x[i], y[i], rep, vx, vy)
      }
    } else {
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = x[j] - x[i]
          const dy = y[j] - y[i]
          const dSq = Math.max(dx * dx + dy * dy, 1)
          const d = Math.sqrt(dSq)
          const f = rep / dSq
          const fx = (dx / d) * f
          const fy = (dy / d) * f
          if (!fixed[i]) {
            vx[i] -= fx
            vy[i] -= fy
          }
          if (!fixed[j]) {
            vx[j] += fx
            vy[j] += fy
          }
        }
      }
    }

    const att = ATTRACTION * alpha
    for (let e = 0; e < this.eCount; e++) {
      const si = this.eSrc[e]
      const ti = this.eTgt[e]
      const dx = x[ti] - x[si]
      const dy = y[ti] - y[si]
      const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
      const f = att * (d - this.idealLength)
      const fx = (dx / d) * f
      const fy = (dy / d) * f
      if (!fixed[si]) {
        vx[si] += fx
        vy[si] += fy
      }
      if (!fixed[ti]) {
        vx[ti] -= fx
        vy[ti] -= fy
      }
    }

    const grav = (CENTER_GRAVITY / lr) * alpha
    for (let i = 0; i < n; i++) {
      if (!fixed[i]) {
        vx[i] += (this.centerX - x[i]) * grav
        vy[i] += (this.centerY - y[i]) * grav
      }
    }

    const m = this.boundaryMargin
    const mxX = Math.max(m, this.centerX * 2 - m)
    const mxY = Math.max(m, this.centerY * 2 - m)
    for (let i = 0; i < n; i++) {
      if (!fixed[i]) {
        vx[i] *= DAMPING
        vy[i] *= DAMPING
        if (Math.abs(vx[i]) < MIN_VELOCITY) vx[i] = 0
        if (Math.abs(vy[i]) < MIN_VELOCITY) vy[i] = 0
        x[i] += vx[i]
        y[i] += vy[i]
        if (x[i] < m) x[i] = m
        else if (x[i] > mxX) x[i] = mxX
        if (y[i] < m) y[i] = m
        else if (y[i] > mxY) y[i] = mxY
      }
    }

    return true
  }

  writeBack(nodes: GraphNode[]): GraphNode[] {
    return nodes.map((nd) => {
      const i = this.idToIdx.get(nd.id)
      if (i === undefined) return nd
      return {
        ...nd,
        x: this.x[i],
        y: this.y[i],
        vx: this.vx[i],
        vy: this.vy[i],
        fixed: this.fixed[i] === 1,
      }
    })
  }
}
