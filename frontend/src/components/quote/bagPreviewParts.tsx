import { useEffect, useMemo } from "react"
import * as THREE from "three"

export const CATALOG_INK = "#1c1c1c"

export function shade(hex: string, amount: number) {
  const n = Number.parseInt(hex.slice(1), 16)
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + amount))
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amount))
  const b = Math.min(255, Math.max(0, (n & 255) + amount))
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

export function fabricColor(colour: string) {
  switch (colour) {
    case "Blue":
      return "#5b92cc"
    case "Green":
      return "#6bb56e"
    case "Black":
      return "#5c5c5a"
    case "Natural":
      return "#c9a36a"
    case "Milky White":
      return "#f4e2b8"
    case "White":
      return "#f5f6f8"
    default:
      return "#f5f6f8"
  }
}

export function webbingColor(colour: string) {
  switch (colour) {
    case "Black":
      return "#8a8a86"
    case "Green":
      return "#2f7a3f"
    case "Blue":
      return "#1f4e82"
    default:
      return "#c4d02a"
  }
}

let weaveTexture: THREE.CanvasTexture | null = null
export function getWeave() {
  if (weaveTexture) return weaveTexture
  const size = 128
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("weave")
  ctx.fillStyle = "#f3f3f3"
  ctx.fillRect(0, 0, size, size)
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      ctx.fillStyle = (x + y) % 4 === 0 ? "#ffffff" : "#e6e6e6"
      ctx.fillRect(x, y, 2, 2)
    }
  }
  weaveTexture = new THREE.CanvasTexture(canvas)
  weaveTexture.colorSpace = THREE.SRGBColorSpace
  weaveTexture.wrapS = weaveTexture.wrapT = THREE.RepeatWrapping
  weaveTexture.anisotropy = 8
  weaveTexture.repeat.set(16, 20)
  return weaveTexture
}

export function Fabric({ color, doubleSide }: { color: string; doubleSide?: boolean }) {
  const weave = getWeave()
  return (
    <meshStandardMaterial
      color={color}
      map={weave}
      roughness={0.92}
      metalness={0}
      bumpMap={weave}
      bumpScale={0.025}
      side={doubleSide ? THREE.DoubleSide : THREE.FrontSide}
    />
  )
}

export function Webbing({ color }: { color: string }) {
  return <meshStandardMaterial color={color} roughness={0.52} metalness={0.04} />
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
}: {
  x: number
  z: number
  y0: number
  y1: number
  color: string
}) {
  const yaw = Math.atan2(x, z)
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.11, y0, 0.02),
      new THREE.Vector3(-0.12, y1 + 0.08, 0.1),
      new THREE.Vector3(0, y1 + 0.32, 0.14),
      new THREE.Vector3(0.12, y1 + 0.08, 0.1),
      new THREE.Vector3(0.11, y0, 0.02),
    ])
    return strapGeo(curve, 0.055, 0.012)
  }, [y0, y1])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
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
}: {
  x: number
  z: number
  y0: number
  y1: number
  color: string
}) {
  const dx = Math.sign(x) || 1
  const dz = Math.sign(z) || 1
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x - dx * 0.1, y0, z + dz * 0.02),
      new THREE.Vector3(x - dx * 0.12, (y0 + y1) * 0.5, z + dz * 0.08),
      new THREE.Vector3(x - dx * 0.04, y1 + 0.1, z - dz * 0.02),
      new THREE.Vector3(x + dx * 0.02, y1 + 0.3, z - dz * 0.08),
      new THREE.Vector3(x + dx * 0.06, y1 + 0.08, z - dz * 0.12),
      new THREE.Vector3(x + dx * 0.02, (y0 + y1) * 0.5, z - dz * 0.12),
      new THREE.Vector3(x + dx * 0.02, y0, z - dz * 0.1),
    ])
    return strapGeo(curve, 0.055, 0.012)
  }, [x, z, y0, y1, dx, dz])
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
      {[0.45, 0.62, 0.78].map((t, index) => (
        <mesh key={t} position={[0, dir * height * t, 0]} rotation={[Math.PI / 2, index * 0.35, 0]}>
          <torusGeometry args={[radius * (0.95 - index * 0.08), 0.014, 8, 20]} />
          <Webbing color={strap} />
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
}: {
  y: number
  span: number
  height: number
  color: string
  strap: string
  jute?: boolean
  drawstring?: boolean
  flip?: boolean
}) {
  const dir = flip ? -1 : 1
  const cloth = jute ? "#c4a574" : color
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, dir * height * 0.45, 0]} rotation={flip ? [Math.PI, 0, 0] : [0, 0, 0]}>
        <cylinderGeometry args={[span * 0.18, span * 0.42, height, 24, 1, true]} />
        <Fabric color={cloth} doubleSide />
      </mesh>
      <mesh position={[0, dir * height * 0.88, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[span * 0.16, 0.016, 8, 20]} />
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
  const open = /^open$/i.test(topType)
  const spout = /spout/i.test(topType)
  const skirt = /duffle|skrit|skirt|leno|jute|drawstring/i.test(topType)
  const conical = /conical/i.test(topType)
  const petal = /petal/i.test(spoutType)
  const iris = /iris|pyjama/i.test(spoutType)
  const jute = /jute/i.test(topType)
  const drawstring = /drawstring/i.test(topType)
  const span = Math.min(sx, sz)
  const skirtH = Math.max(0.18, duffleH)
  const shownSpoutH = clearHandle ? Math.min(0.1, spoutH * 0.35) : spoutH
  const shownSpoutR = clearHandle ? Math.min(spoutR, span * 0.1) : spoutR

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
        <Skirt y={sy} span={span} height={skirtH} color={color} strap={strap} jute={jute} drawstring={drawstring} />
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
                shownSpoutR * (petal ? 0.78 : 0.86),
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
              <Petals
                radius={shownSpoutR * 1.05}
                height={shownSpoutH}
                color={color}
                bagSpan={span}
              />
            </>
          ) : null}
          {iris && !clearHandle ? <Iris radius={shownSpoutR * 1.05} height={shownSpoutH} strap={strap} /> : null}
          {!petal && !iris && !clearHandle ? (
            <>
              <mesh position={[0, shownSpoutH + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[shownSpoutR * 0.86, 20]} />
                <Fabric color={shade(color, -8)} />
              </mesh>
              <mesh position={[0, shownSpoutH * 0.72, 0]}>
                <boxGeometry args={[shownSpoutR * 1.85, 0.022, 0.022]} />
                <Webbing color={strap} />
              </mesh>
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
  const eight = loopCount >= 8 && !liftBag
  const cross = /cross/i.test(loopKind)
  const full = /full/i.test(loopKind)
  const cornerKind = /corner/i.test(loopKind) && !cross
  const y0Corner = sy * 0.84
  const y0Cross = tillBottom || full ? 0.08 : sy * 0.38
  const y1 = sy + 0.02
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
  const nCorner = Math.min(4, loopCount < 8 ? Math.max(2, loopCount) : 4)
  const showCorner =
    (single4 || double4) ||
    (loopEnabled && !liftBag && !hood && (cornerKind || (eight && !cross)))
  const showCross = loopEnabled && !liftBag && !hood && (cross || full)
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

  return (
    <group>
      {single || single4 ? <FabricBodyLoop sx={sx} sy={sy} sz={sz} color={color} strap={strap} ribbon={span * 0.22} /> : null}
      {double || double4 ? (
        <group>
          <FabricBodyLoop sx={sx} sy={sy} sz={sz} x={sx * 0.2} color={color} strap={strap} ribbon={span * 0.12} />
          <FabricBodyLoop sx={sx} sy={sy} sz={sz} x={-sx * 0.2} color={color} strap={strap} ribbon={span * 0.12} />
        </group>
      ) : null}
      {showCorner
        ? cornerSet.map(([x, z]) => (
            <group key={`corner-${x}-${z}`}>
              <FaceSlackLoop x={x} z={z} y0={y0Corner} y1={y1} color={strap} />
              {protector ? (
                <mesh position={[x, y0Corner + 0.04, z]}>
                  <boxGeometry args={[0.1, 0.08, 0.04]} />
                  <Fabric color={shade(color, -12)} />
                </mesh>
              ) : null}
            </group>
          ))
        : null}
      {showCross
        ? cornerSet.map(([x, z]) => (
            <SlackLoop key={`cross-${x}-${z}`} x={x} z={z} y0={y0Cross} y1={y1} color={strap} />
          ))
        : null}
      {eight
        ? mids.map(([x, z]) => <FaceSlackLoop key={`m-${x}-${z}`} x={x} z={z} y0={sy * 0.5} y1={y1} color={strap} />)
        : null}
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
          <FaceSlackLoop x={0} z={0.02} y0={sy + 0.2} y1={sy + 0.38} color={strap} />
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
      {dropLoop && !liftBag ? <FaceSlackLoop x={0} z={sz / 2} y0={sy * 0.72} y1={sy + 0.02} color={strap} /> : null}
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
