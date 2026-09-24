import { useEffect, useMemo, useState } from "react"
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
  opacity = 1,
}: {
  color: string
  doubleSide?: boolean
  repeat?: [number, number]
  laminated?: boolean
  opacity?: number
}) {
  const weave = useScaledMap(getWeave(), repeat[0], repeat[1])
  return (
    <meshStandardMaterial
      color={color}
      map={weave}
      roughness={laminated ? 0.68 : 0.9}
      metalness={laminated ? 0.04 : 0}
      bumpMap={weave}
      bumpScale={laminated ? 0.016 : 0.04}
      side={doubleSide ? THREE.DoubleSide : THREE.FrontSide}
      transparent={opacity < 1}
      opacity={opacity}
      depthWrite={opacity >= 1}
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

const PRINT_LOGO_URL = "/logo.png"
let printLogoPromise: Promise<THREE.Texture> | null = null

/** Load logo.png once; key near-black pixels so the mark sits on fabric. */
function loadPrintLogoTexture() {
  if (!printLogoPromise) {
    printLogoPromise = new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("print logo canvas"))
          return
        }
        ctx.drawImage(img, 0, 0)
        try {
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
          for (let i = 0; i < data.data.length; i += 4) {
            const r = data.data[i]
            const g = data.data[i + 1]
            const b = data.data[i + 2]
            if (r < 28 && g < 28 && b < 28) {
              data.data[i + 3] = 0
            }
          }
          ctx.putImageData(data, 0, 0)
        } catch {
          // Same-origin should allow this; if not, keep the raw image.
        }
        const tex = new THREE.CanvasTexture(canvas)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = 8
        tex.needsUpdate = true
        tex.flipY = true
        resolve(tex)
      }
      img.onerror = () => reject(new Error("print logo load failed"))
      img.src = PRINT_LOGO_URL
    })
  }
  return printLogoPromise
}

/** Mill-style front-panel print — centered logo like catalog drawings. */
export function PrintedLogoKit({
  sx,
  sy,
  faceZ,
  twoSided = false,
}: {
  sx: number
  sy: number
  faceZ: number
  twoSided?: boolean
}) {
  const [map, setMap] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    let active = true
    loadPrintLogoTexture()
      .then((tex) => {
        if (active) setMap(tex)
      })
      .catch(() => {
        if (active) setMap(null)
      })
    return () => {
      active = false
    }
  }, [])

  if (!map) return null

  const size = Math.min(sx, sy) * 0.34
  const y = sy * 0.52
  const z = faceZ + 0.012

  return (
    <>
      <mesh position={[0, y, z]} renderOrder={12}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial map={map} transparent alphaTest={0.05} depthWrite={false} toneMapped={false} />
      </mesh>
      {twoSided ? (
        <mesh position={[0, y, -z]} rotation={[0, Math.PI, 0]} renderOrder={12}>
          <planeGeometry args={[size, size]} />
          <meshBasicMaterial map={map} transparent alphaTest={0.05} depthWrite={false} toneMapped={false} />
        </mesh>
      ) : null}
    </>
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

function makeUCenterline(sy: number, sz: number, thick: number, belly: number) {
  const hz = sz / 2
  const r = Math.min(sz, sy) * 0.13
  const pts: THREE.Vector3[] = []
  const zFace = (y: number, outer: number) => {
    const ny = Math.min(1, Math.max(0, y / Math.max(sy, 0.001)))
    return outer * (1 + belly * Math.sin(Math.PI * ny))
  }
  const nVert = 14
  const nArc = 12
  const nBot = 16
  for (let i = 0; i <= nVert; i += 1) {
    const y = sy - (i / nVert) * (sy - r)
    pts.push(new THREE.Vector3(0, y, zFace(y, hz)))
  }
  for (let i = 1; i <= nArc; i += 1) {
    const a = (Math.PI / 2) * (i / nArc)
    pts.push(new THREE.Vector3(0, r * (1 - Math.sin(a)), hz - r + r * Math.cos(a)))
  }
  for (let i = 1; i <= nBot; i += 1) {
    const t = i / nBot
    pts.push(new THREE.Vector3(0, thick * 0.5, THREE.MathUtils.lerp(hz - r, -(hz - r), t)))
  }
  for (let i = 1; i <= nArc; i += 1) {
    const a = (Math.PI / 2) * (i / nArc)
    pts.push(new THREE.Vector3(0, r * (1 - Math.cos(a)), -(hz - r) - r * Math.sin(a)))
  }
  for (let i = 1; i <= nVert; i += 1) {
    const y = r + (i / nVert) * (sy - r)
    pts.push(new THREE.Vector3(0, y, zFace(y, -hz)))
  }
  return pts
}

/** One continuous front–bottom–back fabric sheet with rounded U folds. */
function makeUSheetGeo(sx: number, sy: number, sz: number, thick: number, belly = 0.05) {
  const pts = makeUCenterline(sy, sz, thick, belly)
  const hw = sx / 2
  const ht = thick / 2
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  let dist = 0
  const ring = 4
  for (let i = 0; i < pts.length; i += 1) {
    const p = pts[i]
    const prev = pts[Math.max(0, i - 1)]
    const next = pts[Math.min(pts.length - 1, i + 1)]
    const tan = next.clone().sub(prev).normalize()
    if (i > 0) dist += p.distanceTo(pts[i - 1])
    const bin = new THREE.Vector3(1, 0, 0)
    const nrm = new THREE.Vector3().crossVectors(tan, bin)
    if (nrm.lengthSq() < 1e-8) nrm.set(0, 0, Math.sign(p.z) || 1)
    nrm.normalize()
    const corners = [
      p.clone().addScaledVector(bin, -hw).addScaledVector(nrm, -ht),
      p.clone().addScaledVector(bin, hw).addScaledVector(nrm, -ht),
      p.clone().addScaledVector(bin, hw).addScaledVector(nrm, ht),
      p.clone().addScaledVector(bin, -hw).addScaledVector(nrm, ht),
    ]
    const vLen = sy * 2 + sz
    for (const v of corners) {
      positions.push(v.x, v.y, v.z)
      uvs.push((v.x + hw) / Math.max(sx, 0.001), dist / Math.max(vLen, 0.001))
    }
  }
  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = i * ring
    const b = (i + 1) * ring
    for (let k = 0; k < 4; k += 1) {
      const k2 = (k + 1) % 4
      indices.push(a + k, b + k, b + k2, a + k, b + k2, a + k2)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

function makeSidePanelGeo(sy: number, sz: number, belly: number) {
  const geo = new THREE.PlaneGeometry(sz * 0.9, sy, 12, 16)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i += 1) {
    const py = pos.getY(i)
    const pz = pos.getX(i)
    const ny = (py + sy / 2) / Math.max(sy, 0.001)
    const nz = 1 - Math.abs(pz) / Math.max((sz * 0.45), 0.001)
    pos.setZ(i, belly * Math.sin(Math.PI * ny) * Math.max(0, nz))
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

/**
 * True U-panel body: one continuous front–bottom–back sheet plus two
 * separately sewn side panels. Seams exist only where sides join the U.
 */
export function UPanelWrap({
  sx,
  sy,
  sz,
  color,
  stitch,
  laminated = false,
  repeat = [14, 18],
}: {
  sx: number
  sy: number
  sz: number
  color: string
  stitch: string
  laminated?: boolean
  repeat?: [number, number]
  openTop?: boolean
}) {
  const wall = 0.028
  const seam = 0.038
  const hx = sx / 2
  const hz = sz / 2
  const belly = 0.055
  const sideColor = shade(color, -18)
  const uGeo = useMemo(() => makeUSheetGeo(sx, sy, sz, wall, belly), [sx, sy, sz, wall, belly])
  const sideGeo = useMemo(() => makeSidePanelGeo(sy, sz, Math.min(sx, sz) * 0.05), [sy, sz, sx])
  useEffect(
    () => () => {
      uGeo.dispose()
      sideGeo.dispose()
    },
    [uGeo, sideGeo],
  )
  return (
    <group>
      <mesh geometry={uGeo} castShadow receiveShadow>
        <Fabric color={color} doubleSide laminated={laminated} repeat={repeat} />
      </mesh>
      <mesh geometry={sideGeo} position={[hx - wall * 0.2, sy / 2, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <Fabric color={sideColor} doubleSide laminated={laminated} repeat={[repeat[1], repeat[0]]} />
      </mesh>
      <mesh geometry={sideGeo} position={[-hx + wall * 0.2, sy / 2, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow>
        <Fabric color={sideColor} doubleSide laminated={laminated} repeat={[repeat[1], repeat[0]]} />
      </mesh>
      {(
        [
          [hx - seam * 0.4, hz - seam * 0.4],
          [-hx + seam * 0.4, hz - seam * 0.4],
          [hx - seam * 0.4, -hz + seam * 0.4],
          [-hx + seam * 0.4, -hz + seam * 0.4],
        ] as const
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, sy / 2, z]} castShadow>
          <boxGeometry args={[seam, sy * 0.96, seam]} />
          <meshStandardMaterial color={stitch} roughness={0.72} />
        </mesh>
      ))}
      <mesh position={[hx - seam * 0.4, seam, 0]}>
        <boxGeometry args={[seam, seam, sz * 0.88]} />
        <meshStandardMaterial color={stitch} roughness={0.72} />
      </mesh>
      <mesh position={[-hx + seam * 0.4, seam, 0]}>
        <boxGeometry args={[seam, seam, sz * 0.88]} />
        <meshStandardMaterial color={stitch} roughness={0.72} />
      </mesh>
    </group>
  )
}

function boxCornerLoopCurve({
  x,
  z,
  y0,
  y1,
  width,
  above,
  endGap,
  sx,
  sz,
}: {
  x: number
  z: number
  y0: number
  y1: number
  width: number
  above: number
  endGap: number
  sx: number
  sz: number
}) {
  const dx = Math.sign(x) || 1
  const dz = Math.sign(z) || 1
  const peak = Math.max(0.12, above)
  const xAbs = sx > 0 ? sx / 2 : Math.abs(x)
  const zAbs = sz > 0 ? sz / 2 : Math.abs(z)
  const offset = Math.min(
    Math.max(width * 5.2, endGap / Math.SQRT2),
    xAbs * 0.72,
    zAbs * 0.72,
  )
  const skin = Math.max(0.012, width * 0.32)
  const xFace = dx * (xAbs + skin)
  const zFace = dz * (zAbs + skin)
  const xOnZ = dx * (xAbs - offset)
  const zOnX = dz * (zAbs - offset)
  const midX = (xOnZ + xFace) / 2
  const midZ = (zFace + zOnX) / 2
  const bow = Math.max(0.07, peak * 0.22)
  const peakX = midX + dx * bow
  const peakZ = midZ + dz * bow
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(xOnZ, y0, zFace),
    new THREE.Vector3(xOnZ, y1, zFace),
    new THREE.Vector3((xOnZ + peakX) / 2, y1 + peak * 0.4, (zFace + peakZ) / 2),
    new THREE.Vector3(peakX, y1 + peak, peakZ),
    new THREE.Vector3((xFace + peakX) / 2, y1 + peak * 0.4, (zOnX + peakZ) / 2),
    new THREE.Vector3(xFace, y1, zOnX),
    new THREE.Vector3(xFace, y0, zOnX),
  ])
  return strapGeo(curve, width, Math.max(0.008, width * 0.22))
}

export function FaceSlackLoop({
  x,
  z,
  y0,
  y1,
  color,
  above = 0.32,
  width = 0.055,
  endGap = 0.22,
  circular = false,
  sx = 0,
  sy = 0,
  sz = 0,
  y0Short,
}: {
  x: number
  z: number
  y0: number
  y1: number
  color: string
  above?: number
  width?: number
  endGap?: number
  circular?: boolean
  sx?: number
  sy?: number
  sz?: number
  y0Short?: number
}) {
  const yaw = Math.atan2(x, z)
  const peak = Math.max(0.22, above * 1.15)
  const xAbs = sx > 0 ? sx / 2 : Math.abs(x)
  const zAbs = sz > 0 ? sz / 2 : Math.abs(z)
  const dx = Math.sign(x) || 1
  const dz = Math.sign(z) || 1
  const shortY = y0Short ?? y0 + Math.max(0.08, (y1 - y0) * 0.55)
  const geometry = useMemo(() => {
    const hole = Math.max(0.08, Math.min(peak * 0.5, width * 3.2))
    const join = Math.max(width * 0.95, 0.028)
    const hug = 0.012
    if (circular && sx > 0 && sz > 0) {
      const rx = sx / 2
      const rz = sz / 2
      const rAvg = Math.max(0.2, (rx + rz) / 2)
      const height = sy > 0 ? sy : y1
      const mid = Math.atan2(z, x)
      const joinA = join / rAvg
      const holeA = hole / rAvg
      const onWall = (angle: number, y: number, extra = 0) => {
        const ny = Math.min(1, Math.max(0, y / Math.max(height, 0.001)))
        const bulge = 1 + 0.07 * Math.sin(Math.PI * ny)
        return new THREE.Vector3(
          Math.cos(angle) * (rx * bulge + hug + extra),
          y,
          Math.sin(angle) * (rz * bulge + hug + extra),
        )
      }
      const curve = new THREE.CatmullRomCurve3([
        onWall(mid - joinA, y0),
        onWall(mid - joinA, y1),
        onWall(mid - holeA, y1 + peak * 0.52, 0.012),
        onWall(mid, y1 + peak, 0.01),
        onWall(mid + holeA, y1 + peak * 0.52, 0.012),
        onWall(mid + joinA, y1),
        onWall(mid + joinA, shortY),
      ])
      return strapGeo(curve, width, Math.max(0.008, width * 0.22))
    }
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-join, y0, hug),
      new THREE.Vector3(-join, y1, hug),
      new THREE.Vector3(-hole, y1 + peak * 0.52, hug),
      new THREE.Vector3(0, y1 + peak, hug),
      new THREE.Vector3(hole, y1 + peak * 0.52, hug),
      new THREE.Vector3(join, y1, hug),
      new THREE.Vector3(join, shortY, hug),
    ])
    return strapGeo(curve, width, Math.max(0.008, width * 0.22))
  }, [circular, sx, sy, sz, x, z, y0, shortY, y1, peak, width])
  useEffect(() => () => geometry.dispose(), [geometry])
  if (circular) {
    return (
      <mesh geometry={geometry} castShadow>
        <Webbing color={color} />
      </mesh>
    )
  }
  return (
    <group position={[dx * xAbs, 0, dz * zAbs]} rotation={[0, yaw, 0]}>
      <mesh geometry={geometry} castShadow>
        <Webbing color={color} />
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
  endGap = 0.28,
  circular = false,
  sx = 0,
  sy = 0,
  sz = 0,
}: {
  x: number
  z: number
  y0: number
  y1: number
  color: string
  above?: number
  width?: number
  endGap?: number
  circular?: boolean
  sx?: number
  sy?: number
  sz?: number
}) {
  const dx = Math.sign(x) || 1
  const dz = Math.sign(z) || 1
  const peak = Math.max(0.12, above)
  const offset = Math.max(width * 2.4, endGap / Math.SQRT2)
  const geometry = useMemo(() => {
    if (circular && sx > 0 && sz > 0) {
      const rx = sx / 2
      const rz = sz / 2
      const rAvg = Math.max(0.2, (rx + rz) / 2)
      const skin = Math.max(0.008, width * 0.28)
      const belly = 0.07
      const height = sy > 0 ? sy : y1
      const arc = Math.max(endGap, width * 8)
      const dTheta = arc / rAvg
      const mid = Math.atan2(z, x)
      const a1 = mid - dTheta / 2
      const a2 = mid + dTheta / 2
      const onWall = (angle: number, y: number, extra = 0) => {
        const ny = Math.min(1, Math.max(0, y / Math.max(height, 0.001)))
        const bulge = 1 + belly * Math.sin(Math.PI * ny)
        let sag = 1
        if (ny < 0.18) sag += (1 - ny / 0.18) * 0.04
        return new THREE.Vector3(
          Math.cos(angle) * (rx * bulge * sag + skin + extra),
          y,
          Math.sin(angle) * (rz * bulge * sag + skin + extra),
        )
      }
      const bow = Math.max(0.06, peak * 0.22)
      const yA = y0 + (y1 - y0) * 0.4
      const yB = y0 + (y1 - y0) * 0.75
      const curve = new THREE.CatmullRomCurve3([
        onWall(a1, y0),
        onWall(a1, yA),
        onWall(a1, yB),
        onWall(a1, y1),
        onWall(a1, y1 + peak * 0.32, bow * 0.35),
        onWall(mid, y1 + peak, bow),
        onWall(a2, y1 + peak * 0.32, bow * 0.35),
        onWall(a2, y1),
        onWall(a2, yB),
        onWall(a2, yA),
        onWall(a2, y0),
      ])
      return strapGeo(curve, width, Math.max(0.008, width * 0.22))
    }
    return boxCornerLoopCurve({ x, z, y0, y1, width, above, endGap, sx, sz })
  }, [circular, sx, sy, sz, x, z, y0, y1, peak, width, offset, endGap, above, dx, dz])
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

function cinchTube(size: string, kind: "rope" | "tie", radius: number) {
  const n = Number.parseFloat(size)
  if (kind === "rope") {
    const mm = Number.isFinite(n) && n > 0 ? n : 8
    return Math.max(radius * 0.07, Math.min(radius * 0.16, mm * 0.0032))
  }
  const mm = Number.isFinite(n) && n > 0 ? n : 6
  return Math.max(0.0038, Math.min(radius * 0.028, mm * 0.00045))
}

function SpoutRope({
  radius,
  y,
  color,
  flip,
  wraps = 1,
  size,
}: {
  radius: number
  y: number
  color: string
  flip?: boolean
  wraps?: number
  size: string
}) {
  const dir = flip ? -1 : 1
  const tube = cinchTube(size, "rope", radius)
  const ring = radius + tube * 1.05
  const n = Math.min(3, Math.max(1, wraps))
  const hang = Math.max(0.1, tube * 9)
  return (
    <group position={[0, y, 0]}>
      {Array.from({ length: n }, (_, i) => (
        <mesh
          key={i}
          position={[0, dir * i * tube * 2.15, 0]}
          rotation={[Math.PI / 2, i * 0.45, 0]}
        >
          <torusGeometry args={[ring, tube, 12, 40]} />
          <meshStandardMaterial
            color={i % 2 ? shade(color, -22) : color}
            roughness={0.58}
            metalness={0.05}
          />
        </mesh>
      ))}
      <mesh position={[ring, dir * hang * 0.42, 0]}>
        <cylinderGeometry args={[tube * 0.92, tube * 0.78, hang, 8]} />
        <meshStandardMaterial color={color} roughness={0.58} />
      </mesh>
      <mesh position={[ring + tube * 1.5, dir * hang * 0.34, tube * 1.1]} rotation={[0.2, 0, 0.18]}>
        <cylinderGeometry args={[tube * 0.82, tube * 0.7, hang * 0.82, 8]} />
        <meshStandardMaterial color={shade(color, -14)} roughness={0.6} />
      </mesh>
      <mesh position={[ring, dir * tube * 0.4, 0]}>
        <sphereGeometry args={[tube * 1.45, 10, 8]} />
        <meshStandardMaterial color={shade(color, -24)} roughness={0.68} />
      </mesh>
    </group>
  )
}

function WebTies({
  radius,
  y,
  color,
  hang,
  pairs = 1,
}: {
  radius: number
  y: number
  color: string
  hang: number
  pairs?: number
}) {
  const h = Math.max(0.1, hang)
  const w = 0.008
  const t = 0.0036
  const n = Math.min(2, Math.max(1, pairs))
  return (
    <group position={[0, y, 0]}>
      {Array.from({ length: n }, (_, p) => (
        <group key={p} rotation={[0, n === 1 ? 0.12 : (p * Math.PI) / n, 0]}>
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[side * w * 1.25, -h * 0.48, radius + t]}
              rotation={[0.22, 0, side * 0.06]}
            >
              <boxGeometry args={[w, h, t]} />
              <Webbing color={color} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function StarBasedCollar({
  radius,
  y,
  color,
  strap,
  flip,
}: {
  radius: number
  y: number
  color: string
  strap: string
  flip?: boolean
}) {
  const dir = flip ? -1 : 1
  const h = Math.max(0.07, radius * 0.62)
  const outer = radius * 1.62
  const rays = 8
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, dir * h * 0.28, 0]} rotation={flip ? [Math.PI, 0, 0] : [0, Math.PI / 8, 0]}>
        <cylinderGeometry args={[outer, radius * 1.02, h, rays, 1, true]} />
        <Fabric color={shade(color, 10)} doubleSide />
      </mesh>
      {Array.from({ length: rays }, (_, i) => {
        const a = (i / rays) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * (radius + outer) * 0.32, dir * h * 0.22, Math.sin(a) * (radius + outer) * 0.32]}
            rotation={[dir * 0.72, a, 0]}
          >
            <planeGeometry args={[outer * 0.38, h * 0.95]} />
            <meshStandardMaterial
              color={shade(color, i % 2 ? -18 : 14)}
              roughness={0.88}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
      {Array.from({ length: rays }, (_, i) => {
        const a = (i / rays) * Math.PI * 2 + Math.PI / rays
        return (
          <mesh key={`seam-${i}`} rotation={[0, a, 0]} position={[0, dir * h * 0.2, 0]}>
            <boxGeometry args={[0.01, h * 0.85, outer * 0.92]} />
            <Fabric color={shade(color, -26)} />
          </mesh>
        )
      })}
      <mesh position={[0, dir * h * 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.12, 0.008, 8, 28]} />
        <Webbing color={strap} />
      </mesh>
      <mesh position={[radius * 1.18, dir * h * 0.22, 0]} rotation={[dir * 0.25, 0, 0.08]}>
        <boxGeometry args={[0.009, h * 0.85, 0.009]} />
        <Webbing color={strap} />
      </mesh>
      <mesh position={[radius * 1.26, dir * h * 0.18, 0.012]} rotation={[dir * 0.2, 0, -0.1]}>
        <boxGeometry args={[0.008, h * 0.72, 0.008]} />
        <Webbing color={strap} />
      </mesh>
    </group>
  )
}

function SpoutCinch({
  radius,
  y,
  rope,
  tie,
  ropeColor,
  tieColor,
  ropeCount,
  tieCount,
  ropeSize,
  tieSize,
  hang = 0.12,
  flip,
}: {
  radius: number
  y: number
  rope?: boolean
  tie?: boolean
  ropeColor: string
  tieColor: string
  ropeCount: number
  tieCount: number
  ropeSize: string
  tieSize: string
  hang?: number
  flip?: boolean
}) {
  if (!rope && !tie) return null
  return (
    <group>
      {rope ? (
        <SpoutRope radius={radius} y={y} color={ropeColor} flip={flip} wraps={ropeCount} size={ropeSize} />
      ) : (
        <WebTies
          radius={radius}
          y={y}
          color={tieColor}
          hang={hang}
          pairs={Math.max(1, Math.round(tieCount / 2))}
        />
      )}
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
  // Mill drawings show one vertical row of large flow apertures.
  const cols = 1
  const rows = 7
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = ((c + 0.5) / cols) * size
      const y = ((r + 0.5) / rows) * size
      ctx.beginPath()
      ctx.ellipse(x, y, size * 0.23, size * 0.055, 0, 0, Math.PI * 2)
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
  const insetX = sx * 0.3
  const insetZ = sz * 0.3
  const h = sy * 0.9
  const panels: [[number, number], [number, number]][] = [
    [
      [sx / 2, sz / 2 - insetZ],
      [sx / 2 - insetX, sz / 2],
    ],
    [
      [-sx / 2, sz / 2 - insetZ],
      [-sx / 2 + insetX, sz / 2],
    ],
    [
      [sx / 2, -sz / 2 + insetZ],
      [sx / 2 - insetX, -sz / 2],
    ],
    [
      [-sx / 2, -sz / 2 + insetZ],
      [-sx / 2 + insetX, -sz / 2],
    ],
  ]
  return (
    <group>
      {panels.map(([a, b], i) => {
        const dx = b[0] - a[0]
        const dz = b[1] - a[1]
        const span = Math.hypot(dx, dz)
        const yaw = Math.atan2(-dz, dx)
        return (
          <group key={i} position={[(a[0] + b[0]) / 2, sy / 2, (a[1] + b[1]) / 2]} rotation={[0, yaw, 0]}>
            <mesh>
              <planeGeometry args={[span, h]} />
              <meshStandardMaterial
                color={safeTint}
                roughness={0.86}
                transparent
                opacity={0.82}
                alphaMap={alpha ?? undefined}
                alphaTest={0.35}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * span * 0.5, 0, 0]}>
                <boxGeometry args={[0.018, h * 1.01, 0.018]} />
                <meshStandardMaterial color={shade(safeTint, -36)} roughness={0.8} />
              </mesh>
            ))}
          </group>
        )
      })}
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
  oversize,
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
  oversize?: boolean
  sx?: number
  sz?: number
}) {
  const dir = flip ? -1 : 1
  const cloth = jute ? "#c4a574" : color
  const h = Math.max(span * 0.38, height)
  if (sx && sz && !flip) {
    const top = oversize ? 1.06 : 0.98
    const botX = sx * 0.99
    const botZ = sz * 0.99
    const topX = sx * top
    const topZ = sz * top
    const midX = (botX + topX) / 2
    const midZ = (botZ + topZ) / 2
    const leanZ = Math.atan2((botZ - topZ) / 2, h)
    const leanX = Math.atan2((botX - topX) / 2, h)
    const t = 0.02
    return (
      <group position={[0, y, 0]}>
        <mesh position={[0, h / 2, midZ / 2]} rotation={[leanZ, 0, 0]}>
          <boxGeometry args={[midX, h, t]} />
          <Fabric color={cloth} doubleSide />
        </mesh>
        <mesh position={[0, h / 2, -midZ / 2]} rotation={[-leanZ, 0, 0]}>
          <boxGeometry args={[midX, h, t]} />
          <Fabric color={cloth} doubleSide />
        </mesh>
        <mesh position={[midX / 2, h / 2, 0]} rotation={[0, 0, -leanX]}>
          <boxGeometry args={[t, h, midZ - t]} />
          <Fabric color={cloth} doubleSide />
        </mesh>
        <mesh position={[-midX / 2, h / 2, 0]} rotation={[0, 0, leanX]}>
          <boxGeometry args={[t, h, midZ - t]} />
          <Fabric color={cloth} doubleSide />
        </mesh>
      </group>
    )
  }
  const mouth = span * 0.52
  const open = span * (oversize ? 0.88 : 0.76)
  const topY = dir * h
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, dir * h * 0.5, 0]} rotation={flip ? [Math.PI, 0, 0] : [0, 0, 0]}>
        <cylinderGeometry args={[open, mouth, h, 36, 1, true]} />
        <Fabric color={cloth} doubleSide />
      </mesh>
      <mesh position={[0, topY, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[open, 0.016, 8, 28]} />
        <Webbing color={drawstring ? strap : shade(cloth, -12)} />
      </mesh>
    </group>
  )
}

function ConicalHopper({
  y,
  span,
  height,
  holeR,
  color,
  flip,
}: {
  y: number
  span: number
  height: number
  holeR: number
  color: string
  flip?: boolean
}) {
  const dir = flip ? -1 : 1
  const h = Math.max(span * 0.28, height)
  const base = span * 0.49
  const hole = Math.min(base * 0.55, Math.max(span * 0.14, holeR))
  return (
    <mesh position={[0, y + dir * h * 0.5, 0]} rotation={flip ? [Math.PI, 0, 0] : [0, 0, 0]}>
      <cylinderGeometry args={[hole, base, h, 36, 1, true]} />
      <Fabric color={color} doubleSide />
    </mesh>
  )
}

function makeSpoutDeckGeo(sx: number, sz: number, holeR: number, circular: boolean) {
  const shape = new THREE.Shape()
  if (circular) {
    shape.absellipse(0, 0, sx * 0.5, sz * 0.5, 0, Math.PI * 2, false, 0)
  } else {
    const hx = sx * 0.5
    const hz = sz * 0.5
    shape.moveTo(-hx, -hz)
    shape.lineTo(hx, -hz)
    shape.lineTo(hx, hz)
    shape.lineTo(-hx, hz)
    shape.closePath()
  }
  const hole = new THREE.Path()
  hole.absellipse(0, 0, holeR, holeR, 0, Math.PI * 2, true, 0)
  shape.holes.push(hole)
  const geo = new THREE.ShapeGeometry(shape, 36)
  geo.rotateX(-Math.PI / 2)
  geo.computeVertexNormals()
  return geo
}

function SpoutDeck({
  sx,
  sy,
  sz,
  holeR,
  color,
  circular,
}: {
  sx: number
  sy: number
  sz: number
  holeR: number
  color: string
  circular: boolean
}) {
  const geometry = useMemo(
    () => makeSpoutDeckGeo(sx, sz, holeR, circular),
    [sx, sz, holeR, circular],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh geometry={geometry} position={[0, sy + 0.003, 0]} receiveShadow>
      <Fabric color={color} doubleSide />
    </mesh>
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
  circular = false,
  rope = false,
  tie = false,
  ropeColor,
  tieColor,
  ropeCount = 1,
  tieCount = 1,
  ropeSize = "8",
  tieSize = "6",
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
  circular?: boolean
  rope?: boolean
  tie?: boolean
  ropeColor?: string
  tieColor?: string
  ropeCount?: number
  tieCount?: number
  ropeSize?: string
  tieSize?: string
}) {
  const fillingSpout = /^top spout$/i.test(topType.trim())
  const skirt = /duffle|skrit|skirt|leno|jute|drawstring|top \+ skrit|oversize/i.test(topType)
  const conicalPlate = /plate/i.test(topType)
  const conicalTop = /conical/i.test(topType) && !conicalPlate
  const petal = /petal/i.test(spoutType)
  const iris = /iris|pyjama/i.test(spoutType)
  const starBased = /star/i.test(spoutType)
  const jute = /jute/i.test(topType)
  const drawstring = /drawstring/i.test(topType)
  const oversize = /oversize/i.test(topType)
  const span = Math.min(sx, sz)
  const skirtH = Math.max(span * 0.42, duffleH || span * 0.48)
  const hopperH = Math.max(span * 0.32, conicalH)
  const shownSpoutH = clearHandle ? Math.min(0.1, spoutH * 0.35) : spoutH
  const shownSpoutR = clearHandle ? Math.min(spoutR, span * 0.22) : Math.max(spoutR, span * 0.16)

  return (
    <group>
      {fillingSpout && !clearHandle ? (
        <SpoutDeck sx={sx} sy={sy} sz={sz} holeR={shownSpoutR * 0.92} color={color} circular={circular} />
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
          oversize={oversize}
          sx={sx}
          sz={sz}
        />
      ) : null}
      {(conicalPlate || conicalTop) && !clearHandle ? (
        <ConicalHopper y={sy} span={span} height={hopperH} holeR={shownSpoutR} color={color} />
      ) : null}
      {conicalPlate && !clearHandle ? (
        <SpoutDeck sx={sx} sy={sy} sz={sz} holeR={span * 0.46} color={color} circular={circular} />
      ) : null}
      {(fillingSpout || conicalPlate) && !skirt ? (
        <group
          position={[
            0,
            sy +
              (clearHandle
                ? -shownSpoutH * 0.15
                : conicalPlate || conicalTop
                  ? hopperH * 0.92
                  : 0),
            0,
          ]}
        >
          <mesh position={[0, shownSpoutH / 2, 0]} castShadow>
            <cylinderGeometry
              args={[
                shownSpoutR * (petal ? 0.78 : 0.92),
                shownSpoutR,
                shownSpoutH,
                28,
                1,
                !clearHandle,
              ]}
            />
            <Fabric color={color} doubleSide={!clearHandle} />
          </mesh>
          {petal && !clearHandle && !starBased ? (
            <Petals radius={shownSpoutR * 1.05} height={shownSpoutH} color={color} bagSpan={span} />
          ) : null}
          {iris && !clearHandle && !starBased ? <Iris radius={shownSpoutR * 1.05} height={shownSpoutH} strap={strap} /> : null}
          {starBased && !clearHandle ? (
            <StarBasedCollar radius={shownSpoutR} y={shownSpoutH * 0.08} color={color} strap={strap} />
          ) : null}
        </group>
      ) : null}
      {!clearHandle && (rope || tie || drawstring || fillingSpout) && (skirt || fillingSpout || conicalPlate || conicalTop) ? (
        <SpoutCinch
          radius={skirt ? span * (oversize ? 0.88 : 0.76) : shownSpoutR}
          y={
            skirt
              ? sy + skirtH
              : sy +
                (conicalPlate || conicalTop ? hopperH * 0.92 : 0) +
                shownSpoutH * 0.5
          }
          rope={rope}
          tie={(tie || drawstring || fillingSpout) && !rope}
          ropeColor={ropeColor || strap}
          tieColor={tieColor || strap}
          ropeCount={ropeCount}
          tieCount={tieCount}
          ropeSize={ropeSize}
          tieSize={tieSize}
          hang={Math.max(0.1, shownSpoutH * 0.55)}
        />
      ) : null}
      {flap && !clearHandle ? (
        <mesh position={[span * 0.05, sy + (fillingSpout ? spoutH * 0.15 : 0.05), 0]} rotation={[0.22, 0.08, 0]}>
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
  rope = false,
  tie = false,
  ropeColor,
  tieColor,
  ropeCount = 1,
  tieCount = 1,
  ropeSize = "8",
  tieSize = "6",
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
  rope?: boolean
  tie?: boolean
  ropeColor?: string
  tieColor?: string
  ropeCount?: number
  tieCount?: number
  ropeSize?: string
  tieSize?: string
}) {
  const fillingSpout = /^bottom spout$/i.test(bottomType.trim())
  const skirt = /skirt/i.test(bottomType) && !/conical/i.test(bottomType) && !/star/i.test(bottomType)
  const conicalPlate = /plate/i.test(bottomType)
  const conicalBase = /conical/i.test(bottomType) && !conicalPlate
  const star = /star/i.test(bottomType) || /star/i.test(spoutType)
  const starBased = /star/i.test(spoutType) || /star/i.test(bottomType)
  const petal = /petal/i.test(spoutType)
  const iris = /iris|pyjama|bonnet/i.test(spoutType)
  const span = Math.min(sx, sz)
  const skirtH = Math.max(span * 0.38, conicalH * 0.65)
  const hopperH = Math.max(span * 0.28, conicalH)
  const holeR = Math.max(spoutR, span * 0.16)
  const shownSpoutH = Math.max(spoutH, span * 0.22)
  const showDischarge = fillingSpout || conicalPlate || star
  const spoutRoot = conicalPlate || conicalBase ? -hopperH * 0.92 : 0

  return (
    <group>
      {(conicalPlate || conicalBase) && !star ? (
        <ConicalHopper y={0} span={span} height={hopperH} holeR={holeR} color={color} flip />
      ) : null}
      {skirt ? (
        <Skirt
          y={0}
          span={span}
          height={skirtH}
          color={color}
          strap={strap}
          flip
        />
      ) : null}
      {showDischarge ? (
        <group position={[0, spoutRoot, 0]}>
          <mesh position={[0, -shownSpoutH / 2, 0]} castShadow>
            <cylinderGeometry args={[holeR, holeR * 0.92, shownSpoutH, 28]} />
            <Fabric color={color} />
          </mesh>
          {petal && !star ? (
            <Petals radius={holeR * 1.05} height={shownSpoutH} color={color} bagSpan={span} flip />
          ) : null}
          {iris && !starBased ? <Iris radius={holeR} height={shownSpoutH} strap={strap} flip /> : null}
          {starBased ? (
            <StarBasedCollar radius={holeR} y={-0.02} color={color} strap={strap} flip />
          ) : null}
          {flap ? (
            <mesh position={[span * 0.12, -0.03, 0]} rotation={[0.55, 0.1, 0]}>
              <boxGeometry args={[span * 0.55, 0.016, span * 0.55]} />
              <Fabric color={color} />
            </mesh>
          ) : null}
        </group>
      ) : null}
      {(rope || tie || fillingSpout) && (skirt || showDischarge || conicalBase) ? (
        <SpoutCinch
          radius={skirt ? span * 0.76 : holeR}
          y={skirt ? -skirtH : spoutRoot - shownSpoutH * 0.5}
          rope={rope}
          tie={(Boolean(tie) || fillingSpout) && !rope}
          ropeColor={ropeColor || strap}
          tieColor={tieColor || strap}
          ropeCount={ropeCount}
          tieCount={tieCount}
          ropeSize={ropeSize}
          tieSize={tieSize}
          hang={Math.max(0.1, shownSpoutH * 0.55)}
          flip
        />
      ) : null}
      {flap && !showDischarge ? (
        <mesh position={[0, -0.03, 0]}>
          <boxGeometry args={[span * 0.55, 0.016, span * 0.55]} />
          <Fabric color={color} />
        </mesh>
      ) : null}
    </group>
  )
}

function StevedoreStrap({
  start,
  end,
  y,
  color,
  width,
}: {
  start: [number, number]
  end: [number, number]
  y: number
  color: string
  width: number
}) {
  const geometry = useMemo(() => {
    const [x1, z1] = start
    const [x2, z2] = end
    const mx = (x1 + x2) / 2
    const mz = (z1 + z2) / 2
    const span = Math.hypot(x2 - x1, z2 - z1)
    const rise = Math.max(0.22, Math.min(0.38, span * 0.32))
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x1, y, z1),
      new THREE.Vector3(mx, y + rise, mz),
      new THREE.Vector3(x2, y, z2),
    ])
    return strapGeo(curve, width, Math.max(0.008, width * 0.2))
  }, [start, end, y, width])
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
  stevedoreColor,
  stevedoreCount = 1,
  ancerie = false,
  tunnelEnabled = false,
  tunnelColor,
  protector,
  loopAbove = 0.3,
  sewDown = 0.35,
  strapWidth = 0.05,
  crossEndGap = 0.2,
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
  stevedoreColor?: string
  stevedoreCount?: number
  ancerie?: boolean
  tunnelEnabled?: boolean
  tunnelColor?: string
  protector: boolean
  loopAbove?: number
  sewDown?: number
  strapWidth?: number
  crossEndGap?: number
}) {
  const c = construction.replace(/[-\s+/]/g, "").toLowerCase()
  const style = bodyStyle.toLowerCase()
  const hood = c.includes("hood") || style.includes("hood")
  const tunnel = tunnelEnabled || style.includes("tunnel") || c.includes("tunnel")
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
  const y1 = sy + 0.01
  const cornerDown = tillBottom ? sy * 0.92 : Math.min(sy * 0.68, Math.max(sewDown * 2.2, sy * 0.5))
  const y0Long = tillBottom ? 0.06 : Math.max(0.08, sy - cornerDown)
  const y0Short = tillBottom ? Math.max(y0Long + 0.08, sy * 0.42) : y0Long + (y1 - y0Long) * 0.32
  const y0Corner = y0Long
  const y0Cross = tillBottom || full ? 0.06 : sy - down
  const width = Math.max(0.028, strapWidth)
  const loopGap = Math.max(crossEndGap, Math.min(sx, sz) * 0.16)
  const cornerGap = Math.max(0.22, Math.min(sx, sz) * 0.14)
  const inset = 0.02
  const boxCorners: [number, number][] = [
    [sx / 2 - inset, sz / 2 - inset],
    [-sx / 2 + inset, sz / 2 - inset],
    [sx / 2 - inset, -sz / 2 + inset],
    [-sx / 2 + inset, -sz / 2 + inset],
  ]
  const roundCorners: [number, number][] = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].map(
    (angle) => [(sx / 2) * Math.cos(angle), (sz / 2) * Math.sin(angle)],
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
  const steveColor = stevedoreColor || strap
  const steveWidth = Math.max(width * 0.85, 0.028)
  const steveN = Math.min(2, Math.max(1, stevedoreCount))
  const off = Math.min(sx, sz) * 0.22
  const lengthBridges: [[number, number], [number, number]][] =
    steveN === 1
      ? [[[-sx / 2 + inset, 0], [sx / 2 - inset, 0]]]
      : [
          [[-sx / 2 + inset, off], [sx / 2 - inset, off]],
          [[-sx / 2 + inset, -off], [sx / 2 - inset, -off]],
        ]
  const widthBridges: [[number, number], [number, number]][] =
    steveN === 1
      ? [[[0, -sz / 2 + inset], [0, sz / 2 - inset]]]
      : [
          [[off, -sz / 2 + inset], [off, sz / 2 - inset]],
          [[-off, -sz / 2 + inset], [-off, sz / 2 - inset]],
        ]
  const diagonalBridges: [[number, number], [number, number]][] =
    steveN === 1
      ? [[[-sx / 2 + inset, -sz / 2 + inset], [sx / 2 - inset, sz / 2 - inset]]]
      : [
          [[-sx / 2 + inset, -sz / 2 + inset], [sx / 2 - inset, sz / 2 - inset]],
          [[-sx / 2 + inset, sz / 2 - inset], [sx / 2 - inset, -sz / 2 + inset]],
        ]
  const steveBridges = portion.includes("width")
    ? widthBridges
    : portion.includes("length") || portion.includes("lenght")
      ? lengthBridges
      : diagonalBridges
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
              <FaceSlackLoop
                x={x}
                z={z}
                y0={y0Long}
                y0Short={y0Short}
                y1={y1}
                color={strap}
                above={above}
                width={width}
                endGap={cornerGap}
                circular={circular}
                sx={sx}
                sy={sy}
                sz={sz}
              />
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
            <SlackLoop
              key={`cross-${x}-${z}`}
              x={x}
              z={z}
              y0={y0Cross}
              y1={y1}
              color={strap}
              above={above}
              width={width}
              endGap={loopGap}
              circular={circular}
              sx={sx}
              sy={sy}
              sz={sz}
            />
          ))
        : null}
      {extraLoops.map(([x, z]) => (
        <FaceSlackLoop
          key={`extra-${x}-${z}`}
          x={x}
          z={z}
          y0={y0Corner}
          y0Short={y0Short}
          y1={y1}
          color={strap}
          above={above}
          width={width}
          endGap={cornerGap}
          circular={circular}
          sx={sx}
          sy={sy}
          sz={sz}
        />
      ))}
      {tunnel || sleeve ? (
        <group>
          <mesh position={[0, sy * 0.88, sz / 2 + 0.08]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, sx * 0.72, 16, 1, true]} />
            <Fabric color={tunnelColor || shade(color, -8)} doubleSide />
          </mesh>
          <mesh position={[0, sy * 0.88, -sz / 2 - 0.08]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, sx * 0.72, 16, 1, true]} />
            <Fabric color={tunnelColor || shade(color, -8)} doubleSide />
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
          {steveBridges.map(([start, end], index) => (
            <StevedoreStrap
              key={`st-${index}`}
              start={start}
              end={end}
              y={sy + 0.02}
              color={steveColor}
              width={steveWidth}
            />
          ))}
        </group>
      ) : null}
      {ancerie ? (
        <group>
          {corners.map(([x, z]) => (
            <FaceSlackLoop
              key={`anc-${x}-${z}`}
              x={x}
              z={z}
              y0={sy * 0.9}
              y0Short={sy * 0.96}
              y1={sy + 0.01}
              color={strap}
              above={Math.max(0.1, above * 0.42)}
              width={width * 0.72}
              circular={circular}
              sx={sx}
              sy={sy}
              sz={sz}
            />
          ))}
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
