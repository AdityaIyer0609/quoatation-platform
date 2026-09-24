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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function labelTexture(text: string) {
  const dpr = 2
  const fontSize = 42
  const padX = 22
  const padY = 12
  const font = `700 ${fontSize}px "Segoe UI", ui-sans-serif, system-ui, sans-serif`
  const probe = document.createElement("canvas").getContext("2d")
  if (!probe) return null
  probe.font = font
  const textW = Math.ceil(probe.measureText(text).width)
  const cssW = textW + padX * 2
  const cssH = fontSize + padY * 2
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(2, Math.ceil(cssW * dpr))
  canvas.height = Math.max(2, Math.ceil(cssH * dpr))
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.scale(dpr, dpr)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  roundRect(ctx, 0.5, 0.5, cssW - 1, cssH - 1, 8)
  ctx.fillStyle = PAPER
  ctx.fill()
  ctx.lineWidth = 1.5
  ctx.strokeStyle = LINE
  ctx.stroke()
  ctx.fillStyle = INK
  ctx.font = font
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, cssW / 2, cssH / 2 + 0.5)
  const map = new THREE.CanvasTexture(canvas)
  map.colorSpace = THREE.SRGBColorSpace
  map.minFilter = THREE.LinearFilter
  map.magFilter = THREE.LinearFilter
  map.generateMipmaps = false
  map.anisotropy = 8
  map.needsUpdate = true
  return { map, aspect: cssW / cssH }
}

function Chip({ position, text, scale = 1 }: { position: XYZ; text: string; scale?: number }) {
  const tex = useMemo(() => labelTexture(text), [text])
  useEffect(() => () => tex?.map.dispose(), [tex])
  if (!tex) return null
  const width = Math.min(1.05, Math.max(0.5, text.length * 0.042)) * scale
  return (
    <sprite position={position} scale={[width, width / tex.aspect, 1]} renderOrder={20}>
      <spriteMaterial map={tex.map} depthTest={false} transparent toneMapped={false} />
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
  const dischargeLift = /plate/i.test(spec.bottomType)
    ? Math.max(conicalH, Math.min(sx, sz) * 0.28) + spoutBotH * 0.92
    : /conical/i.test(spec.bottomType)
      ? Math.max(conicalH, Math.min(sx, sz) * 0.28)
      : /skirt/i.test(spec.bottomType)
        ? Math.max(conicalH, Math.min(sx, sz) * 0.38)
        : /spout|star/i.test(spec.bottomType) || /star/i.test(spec.bottomSpoutType)
          ? spoutBotH
          : 0
  const coverBot = spec.bottomFlap && spec.bottomHook
  const flapHang = spec.bottomFlap && !spec.bottomHook ? Math.min(sx, sz) * 0.92 : 0
  const lift = coverBot ? 0.02 : Math.max(dischargeLift, flapHang)
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
