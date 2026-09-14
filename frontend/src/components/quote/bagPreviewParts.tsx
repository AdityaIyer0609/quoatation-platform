import { useEffect, useMemo } from "react"
import * as THREE from "three"

import { resolveFabricHex } from "@/lib/colourPreview"

export const CATALOG_INK = "#1c1c1c"

export function shade(hex: string, amount: number) {
  const normalized = hex.startsWith("#") ? hex : `#${hex}`
  const n = Number.parseInt(normalized.slice(1, 7), 16)
  if (Number.isNaN(n)) return "#f5f6f8"
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + amount))
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amount))
  const b = Math.min(255, Math.max(0, (n & 255) + amount))
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

/** Body / panel fabric colour for 3D — names, CSS colours, or #hex. */
export function fabricColor(colour: string) {
  return resolveFabricHex(colour)
}

/** Loop / webbing tint derived from fabric colour. */
export function webbingColor(colour: string) {
  const key = (colour || "").trim().toLowerCase()
  if (key === "black") return "#8a8a86"
  if (key === "green") return "#2f7a3f"
  if (key === "blue") return "#1f4e82"
  const base = resolveFabricHex(colour)
  // Light / near-white fabrics keep the classic yellow webbing look.
  if (base === "#f5f6f8" || base === "#f4e2b8" || base === "#c9a36a") return "#c4d02a"
  return shade(base, -40)
}

let weaveTexture: THREE.CanvasTexture | null = null
let webbingTexture: THREE.CanvasTexture | null = null

/** Dense PP weave tile (shared). Callers clone + set repeat for bag-cm scaling. */
export function getWeave() {
  if (weaveTexture) return weaveTexture
  const size = 256
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("weave")
  ctx.fillStyle = "#ececec"
  ctx.fillRect(0, 0, size, size)
  const cell = 8
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const warp = (x / cell + y / cell) % 2 === 0
      ctx.fillStyle = warp ? "#ffffff" : "#d8d8d6"
      ctx.fillRect(x, y, cell / 2, cell)
      ctx.fillStyle = warp ? "#e2e2e0" : "#f7f7f5"
      ctx.fillRect(x + cell / 2, y, cell / 2, cell)
    }
  }
  // Fine pick lines
  ctx.strokeStyle = "rgba(0,0,0,0.06)"
  ctx.lineWidth = 1
  for (let i = 0; i <= size; i += cell / 2) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, size)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(size, i)
    ctx.stroke()
  }
  weaveTexture = new THREE.CanvasTexture(canvas)
  weaveTexture.colorSpace = THREE.SRGBColorSpace
  weaveTexture.wrapS = weaveTexture.wrapT = THREE.RepeatWrapping
  weaveTexture.anisotropy = 8
  weaveTexture.repeat.set(16, 20)
  return weaveTexture
}

function getWebbingStripe() {
  if (webbingTexture) return webbingTexture
  const size = 64
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("webbing")
  ctx.fillStyle = "#dddddd"
  ctx.fillRect(0, 0, size, size)
  for (let x = 0; x < size; x += 4) {
    ctx.fillStyle = x % 8 === 0 ? "#f2f2f2" : "#c8c8c6"
    ctx.fillRect(x, 0, 2, size)
  }
  webbingTexture = new THREE.CanvasTexture(canvas)
  webbingTexture.colorSpace = THREE.SRGBColorSpace
  webbingTexture.wrapS = webbingTexture.wrapT = THREE.RepeatWrapping
  webbingTexture.repeat.set(4, 1)
  return webbingTexture
}

function useScaledMap(base: THREE.Texture, repX: number, repY: number) {
  const tex = useMemo(() => {
    const clone = base.clone()
    clone.needsUpdate = true
    clone.wrapS = clone.wrapT = THREE.RepeatWrapping
    clone.repeat.set(repX, repY)
    return clone
  }, [base, repX, repY])
  useEffect(() => () => tex.dispose(), [tex])
  return tex
}

/**
 * Body fabric. `repeat` ≈ tiles across the face; pass cm-based values from the bag.
 * `laminated` slightly glosses coated fabric.
 */
export function Fabric({
  color,
  doubleSide,
  repeat = [14, 18],
  laminated = false,
}: {
  color: string
  doubleSide?: boolean
  repeat?: [number, number]
  laminated?: boolean
}) {
  const weave = useScaledMap(getWeave(), repeat[0], repeat[1])
  return (
    <meshStandardMaterial
      color={color}
      map={weave}
      roughness={laminated ? 0.68 : 0.9}
      metalness={laminated ? 0.04 : 0}
      bumpMap={weave}
      bumpScale={laminated ? 0.012 : 0.028}
      side={doubleSide ? THREE.DoubleSide : THREE.FrontSide}
    />
  )
}

export function Webbing({ color }: { color: string }) {
  const map = useScaledMap(getWebbingStripe(), 6, 1)
  return (
    <meshStandardMaterial
      color={color}
      map={map}
      roughness={0.48}
      metalness={0.06}
      bumpMap={map}
      bumpScale={0.02}
    />
  )
}

/** Vertical corner reinforcement / safety-seam ribbons (drawing look). */
export function CornerSeamKit({
  sx,
  sy,
  sz,
  color,
  circular,
}: {
  sx: number
  sy: number
  sz: number
  color: string
  circular?: boolean
}) {
  if (circular) return null
  const stitch = shade(color, -40)
  const inset = 0.015
  const pts: [number, number][] = [
    [sx / 2 - inset, sz / 2 - inset],
    [-sx / 2 + inset, sz / 2 - inset],
    [sx / 2 - inset, -sz / 2 + inset],
    [-sx / 2 + inset, -sz / 2 + inset],
  ]
  return (
    <group>
      {pts.map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, sy / 2, z]}>
            <boxGeometry args={[0.022, sy * 0.96, 0.022]} />
            <meshStandardMaterial color={stitch} roughness={0.75} />
          </mesh>
          {/* Cross-stitch block near top (loop anchorage) */}
          <mesh position={[x, sy * 0.82, z]}>
            <boxGeometry args={[0.05, 0.1, 0.05]} />
            <meshStandardMaterial color={shade(color, -55)} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function InkEdges({ geometry, color = CATALOG_INK }: { geometry: THREE.BufferGeometry; color?: string }) {
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 28), [geometry])
  useEffect(() => () => edges.dispose(), [edges])
  return (
    <lineSegments geometry={edges}>
      <lineBasicMaterial color={color} transparent opacity={0.45} />
    </lineSegments>
  )
}

function Felt({ color }: { color: string }) {
  return <meshStandardMaterial color={shade(color, 40)} roughness={0.95} />
}

function strapGeo(curve: THREE.Curve<THREE.Vector3>, width = 0.07, thick = 0.01) {
  const shape = new THREE.Shape()
  shape.moveTo(-width, -thick)
  shape.lineTo(width, -thick)
  shape.lineTo(width, thick)
  shape.lineTo(-width, thick)
  shape.closePath()
  return new THREE.ExtrudeGeometry(shape, { steps: 48, bevelEnabled: false, extrudePath: curve })
}

export function UPanelWrap({
  sx,
  sy,
  sz,
  color,
  stitch,
}: {
  sx: number
  sy: number
  sz: number
  color: string
  stitch: string
}) {
  const zOut = sz / 2 + 0.02
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, sy * 0.97, zOut),
      new THREE.Vector3(0, sy * 0.5, zOut),
      new THREE.Vector3(0, sy * 0.1, zOut * 0.94),
      new THREE.Vector3(0, -0.06, zOut * 0.5),
      new THREE.Vector3(0, -0.14, 0),
      new THREE.Vector3(0, -0.06, -zOut * 0.5),
      new THREE.Vector3(0, sy * 0.1, -zOut * 0.94),
      new THREE.Vector3(0, sy * 0.5, -zOut),
      new THREE.Vector3(0, sy * 0.97, -zOut),
    ])
    return strapGeo(curve, sx * 0.465, 0.015)
  }, [sx, sy, zOut])
  const seam = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, sy * 0.97, zOut + 0.004),
      new THREE.Vector3(0, sy * 0.5, zOut + 0.004),
      new THREE.Vector3(0, sy * 0.1, zOut * 0.94),
      new THREE.Vector3(0, -0.07, zOut * 0.5),
      new THREE.Vector3(0, -0.155, 0),
      new THREE.Vector3(0, -0.07, -zOut * 0.5),
      new THREE.Vector3(0, sy * 0.1, -zOut * 0.94),
      new THREE.Vector3(0, sy * 0.5, -zOut - 0.004),
      new THREE.Vector3(0, sy * 0.97, -zOut - 0.004),
    ])
    return strapGeo(curve, 0.01, 0.01)
  }, [sy, zOut])
  useEffect(
    () => () => {
      geometry.dispose()
      seam.dispose()
    },
    [geometry, seam],
  )
  return (
    <group>
      <mesh geometry={geometry} castShadow>
        <Fabric color={shade(color, -10)} />
      </mesh>
      <mesh geometry={seam} position={[sx * 0.46, 0, 0]}>
        <meshStandardMaterial color={stitch} roughness={0.75} />
      </mesh>
      <mesh geometry={seam} position={[-sx * 0.46, 0, 0]}>
        <meshStandardMaterial color={stitch} roughness={0.75} />
      </mesh>
    </group>
  )
}

export function FaceSlackLoop({
  x,
  z,
  y0,
  y1,
  color,
  above = 0.32,
  width = 0.055,
}: {
  x: number
  z: number
  y0: number
  y1: number
  color: string
  /** Loop height above bag top (scene units). */
  above?: number
  /** Half-strap width (scene units). */
  width?: number
}) {
  const yaw = Math.atan2(x, z)
  const peak = Math.max(0.12, above)
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-width * 2, y0, 0.02),
      new THREE.Vector3(-width * 2.2, y1 + peak * 0.35, peak * 0.28),
      new THREE.Vector3(0, y1 + peak, peak * 0.38),
      new THREE.Vector3(width * 2.2, y1 + peak * 0.35, peak * 0.28),
      new THREE.Vector3(width * 2, y0, 0.02),
    ])
    return strapGeo(curve, width, Math.max(0.008, width * 0.22))
  }, [y0, y1, peak, width])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      <mesh geometry={geometry} castShadow>
        <Webbing color={color} />
      </mesh>
      {/* Reinforcement sew patch */}
      <mesh position={[0, y0 + (y1 - y0) * 0.15, 0.01]}>
        <boxGeometry args={[width * 3.2, Math.max(0.06, (y1 - y0) * 0.35), 0.012]} />
        <meshStandardMaterial color={shade(color, -25)} roughness={0.7} />
      </mesh>
    </group>
  )
}

export function SlackLoop({
  x,
  z,
  y0,
  y1,
  color,
  above = 0.3,
  width = 0.055,
}: {
  x: number
  z: number
  y0: number
  y1: number
  color: string
  above?: number
  width?: number
}) {
  const dx = Math.sign(x) || 1
  const dz = Math.sign(z) || 1
  const peak = Math.max(0.12, above)
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x - dx * width * 1.8, y0, z + dz * 0.02),
      new THREE.Vector3(x - dx * width * 2.2, (y0 + y1) * 0.5, z + dz * width * 1.4),
      new THREE.Vector3(x - dx * width * 0.7, y1 + peak * 0.35, z - dz * width * 0.4),
      new THREE.Vector3(x + dx * width * 0.4, y1 + peak, z - dz * width * 1.4),
      new THREE.Vector3(x + dx * width * 1.1, y1 + peak * 0.3, z - dz * width * 2.1),
      new THREE.Vector3(x + dx * width * 0.4, (y0 + y1) * 0.5, z - dz * width * 2.1),
      new THREE.Vector3(x + dx * width * 0.4, y0, z - dz * width * 1.8),
    ])
    return strapGeo(curve, width, Math.max(0.008, width * 0.22))
  }, [x, z, y0, y1, dx, dz, peak, width])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh geometry={geometry} castShadow>
      <Webbing color={color} />
    </mesh>
  )
}

function FabricBodyLoop({
  sx,
  sy,
  sz,
  x = 0,
  color,
  strap,
  ribbon,
}: {
  sx: number
  sy: number
  sz: number
  x?: number
  color: string
  strap: string
  ribbon: number
}) {
  const halfZ = sz * 0.5
  const y0 = sy * 0.92
  const y1 = sy + Math.min(sx, sz) * 0.28
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, y0, halfZ),
      new THREE.Vector3(x, y0 + (y1 - y0) * 0.55, halfZ * 0.55),
      new THREE.Vector3(x, y1, 0),
      new THREE.Vector3(x, y0 + (y1 - y0) * 0.55, -halfZ * 0.55),
      new THREE.Vector3(x, y0, -halfZ),
    ])
    return strapGeo(curve, ribbon, 0.012)
  }, [x, y0, y1, halfZ, ribbon])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group>
      <mesh geometry={geometry} castShadow>
        <Fabric color={color} />
      </mesh>
      <mesh position={[x, y1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.028, 0.028, ribbon * 1.7, 16]} />
        <Webbing color={strap} />
      </mesh>
    </group>
  )
}

function Petals({
  radius,
  height,
  color,
  flip,
  bagSpan,
}: {
  radius: number
  height: number
  color: string
  flip?: boolean
  bagSpan?: number
}) {
  const dir = flip ? -1 : 1
  const petalColor = shade(color, 28)
  const flapW = Math.max(radius * 1.6, (bagSpan ?? radius * 4) * 0.32)
  const flapH = Math.max(height * 1.35, (bagSpan ?? height * 3) * 0.22)
  return (
    <group>
      {Array.from({ length: 4 }, (_, index) => {
        const a = (index / 4) * Math.PI * 2 + Math.PI / 4
        return (
          <group key={index} rotation={[0, a, 0]}>
            <mesh
              position={[0, dir * height * 0.42, radius * 1.15]}
              rotation={[dir * 0.55, 0, 0]}
              castShadow
            >
              <planeGeometry args={[flapW, flapH]} />
              <meshStandardMaterial color={petalColor} roughness={0.86} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, dir * height * 0.18, radius * 0.62]} rotation={[dir * 0.2, 0, 0]}>
              <boxGeometry args={[0.014, height * 0.7, 0.014]} />
              <Webbing color={shade(color, -45)} />
            </mesh>
          </group>
        )
      })}
      <mesh position={[0, dir * height * 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.02, 0.012, 8, 20]} />
        <Webbing color={shade(color, -35)} />
      </mesh>
    </group>
  )
}

function Iris({ radius, height, strap, flip }: { radius: number; height: number; strap: string; flip?: boolean }) {
  const dir = flip ? -1 : 1
  return (
    <group>
      {/* Iris disc at spout root */}
      <mesh position={[0, dir * height * 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.35, radius * 1.05, 28]} />
        <meshStandardMaterial color={shade(strap, -20)} roughness={0.65} side={THREE.DoubleSide} />
      </mesh>
      {[0.35, 0.52, 0.7].map((t, index) => (
        <mesh key={t} position={[0, dir * height * t, 0]} rotation={[Math.PI / 2, index * 0.35, 0]}>
          <torusGeometry args={[radius * (0.95 - index * 0.1), 0.012, 8, 24]} />
          <Webbing color={strap} />
        </mesh>
      ))}
      {/* Fibrillated / web ties */}
      {[0, Math.PI / 2].map((a) => (
        <mesh key={a} position={[0, dir * height * 0.55, 0]} rotation={[0, a, 0]}>
          <boxGeometry args={[radius * 2.1, 0.014, 0.014]} />
          <Webbing color={strap} />
        </mesh>
      ))}
    </group>
  )
}

function SpoutTies({ radius, height, strap, flip }: { radius: number; height: number; strap: string; flip?: boolean }) {
  const dir = flip ? -1 : 1
  return (
    <group>
      <mesh position={[0, dir * height * 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.92, 0.011, 8, 20]} />
        <Webbing color={strap} />
      </mesh>
      <mesh position={[0, dir * height * 0.55, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[radius * 2.4, 0.012, 0.012]} />
        <Webbing color={strap} />
      </mesh>
    </group>
  )
}

/** Full-open / open-top rectangular collar matching mill drawings. */
function OpenCollar({
  sx,
  sy,
  sz,
  height,
  color,
}: {
  sx: number
  sy: number
  sz: number
  height: number
  color: string
}) {
  const t = 0.018
  const h = Math.max(0.12, height)
  const y = sy + h / 2
  return (
    <group>
      <mesh position={[0, y, sz / 2 - t / 2]}>
        <boxGeometry args={[sx, h, t]} />
        <Fabric color={color} />
      </mesh>
      <mesh position={[0, y, -sz / 2 + t / 2]}>
        <boxGeometry args={[sx, h, t]} />
        <Fabric color={color} />
      </mesh>
      <mesh position={[sx / 2 - t / 2, y, 0]}>
        <boxGeometry args={[t, h, sz - t * 2]} />
        <Fabric color={color} />
      </mesh>
      <mesh position={[-sx / 2 + t / 2, y, 0]}>
        <boxGeometry args={[t, h, sz - t * 2]} />
        <Fabric color={color} />
      </mesh>
      {/* Soft hem at collar rim */}
      <mesh position={[0, sy + h - 0.01, 0]}>
        <boxGeometry args={[sx * 0.98, 0.02, sz * 0.98]} />
        <meshStandardMaterial color={shade(color, -18)} roughness={0.9} wireframe={false} transparent opacity={0.85} />
      </mesh>
    </group>
  )
}

function baffleAlphaMap() {
  const size = 256
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = "#000000"
  const cols = 2
  const rows = 5
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = ((c + 0.5) / cols) * size
      const y = ((r + 0.5) / rows) * size
      ctx.beginPath()
      ctx.ellipse(x, y, size * 0.12, size * 0.07, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function BaffleKit({
  sx,
  sy,
  sz,
  color,
  baffleColor,
}: {
  sx: number
  sy: number
  sz: number
  color: string
  /** Distinct baffle tint (CAD drawings often use a cooler fabric). */
  baffleColor?: string
}) {
  const alpha = useMemo(() => (typeof document !== "undefined" ? baffleAlphaMap() : null), [])
  useEffect(() => () => alpha?.dispose(), [alpha])
  // Cooler internal-panel look when no explicit baffle colour.
  const safeTint = baffleColor || shade(color, 22)
  const depth = Math.min(sx, sz) * 0.4
  const panels: { x: number; z: number; rot: number }[] = [
    { x: sx / 2 - depth * 0.35, z: sz / 2 - depth * 0.35, rot: -Math.PI / 4 },
    { x: -sx / 2 + depth * 0.35, z: sz / 2 - depth * 0.35, rot: Math.PI / 4 },
    { x: sx / 2 - depth * 0.35, z: -sz / 2 + depth * 0.35, rot: Math.PI / 4 },
    { x: -sx / 2 + depth * 0.35, z: -sz / 2 + depth * 0.35, rot: -Math.PI / 4 },
  ]
  return (
    <group>
      {panels.map((p, i) => (
        <mesh key={i} position={[p.x, sy / 2, p.z]} rotation={[0, p.rot, 0]}>
          <planeGeometry args={[depth, sy * 0.88]} />
          <meshStandardMaterial
            color={safeTint}
            roughness={0.86}
            transparent
            opacity={0.78}
            alphaMap={alpha ?? undefined}
            alphaTest={0.35}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function ventTexture() {
  const size = 256
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!
  // Alpha map: white = fabric, black = vent slots
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = "#000000"
  for (let i = 0; i < 14; i += 1) {
    const y = ((i + 0.5) / 14) * size
    ctx.fillRect(size * 0.06, y - 3, size * 0.88, 5)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 6)
  return tex
}

export function VentilatedFaces({ sx, sy, sz, color }: { sx: number; sy: number; sz: number; color: string }) {
  const alpha = useMemo(() => (typeof document !== "undefined" ? ventTexture() : null), [])
  useEffect(() => () => alpha?.dispose(), [alpha])
  const faces = [
    { pos: [0, sy / 2, sz / 2 + 0.005] as const, rot: [0, 0, 0] as const, w: sx * 0.86, h: sy * 0.78 },
    { pos: [0, sy / 2, -sz / 2 - 0.005] as const, rot: [0, Math.PI, 0] as const, w: sx * 0.86, h: sy * 0.78 },
    { pos: [sx / 2 + 0.005, sy / 2, 0] as const, rot: [0, Math.PI / 2, 0] as const, w: sz * 0.86, h: sy * 0.78 },
    { pos: [-sx / 2 - 0.005, sy / 2, 0] as const, rot: [0, -Math.PI / 2, 0] as const, w: sz * 0.86, h: sy * 0.78 },
  ]
  return (
    <group>
      {faces.map((f, i) => (
        <mesh key={i} position={[...f.pos]} rotation={[...f.rot]}>
          <planeGeometry args={[f.w, f.h]} />
          <meshStandardMaterial
            color={shade(color, -6)}
            roughness={0.88}
            transparent
            opacity={0.92}
            alphaMap={alpha ?? undefined}
            alphaTest={0.45}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function Skirt({
  y,
  span,
  height,
  color,
  strap,
  jute,
  drawstring,
  flip,
  rectangular,
  sx,
  sz,
}: {
  y: number
  span: number
  height: number
  color: string
  strap: string
  jute?: boolean
  drawstring?: boolean
  flip?: boolean
  /** Soft gathered duffle vs rectangular open skirt. */
  rectangular?: boolean
  sx?: number
  sz?: number
}) {
  const dir = flip ? -1 : 1
  const cloth = jute ? "#c4a574" : color
  const h = Math.max(0.12, height)
  if (rectangular && sx && sz) {
    return (
      <group position={[0, y, 0]}>
        <OpenCollar sx={sx * 0.98} sy={0} sz={sz * 0.98} height={h} color={cloth} />
        <mesh position={[0, dir * h * 0.55, sx ? 0 : 0]}>
          <boxGeometry args={[0.012, 0.012, Math.min(sx, sz) * 0.9]} />
          <Webbing color={drawstring ? strap : shade(cloth, -15)} />
        </mesh>
      </group>
    )
  }
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, dir * h * 0.45, 0]} rotation={flip ? [Math.PI, 0, 0] : [0, 0, 0]}>
        <cylinderGeometry args={[span * 0.22, span * 0.48, h, 28, 1, true]} />
        <Fabric color={cloth} doubleSide />
      </mesh>
      <mesh position={[0, dir * h * 0.88, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[span * 0.2, 0.014, 8, 22]} />
        <Webbing color={drawstring ? strap : shade(cloth, -15)} />
      </mesh>
    </group>
  )
}

export function FillingKit({
  sx,
  sy,
  sz,
  color,
  strap,
  topType,
  spoutType,
  flap,
  spoutH,
  spoutR,
  duffleH,
  conicalH,
  clearHandle = false,
  flapColor,
}: {
  sx: number
  sy: number
  sz: number
  color: string
  strap: string
  topType: string
  spoutType: string
  flap: boolean
  spoutH: number
  spoutR: number
  duffleH: number
  conicalH: number
  clearHandle?: boolean
  flapColor?: string
}) {
  const open = /^open$/i.test(topType.trim()) || /^open\s/i.test(topType.trim())
  const spout = /spout/i.test(topType)
  const skirt = /duffle|skrit|skirt|leno|jute|drawstring|top \+ skrit|oversize/i.test(topType)
  const conical = /conical/i.test(topType)
  const petal = /petal/i.test(spoutType)
  const iris = /iris|pyjama/i.test(spoutType)
  const jute = /jute/i.test(topType)
  const drawstring = /drawstring/i.test(topType)
  const span = Math.min(sx, sz)
  const skirtH = Math.max(0.12, duffleH)
  const shownSpoutH = clearHandle ? Math.min(0.1, spoutH * 0.35) : spoutH
  const shownSpoutR = clearHandle ? Math.min(spoutR, span * 0.22) : spoutR

  return (
    <group>
      {open && !clearHandle ? (
        <group>
          <mesh position={[0, sy - 0.12, 0]}>
            <boxGeometry args={[sx * 0.76, 0.26, sz * 0.76]} />
            <meshStandardMaterial color={shade(color, -62)} roughness={0.96} side={THREE.BackSide} />
          </mesh>
          <mesh position={[0, sy + 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[sx * 0.72, sz * 0.72]} />
            <Fabric color={shade(color, -68)} />
          </mesh>
          <mesh position={[0, sy + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[sx * 0.48, sz * 0.48]} />
            <Fabric color={shade(color, -92)} />
          </mesh>
          {(
            [
              [0, sy + 0.02, sz * 0.4, sx * 0.84, 0.022, 0.055],
              [0, sy + 0.02, -sz * 0.4, sx * 0.84, 0.022, 0.055],
              [sx * 0.4, sy + 0.02, 0, 0.055, 0.022, sz * 0.84],
              [-sx * 0.4, sy + 0.02, 0, 0.055, 0.022, sz * 0.84],
            ] as const
          ).map(([x, y, z, w, h, d], i) => (
            <mesh key={i} position={[x, y, z]}>
              <boxGeometry args={[w, h, d]} />
              <Fabric color={color} />
            </mesh>
          ))}
        </group>
      ) : null}
      {skirt && !clearHandle ? (
        <Skirt
          y={sy}
          span={span}
          height={skirtH}
          color={color}
          strap={strap}
          jute={jute}
          drawstring={drawstring}
        />
      ) : null}
      {conical && !clearHandle ? (
        <mesh position={[0, sy + conicalH / 2, 0]}>
          <coneGeometry args={[span * 0.36, conicalH, 24]} />
          <Fabric color={color} />
        </mesh>
      ) : null}
      {spout ? (
        <group position={[0, sy + (clearHandle ? -shownSpoutH * 0.15 : (skirt ? skirtH * 0.85 : 0) + (conical ? conicalH * 0.35 : 0)), 0]}>
          <mesh position={[0, shownSpoutH / 2, 0]} castShadow>
            <cylinderGeometry
              args={[
                shownSpoutR * (petal ? 0.78 : 0.9),
                shownSpoutR,
                shownSpoutH,
                28,
                1,
                Boolean(petal && !clearHandle),
              ]}
            />
            <Fabric color={color} doubleSide={Boolean(petal && !clearHandle)} />
          </mesh>
          {petal && !clearHandle ? (
            <>
              <mesh position={[0, shownSpoutH * 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[shownSpoutR * 0.76, 20]} />
                <meshStandardMaterial color="#161410" roughness={1} />
              </mesh>
              <Petals radius={shownSpoutR * 1.05} height={shownSpoutH} color={color} bagSpan={span} />
            </>
          ) : null}
          {iris && !clearHandle ? <Iris radius={shownSpoutR * 1.05} height={shownSpoutH} strap={strap} /> : null}
          {!petal && !iris && !clearHandle ? (
            <>
              <mesh position={[0, shownSpoutH + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[shownSpoutR * 0.9, 20]} />
                <Fabric color={shade(color, -8)} />
              </mesh>
              <SpoutTies radius={shownSpoutR} height={shownSpoutH} strap={strap} />
            </>
          ) : null}
        </group>
      ) : null}
      {flap && !clearHandle ? (
        <mesh position={[span * 0.05, sy + (spout ? spoutH * 0.15 : 0.05), 0]} rotation={[0.22, 0.08, 0]}>
          <boxGeometry args={[span * 0.78, 0.018, span * 0.78]} />
          <Fabric color={flapColor || color} />
        </mesh>
      ) : null}
    </group>
  )
}

export function DischargeKit({
  sx,
  sz,
  color,
  strap,
  bottomType,
  spoutType,
  flap,
  spoutH,
  spoutR,
  conicalH,
}: {
  sx: number
  sy: number
  sz: number
  color: string
  strap: string
  bottomType: string
  spoutType: string
  flap: boolean
  spoutH: number
  spoutR: number
  conicalH: number
}) {
  const spout = /spout/i.test(bottomType)
  const skirt = /skirt/i.test(bottomType)
  const conical = /conical/i.test(bottomType)
  const star = /star/i.test(bottomType)
  const petal = /petal/i.test(spoutType)
  const iris = /iris|pyjama|bonnet/i.test(spoutType)
  const span = Math.min(sx, sz)
  const skirtH = Math.max(0.18, conicalH)

  return (
    <group>
      {star ? (
        <group position={[0, 0.02, 0]}>
          <mesh rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[span * 0.9, 0.02, 0.06]} />
            <Fabric color={shade(color, -10)} />
          </mesh>
          <mesh rotation={[0, -Math.PI / 4, 0]}>
            <boxGeometry args={[span * 0.9, 0.02, 0.06]} />
            <Fabric color={shade(color, -10)} />
          </mesh>
        </group>
      ) : null}
      {conical ? (
        <mesh position={[0, -conicalH / 2, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[span * 0.32, conicalH, 24]} />
          <Fabric color={color} />
        </mesh>
      ) : null}
      {skirt ? (
        <Skirt
          y={conical ? -conicalH * 0.4 : 0}
          span={span * 0.92}
          height={skirtH}
          color={color}
          strap={strap}
          flip
        />
      ) : null}
      {spout ? (
        <group position={[0, conical ? -conicalH * 0.35 : 0, 0]}>
          <mesh position={[0, -spoutH / 2, 0]} castShadow>
            <cylinderGeometry args={[spoutR, spoutR * 0.86, spoutH, 28]} />
            <Fabric color={color} />
          </mesh>
          {petal ? (
            <Petals radius={spoutR * 1.05} height={spoutH} color={color} bagSpan={span} flip />
          ) : null}
          {iris ? <Iris radius={spoutR} height={spoutH} strap={strap} flip /> : null}
          {!petal && !iris ? <SpoutTies radius={spoutR} height={spoutH} strap={strap} flip /> : null}
          {flap ? (
            <mesh position={[span * 0.12, -0.03, 0]} rotation={[0.55, 0.1, 0]}>
              <boxGeometry args={[span * 0.55, 0.016, span * 0.55]} />
              <Fabric color={color} />
            </mesh>
          ) : null}
        </group>
      ) : null}
      {flap && !spout ? (
        <mesh position={[0, -0.03, 0]}>
          <boxGeometry args={[span * 0.55, 0.016, span * 0.55]} />
          <Fabric color={color} />
        </mesh>
      ) : null}
    </group>
  )
}

function StevedoreStrap({ x, z, sy, color }: { x: number; z: number; sy: number; color: string }) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, sy * 0.9, z),
      new THREE.Vector3(x * 0.42, sy + 0.16, z * 0.42),
      new THREE.Vector3(0, sy + 0.4, 0),
    ])
    return strapGeo(curve, 0.04, 0.009)
  }, [x, z, sy])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh geometry={geometry} castShadow>
      <Webbing color={color} />
    </mesh>
  )
}

export function LoopKit({
  sx,
  sy,
  sz,
  circular,
  color,
  strap,
  construction,
  bodyStyle,
  loopKind,
  loopEnabled,
  loopCount,
  tillBottom,
  dropLoop,
  stevedore,
  stevedorePortion,
  protector,
  loopAbove = 0.3,
  sewDown = 0.35,
  strapWidth = 0.05,
}: {
  sx: number
  sy: number
  sz: number
  circular: boolean
  color: string
  strap: string
  construction: string
  bodyStyle: string
  loopKind: string
  loopEnabled: boolean
  loopCount: number
  tillBottom: boolean
  dropLoop: boolean
  stevedore: boolean
  stevedorePortion: string
  protector: boolean
  loopAbove?: number
  sewDown?: number
  strapWidth?: number
}) {
  const c = construction.replace(/[-\s+/]/g, "").toLowerCase()
  const style = bodyStyle.toLowerCase()
  const hood = c.includes("hood") || style.includes("hood")
  const tunnel = style.includes("tunnel") || c.includes("tunnel")
  const sleeve = style.includes("sleeve") || c.includes("sleeve")
  const single = c === "singleloop"
  const double = c === "doubleloop"
  const single4 = c.includes("single") && c.includes("4")
  const double4 = c.includes("double") && c.includes("4")
  const liftBag = single || double || single4 || double4
  const multi = loopCount > 4 && !liftBag
  const cross = /cross/i.test(loopKind)
  const full = /full/i.test(loopKind)
  const cornerKind = /corner/i.test(loopKind) && !cross
  const above = Math.max(0.12, loopAbove)
  const down = tillBottom || full ? sy * 0.92 : Math.min(sy * 0.55, Math.max(above * 0.9, sewDown))
  const y0Corner = sy - down
  const y0Cross = tillBottom || full ? 0.06 : sy - down
  const y1 = sy + 0.01
  const width = Math.max(0.028, strapWidth)
  const inset = 0.02
  const boxCorners: [number, number][] = [
    [sx / 2 - inset, sz / 2 - inset],
    [-sx / 2 + inset, sz / 2 - inset],
    [sx / 2 - inset, -sz / 2 + inset],
    [-sx / 2 + inset, -sz / 2 + inset],
  ]
  const roundCorners: [number, number][] = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].map(
    (angle) => [(sx / 2) * 0.92 * Math.cos(angle), (sz / 2) * 0.92 * Math.sin(angle)],
  )
  const corners = circular ? roundCorners : boxCorners
  const mids: [number, number][] = [
    [sx / 2 - inset, 0],
    [-sx / 2 + inset, 0],
    [0, sz / 2 - inset],
    [0, -sz / 2 + inset],
  ]
  const edgeExtra: [number, number][] = [
    [sx / 2 - inset, sz * 0.25],
    [sx / 2 - inset, -sz * 0.25],
    [-sx / 2 + inset, sz * 0.25],
    [-sx / 2 + inset, -sz * 0.25],
    [sx * 0.25, sz / 2 - inset],
    [-sx * 0.25, sz / 2 - inset],
  ]
  const none = !loopEnabled || /none/i.test(loopKind)
  const nCorner = Math.min(4, Math.max(2, loopCount <= 4 ? loopCount : 4))
  const showCorner =
    !none &&
    (single4 ||
      double4 ||
      (!liftBag && !hood && (cornerKind || (!cross && !full))))
  const showCross = !none && !liftBag && !hood && (cross || full)
  const cornerSet = (showCorner || showCross ? corners : []).slice(0, single4 || double4 ? 4 : nCorner)
  const portion = stevedorePortion.toLowerCase()
  const stevePoints: [number, number][] =
    portion === "width"
      ? [
          [0, sz / 2 - inset],
          [0, -sz / 2 + inset],
        ]
      : portion === "length"
        ? [
            [sx / 2 - inset, 0],
            [-sx / 2 + inset, 0],
          ]
        : corners
  const span = Math.min(sx, sz)
  const extraLoops =
    multi && loopCount > 4
      ? [...mids, ...edgeExtra].slice(0, Math.min(loopCount - 4, mids.length + edgeExtra.length))
      : []

  return (
    <group>
      {single || single4 ? (
        <FabricBodyLoop sx={sx} sy={sy} sz={sz} color={color} strap={strap} ribbon={Math.max(span * 0.18, width * 4)} />
      ) : null}
      {double || double4 ? (
        <group>
          <FabricBodyLoop sx={sx} sy={sy} sz={sz} x={sx * 0.2} color={color} strap={strap} ribbon={Math.max(span * 0.1, width * 2.5)} />
          <FabricBodyLoop sx={sx} sy={sy} sz={sz} x={-sx * 0.2} color={color} strap={strap} ribbon={Math.max(span * 0.1, width * 2.5)} />
        </group>
      ) : null}
      {showCorner
        ? cornerSet.map(([x, z]) => (
            <group key={`corner-${x}-${z}`}>
              <FaceSlackLoop x={x} z={z} y0={y0Corner} y1={y1} color={strap} above={above} width={width} />
              {protector ? (
                <mesh position={[x, y0Corner + down * 0.15, z]}>
                  <boxGeometry args={[width * 3.5, Math.max(0.06, down * 0.25), 0.04]} />
                  <Fabric color={shade(color, -12)} />
                </mesh>
              ) : null}
            </group>
          ))
        : null}
      {showCross
        ? cornerSet.map(([x, z]) => (
            <SlackLoop key={`cross-${x}-${z}`} x={x} z={z} y0={y0Cross} y1={y1} color={strap} above={above} width={width} />
          ))
        : null}
      {extraLoops.map(([x, z]) => (
        <FaceSlackLoop key={`extra-${x}-${z}`} x={x} z={z} y0={y0Corner} y1={y1} color={strap} above={above} width={width} />
      ))}
      {tunnel || sleeve ? (
        <group>
          <mesh position={[0, sy * 0.88, sz / 2 + 0.08]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, sx * 0.72, 16, 1, true]} />
            <Fabric color={shade(color, -8)} doubleSide />
          </mesh>
          <mesh position={[0, sy * 0.88, -sz / 2 - 0.08]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, sx * 0.72, 16, 1, true]} />
            <Fabric color={shade(color, -8)} doubleSide />
          </mesh>
        </group>
      ) : null}
      {hood ? (
        <group>
          <mesh position={[0, sy + 0.18, 0]}>
            <coneGeometry args={[Math.min(sx, sz) * 0.48, 0.38, 4]} />
            <Fabric color={color} />
          </mesh>
          <FaceSlackLoop x={0} z={0.02} y0={sy + 0.2} y1={sy + 0.38} color={strap} above={above * 0.5} width={width} />
        </group>
      ) : null}
      {stevedore ? (
        <group>
          {stevePoints.map(([x, z]) => (
            <StevedoreStrap key={`st-${x}-${z}`} x={x} z={z} sy={sy} color={strap} />
          ))}
          <mesh position={[0, sy + 0.41, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.055, 0.016, 8, 16]} />
            <Webbing color={strap} />
          </mesh>
        </group>
      ) : null}
      {dropLoop && !liftBag ? (
        <FaceSlackLoop x={0} z={sz / 2} y0={sy * 0.72} y1={y1} color={strap} above={above} width={width} />
      ) : null}
    </group>
  )
}

export function StitchKit({
  sx,
  sy,
  sz,
  color,
  hiracle,
  hiracleTop,
  hiracleBottom,
  felt,
  feltTop,
  feltBottom,
  feltBody,
  fillerCord,
  fillerDouble,
}: {
  sx: number
  sy: number
  sz: number
  color: string
  hiracle: boolean
  hiracleTop: boolean
  hiracleBottom: boolean
  felt: boolean
  feltTop: boolean
  feltBottom: boolean
  feltBody: boolean
  fillerCord: boolean
  fillerDouble: boolean
}) {
  const stitch = shade(color, -30)
  const feltOn = felt && (feltTop || feltBottom || feltBody || (!feltTop && !feltBottom && !feltBody))
  const dustProof = hiracle || fillerCord
  const doubleDust = hiracle || fillerDouble
  const seamH = sy * (hiracleTop && hiracleBottom ? 0.92 : hiracleTop ? 0.45 : hiracleBottom ? 0.45 : 0.9)
  const seamY = hiracleBottom && !hiracleTop ? sy * 0.28 : sy / 2
  return (
    <group>
      <mesh position={[sx / 2 + 0.01, seamY, 0]}>
        <boxGeometry args={[0.008, seamH, 0.008]} />
        <meshStandardMaterial color={stitch} roughness={0.75} />
      </mesh>
      {dustProof ? (
        <mesh position={[sx / 2 + 0.018, seamY, 0.012]}>
          <boxGeometry args={[0.01, seamH * 0.98, 0.01]} />
          <Webbing color={shade(color, 20)} />
        </mesh>
      ) : null}
      {doubleDust ? (
        <mesh position={[sx / 2 + 0.026, seamY, -0.012]}>
          <boxGeometry args={[0.01, seamH * 0.98, 0.01]} />
          <Webbing color={shade(color, 20)} />
        </mesh>
      ) : null}
      {feltOn && (feltTop || !feltBottom) ? (
        <mesh position={[0, sy - 0.02, sz / 2 + 0.012]}>
          <boxGeometry args={[sx * 0.7, 0.04, 0.03]} />
          <Felt color="#8a8f6a" />
        </mesh>
      ) : null}
      {feltOn && feltBottom ? (
        <mesh position={[0, 0.04, sz / 2 + 0.012]}>
          <boxGeometry args={[sx * 0.7, 0.04, 0.03]} />
          <Felt color="#8a8f6a" />
        </mesh>
      ) : null}
      {feltOn && feltBody ? (
        <mesh position={[0, sy / 2, sz / 2 + 0.014]}>
          <boxGeometry args={[0.04, sy * 0.7, 0.03]} />
          <Felt color="#8a8f6a" />
        </mesh>
      ) : null}
    </group>
  )
}
