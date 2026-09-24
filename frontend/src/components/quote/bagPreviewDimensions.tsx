import { useEffect, useMemo } from "react"
import * as THREE from "three"

const LINE = "#1e6b32"
const INK = "#14532d"
const PAPER = "#f4fbf4"

type XYZ = [number, number, number]

function Seg({ a, b }: { a: XYZ; b: XYZ }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)])
    return geo
  }, [a[0], a[1], a[2], b[0], b[1], b[2]])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={LINE} />
    </line>
  )
}

function labelTexture(text: string) {
  const canvas = document.createElement("canvas")
  canvas.width = 384
  canvas.height = 96
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = LINE
  ctx.lineWidth = 4
  ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6)
  ctx.fillStyle = INK
  ctx.font = "700 36px ui-sans-serif, system-ui, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2)
  const map = new THREE.CanvasTexture(canvas)
  map.colorSpace = THREE.SRGBColorSpace
  map.needsUpdate = true
  return map
}

function Chip({ position, text, scale = 1 }: { position: XYZ; text: string; scale?: number }) {
  const map = useMemo(() => labelTexture(text), [text])
  useEffect(() => () => map?.dispose(), [map])
  if (!map) return null
  const width = Math.min(0.92, Math.max(0.48, text.length * 0.038)) * scale
  return (
    <sprite position={position} scale={[width, 0.13 * scale, 1]} renderOrder={20}>
      <spriteMaterial map={map} depthTest={false} transparent />
    </sprite>
  )
}

function Dimension({
  a,
  b,
  fromA,
  fromB,
  label,
}: {
  a: XYZ
  b: XYZ
  fromA: XYZ
  fromB: XYZ
  label: string
}) {
  const mid: XYZ = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  const scale = Math.min(1.2, Math.max(0.8, len / 1.35))
  return (
    <group>
      <Seg a={fromA} b={a} />
      <Seg a={fromB} b={b} />
      <Seg a={a} b={b} />
      <Chip position={mid} text={label} scale={scale} />
    </group>
  )
}

export function BagDimensionKit({
  sx,
  sy,
  sz,
  faceZ,
  lengthCm,
  widthCm,
  heightCm,
  gsm,
  sizeType,
  topSpout,
  bottomSpout,
}: {
  sx: number
  sy: number
  sz: number
  faceZ: number
  lengthCm: number
  widthCm: number
  heightCm: number
  gsm: string
  sizeType: string
  topSpout: { r: number; h: number; diaCm: number; heightCm: number } | null
  bottomSpout: { r: number; h: number; diaCm: number; heightCm: number } | null
}) {
  const gap = Math.max(0.16, Math.min(sx, sz) * 0.16)
  const yBase = 0.02
  const hx = sx / 2
  const hz = sz / 2
  const sizeNote = sizeType === "OUTER" ? " outer" : " inner"
  const gsmLabel = (gsm || "").trim() ? `${gsm.trim()} GSM` : null
  const spoutGap = Math.max(0.1, gap * 0.7)

  return (
    <group>
      <Dimension
        fromA={[-hx, yBase, hz]}
        fromB={[hx, yBase, hz]}
        a={[-hx, yBase, hz + gap]}
        b={[hx, yBase, hz + gap]}
        label={`L ${lengthCm} cm${sizeNote}`}
      />
      <Dimension
        fromA={[hx, yBase, -hz]}
        fromB={[hx, yBase, hz]}
        a={[hx + gap, yBase, -hz]}
        b={[hx + gap, yBase, hz]}
        label={`W ${widthCm} cm`}
      />
      <Dimension
        fromA={[-hx, 0, hz]}
        fromB={[-hx, sy, hz]}
        a={[-hx - gap, 0, hz]}
        b={[-hx - gap, sy, hz]}
        label={`H ${heightCm} cm`}
      />
      {gsmLabel ? <Chip position={[0, sy * 0.48, faceZ + 0.06]} text={gsmLabel} scale={1.08} /> : null}
      {topSpout ? (
        <group>
          <Dimension
            fromA={[-topSpout.r, sy + topSpout.h * 0.55, 0]}
            fromB={[topSpout.r, sy + topSpout.h * 0.55, 0]}
            a={[-topSpout.r, sy + topSpout.h * 0.55, topSpout.r + spoutGap]}
            b={[topSpout.r, sy + topSpout.h * 0.55, topSpout.r + spoutGap]}
            label={`Top Dia ${topSpout.diaCm} cm`}
          />
          <Dimension
            fromA={[topSpout.r, sy, 0]}
            fromB={[topSpout.r, sy + topSpout.h, 0]}
            a={[topSpout.r + spoutGap, sy, 0]}
            b={[topSpout.r + spoutGap, sy + topSpout.h, 0]}
            label={`Top H ${topSpout.heightCm} cm`}
          />
        </group>
      ) : null}
      {bottomSpout ? (
        <group>
          <Dimension
            fromA={[-bottomSpout.r, -bottomSpout.h * 0.5, 0]}
            fromB={[bottomSpout.r, -bottomSpout.h * 0.5, 0]}
            a={[-bottomSpout.r, -bottomSpout.h * 0.5, -(bottomSpout.r + spoutGap)]}
            b={[bottomSpout.r, -bottomSpout.h * 0.5, -(bottomSpout.r + spoutGap)]}
            label={`Bot Dia ${bottomSpout.diaCm} cm`}
          />
          <Dimension
            fromA={[-bottomSpout.r, 0, 0]}
            fromB={[-bottomSpout.r, -bottomSpout.h, 0]}
            a={[-(bottomSpout.r + spoutGap), 0, 0]}
            b={[-(bottomSpout.r + spoutGap), -bottomSpout.h, 0]}
            label={`Bot H ${bottomSpout.heightCm} cm`}
          />
        </group>
      ) : null}
    </group>
  )
}

export function dimensionFrame(spec: {
  length: string
  width: string
  height: string
  constructionType: string
  bodyStyle: string
  topType: string
  bottomType: string
  topSpoutDia?: string
  topSpoutHeight?: string
  bottomSpoutDia?: string
  bottomSpoutHeight?: string
  conicalTop?: string
  bottomConicalHeight?: string
}) {
  const toNum = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseFloat(value || "")
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  }
  const length = toNum(spec.length, 90)
  const width = toNum(spec.width, 90)
  const height = toNum(spec.height, 110)
  const scale = 2.2 / Math.max(length, width, height)
  const sx = length * scale
  const sy = height * scale
  const sz = width * scale
  const construction = spec.constructionType.replace(/[-\s+/]/g, "").toLowerCase()
  const circular = construction.includes("circular") && !construction.includes("inner")
  const baffle = construction.includes("buffle") || construction.includes("baffle")
  const upanel = construction.includes("upanel") && !construction.includes("single") && !construction.includes("double")
  const belly = circular ? 0.07 : baffle ? 0.015 : upanel ? 0 : 0.05
  const topDiaCm = toNum(spec.topSpoutDia, 0)
  const topHCm = toNum(spec.topSpoutHeight, 0)
  const botDiaCm = toNum(spec.bottomSpoutDia, 0)
  const botHCm = toNum(spec.bottomSpoutHeight, 0)
  const spoutTopH = Math.max(0.08, (topHCm || 50) * scale)
  const spoutTopR = Math.min(Math.min(sx, sz) * 0.48, Math.max(0.05, ((topDiaCm || 40) * scale) / 2))
  const spoutBotH = Math.max(0.08, (botHCm || 40) * scale)
  const spoutBotR = Math.min(Math.min(sx, sz) * 0.48, Math.max(0.05, ((botDiaCm || 35) * scale) / 2))
  const conicalH = Math.max(0.08, toNum(spec.conicalTop || spec.bottomConicalHeight, 30) * scale)
  const lift = /spout/i.test(spec.bottomType) ? spoutBotH : /conical|skirt/i.test(spec.bottomType) ? conicalH : 0
  const faceZ = upanel ? sz / 2 + 0.01 : (sz / 2) * (1 + belly) + 0.04
  const topSpout =
    /spout/i.test(spec.topType) && topDiaCm > 0
      ? { r: spoutTopR, h: spoutTopH, diaCm: topDiaCm, heightCm: topHCm || 50 }
      : null
  const bottomSpout =
    /spout/i.test(spec.bottomType) && botDiaCm > 0
      ? { r: spoutBotR, h: spoutBotH, diaCm: botDiaCm, heightCm: botHCm || 40 }
      : null
  return { sx, sy, sz, lift: lift + 0.02, faceZ, length, width, height, topSpout, bottomSpout }
}
