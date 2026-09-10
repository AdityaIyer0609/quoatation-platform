import { Bounds, ContactShadows, OrbitControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useEffect, useMemo } from "react"
import * as THREE from "three"

import {
  DischargeKit,
  Fabric,
  FillingKit,
  InkEdges,
  LoopKit,
  StitchKit,
  UPanelWrap,
  fabricColor,
  shade,
  webbingColor,
} from "@/components/quote/bagPreviewParts"
import type { QuoteSpecification } from "@/types/quote"

function num(value: string, fallback: number) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function isPrinted(printing: string) {
  return Boolean(printing) && printing !== "UnPrinted"
}

function makeSackGeometry(sx: number, sy: number, sz: number, belly: number, tubular: boolean, gatherTop = false) {
  const hy = sy / 2
  if (tubular) {
    const geo = new THREE.CylinderGeometry(1, 1, sy, 48, 16)
    const pos = geo.attributes.position
    const rx = sx / 2
    const rz = sz / 2
    for (let i = 0; i < pos.count; i += 1) {
      let x = pos.getX(i)
      let y = pos.getY(i)
      let z = pos.getZ(i)
      const ny = (y + hy) / sy
      const wave = Math.sin(Math.PI * Math.min(1, Math.max(0, ny)))
      const bulge = 1 + belly * wave
      let sag = 1
      if (ny < 0.18) {
        const t = 1 - ny / 0.18
        y -= t * sy * 0.02
        sag += t * 0.04
      }
      let pinch = 1
      if (gatherTop && ny > 0.72) {
        pinch = 1 - ((ny - 0.72) / 0.28) * 0.28
      }
      x *= rx * bulge * sag * pinch
      z *= rz * bulge * sag * pinch
      pos.setXYZ(i, x, y, z)
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
    return geo
  }
  const geo = new THREE.BoxGeometry(sx, sy, sz, 18, 24, 18)
  const pos = geo.attributes.position
  const rx = sx / 2
  const rz = sz / 2
  const cornerR = Math.min(rx, rz) * 0.28
  for (let i = 0; i < pos.count; i += 1) {
    let x = pos.getX(i)
    let y = pos.getY(i)
    let z = pos.getZ(i)
    const ax = Math.abs(x)
    const az = Math.abs(z)
    const xEdge = rx - cornerR
    const zEdge = rz - cornerR
    if (ax > xEdge && az > zEdge) {
      const ox = ax - xEdge
      const oz = az - zEdge
      const len = Math.hypot(ox, oz)
      if (len > cornerR) {
        const s = cornerR / len
        x = Math.sign(x) * (xEdge + ox * s)
        z = Math.sign(z) * (zEdge + oz * s)
      }
    }
    const ny = (y + hy) / sy
    const wave = Math.sin(Math.PI * Math.min(1, Math.max(0, ny)))
    const bulge = 1 + belly * wave
    x *= bulge
    z *= bulge
    if (ny < 0.2) {
      const t = 1 - ny / 0.2
      y -= t * sy * 0.03
      x *= 1 + t * 0.04
      z *= 1 + t * 0.04
    }
    pos.setXYZ(i, x, y, z)
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

function FibcBag({ spec }: { spec: QuoteSpecification }) {
  const model = useMemo(() => {
    const length = num(spec.length, 90)
    const width = num(spec.width, 90)
    const height = num(spec.height, 110)
    const scale = 2.35 / Math.max(length, width, height)
    const sx = length * scale
    const sy = height * scale
    const sz = width * scale
    const construction = spec.constructionType.replace(/[-\s+/]/g, "").toLowerCase()
    const liftBag =
      construction === "singleloop" ||
      construction === "doubleloop" ||
      construction === "single4loop" ||
      construction === "double4loop"
    const circular = construction.includes("circular") && !construction.includes("inner")
    const baffle = construction.includes("buffle") || construction.includes("baffle")
    const upanel = construction.includes("upanel") && !liftBag
    const fourPanel = construction.includes("4panel") && !liftBag
    const footprint = Math.min(sx, sz)
    return {
      sx,
      sy,
      sz,
      circular,
      liftBag,
      baffle,
      upanel,
      fourPanel,
      color: fabricColor(spec.fabricColour),
      strap: webbingColor(spec.fabricColour),
      spoutTopH: Math.min(sy * 0.2, Math.max(0.16, num(spec.topSpoutHeight, 50) * scale * 0.7)),
      spoutTopR: Math.min(footprint * 0.16, Math.max(0.09, (num(spec.topSpoutDia, 40) * scale) / 2)),
      spoutBotH: Math.min(sy * 0.16, Math.max(0.14, num(spec.bottomSpoutHeight, 40) * scale * 0.7)),
      spoutBotR: Math.min(footprint * 0.14, Math.max(0.08, (num(spec.bottomSpoutDia, 35) * scale) / 2)),
      duffleH: Math.min(sy * 0.18, Math.max(0.16, num(spec.duffleHeight, 50) * scale * 0.28)),
      conicalH: Math.min(sy * 0.16, Math.max(0.14, num(spec.conicalTop || spec.bottomConicalHeight, 30) * scale * 0.32)),
      loopCount: Math.min(8, Math.max(0, Number.parseInt(spec.loopCount || "4", 10) || 4)),
      doc: spec.docPouch,
      printed: isPrinted(spec.printing),
      twoSided: /^2S/i.test(spec.printing || ""),
      twoColor: /2C/i.test(spec.printing || ""),
      belly: circular ? 0.08 : baffle ? 0.035 : liftBag ? 0.07 : 0.06,
      gatherTop: false,
    }
  }, [spec])

  const {
    sx,
    sy,
    sz,
    circular,
    liftBag,
    baffle,
    upanel,
    fourPanel,
    color,
    strap,
    spoutTopH,
    spoutTopR,
    spoutBotH,
    spoutBotR,
    duffleH,
    conicalH,
    loopCount,
    doc,
    printed,
    twoSided,
    twoColor,
    belly,
    gatherTop,
  } = model

  const sack = useMemo(
    () => makeSackGeometry(sx, sy, sz, belly, circular, gatherTop),
    [sx, sy, sz, belly, circular, gatherTop],
  )
  useEffect(() => () => sack.dispose(), [sack])

  const stitch = shade(color, -28)
  const lift =
    (/spout/i.test(spec.bottomType) ? spoutBotH : /conical|skirt/i.test(spec.bottomType) ? conicalH : 0) +
    (upanel ? 0.16 : 0)
  const faceZ = (circular ? sz / 2 : sz / 2) + 0.02
  const inset = 0.02
  const corners = circular
    ? ([Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4] as const).map(
        (angle) => [(sx / 2) * 0.92 * Math.cos(angle), (sz / 2) * 0.92 * Math.sin(angle)] as [number, number],
      )
    : ([
        [sx / 2 - inset, sz / 2 - inset],
        [-sx / 2 + inset, sz / 2 - inset],
        [sx / 2 - inset, -sz / 2 + inset],
        [-sx / 2 + inset, -sz / 2 + inset],
      ] as [number, number][])

  return (
    <group position={[0, lift + 0.02, 0]}>
      <mesh geometry={sack} position={[0, sy / 2, 0]} castShadow>
        <Fabric color={color} />
      </mesh>
      <group position={[0, sy / 2, 0]}>
        <InkEdges geometry={sack} color={shade(color, -85)} />
      </group>

      {upanel ? <UPanelWrap sx={sx} sy={sy} sz={sz} color={color} stitch={stitch} /> : null}

      {fourPanel
        ? corners.map(([x, z]) => {
            const dx = Math.sign(x) || 1
            const dz = Math.sign(z) || 1
            return (
              <group key={`4p-${x}-${z}`}>
                <mesh position={[x, sy / 2, z - dz * 0.04]}>
                  <boxGeometry args={[0.016, sy * 0.9, 0.08]} />
                  <meshStandardMaterial color={stitch} roughness={0.8} />
                </mesh>
                <mesh position={[x - dx * 0.04, sy / 2, z]}>
                  <boxGeometry args={[0.08, sy * 0.9, 0.016]} />
                  <meshStandardMaterial color={stitch} roughness={0.8} />
                </mesh>
              </group>
            )
          })
        : null}

      {baffle ? (
        <group>
          <mesh position={[0, sy / 2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[Math.min(sx, sz) * 0.9, sy * 0.86, 0.016]} />
            <meshStandardMaterial color={shade(color, -36)} roughness={0.82} transparent opacity={0.5} />
          </mesh>
          <mesh position={[0, sy / 2, 0]} rotation={[0, -Math.PI / 4, 0]}>
            <boxGeometry args={[Math.min(sx, sz) * 0.9, sy * 0.86, 0.016]} />
            <meshStandardMaterial color={shade(color, -36)} roughness={0.82} transparent opacity={0.5} />
          </mesh>
        </group>
      ) : null}

      {/ventilat/i.test(spec.bodyStyle)
        ? Array.from({ length: 5 }, (_, row) =>
            Array.from({ length: 4 }, (_, col) => (
              <mesh
                key={`v-${row}-${col}`}
                position={[
                  -sx * 0.28 + col * ((sx * 0.56) / 3),
                  sy * 0.22 + row * ((sy * 0.56) / 4),
                  sz / 2 + 0.012,
                ]}
              >
                <circleGeometry args={[0.035, 12]} />
                <meshStandardMaterial color="#8aa0b8" roughness={0.4} />
              </mesh>
            )),
          )
        : null}

      {spec.linerEnabled && !liftBag ? (
        <mesh position={[0, sy / 2, 0]}>
          <boxGeometry args={[sx * 0.86, sy * 0.86, sz * 0.86]} />
          <meshStandardMaterial color="#d8e8f4" transparent opacity={0.18} roughness={0.35} />
        </mesh>
      ) : null}

      <FillingKit
        sx={sx}
        sy={sy}
        sz={sz}
        color={color}
        strap={strap}
        topType={spec.topType}
        spoutType={spec.topSpoutType}
        flap={spec.topFlap}
        spoutH={spoutTopH}
        spoutR={spoutTopR}
        duffleH={duffleH}
        conicalH={conicalH}
        clearHandle={liftBag}
        flapColor={fabricColor(spec.topFlapColor || spec.fabricColour)}
      />
      <DischargeKit
        sx={sx}
        sy={sy}
        sz={sz}
        color={color}
        strap={strap}
        bottomType={spec.bottomType}
        spoutType={spec.bottomSpoutType}
        flap={spec.bottomFlap}
        spoutH={spoutBotH}
        spoutR={spoutBotR}
        conicalH={conicalH}
      />
      <LoopKit
        sx={sx}
        sy={sy}
        sz={sz}
        circular={circular}
        color={color}
        strap={strap}
        construction={spec.constructionType}
        bodyStyle={spec.bodyStyle}
        loopKind={spec.loopEnabled === false ? "None" : spec.loopConstruction}
        loopEnabled={spec.loopEnabled !== false}
        loopCount={loopCount}
        tillBottom={spec.loopTillBottom}
        dropLoop={spec.dropLoop}
        stevedore={spec.stevedore || spec.steveCover}
        stevedorePortion={spec.stevedorePortion || "Diagonal"}
        protector={spec.loopProtector}
      />
      {liftBag ? null : (
      <StitchKit
        sx={sx}
        sy={sy}
        sz={sz}
        color={color}
        hiracle={spec.hiracle}
        hiracleTop={spec.hiracleTop}
        hiracleBottom={spec.hiracleBottom}
        felt={spec.felt}
        feltTop={spec.feltTop}
        feltBottom={spec.feltBottom}
        feltBody={spec.feltBody}
        fillerCord={spec.fillerCord}
        fillerDouble={
          spec.threadNeedle === "Double" ||
          spec.fillerCordBodyType === "Double" ||
          spec.fillerCordTopType === "Double"
        }
      />
      )}

      {printed ? (
        <>
          <mesh position={[0, sy * 0.52, faceZ]}>
            <planeGeometry args={[sx * 0.32, sy * 0.16]} />
            <meshStandardMaterial color="#f7f3ea" roughness={0.55} />
          </mesh>
          <mesh position={[0, sy * 0.55, faceZ + 0.002]}>
            <circleGeometry args={[sx * 0.06, 24]} />
            <meshStandardMaterial color={strap} roughness={0.5} />
          </mesh>
          {twoColor ? (
            <mesh position={[0, sy * 0.46, faceZ + 0.002]}>
              <planeGeometry args={[sx * 0.22, sy * 0.035]} />
              <meshStandardMaterial color="#1a1a18" roughness={0.5} />
            </mesh>
          ) : null}
          {twoSided ? (
            <mesh position={[0, sy * 0.52, -faceZ]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[sx * 0.32, sy * 0.16]} />
              <meshStandardMaterial color="#f7f3ea" roughness={0.55} />
            </mesh>
          ) : null}
        </>
      ) : null}

      {doc ? (
        <group position={[sx * 0.22, sy * 0.32, faceZ + 0.01]}>
          <mesh castShadow>
            <boxGeometry args={[sx * 0.16, sy * 0.1, 0.024]} />
            <Fabric color={shade(color, 12)} />
          </mesh>
        </group>
      ) : null}
    </group>
  )
}

export default function BagPreviewCanvas({
  specification,
  className,
  interactive = true,
}: {
  specification: QuoteSpecification
  className?: string
  interactive?: boolean
}) {
  return (
    <Canvas
      className={className}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [5.6, 2.8, 6.2], fov: 40, near: 0.08, far: 80 }}
      shadows
    >
      <color attach="background" args={["#edf2f8"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 10, 4]} intensity={1.2} castShadow />
      <directionalLight position={[-4, 3, -5]} intensity={0.32} />
      <Bounds fit observe margin={1.45}>
        <FibcBag spec={specification} />
      </Bounds>
      <ContactShadows position={[0, 0, 0]} opacity={0.38} scale={12} blur={2.8} far={6} />
      <OrbitControls
        makeDefault
        autoRotate={!interactive}
        autoRotateSpeed={0.9}
        enableDamping
        enablePan={interactive}
        enableZoom={interactive}
        enableRotate={interactive}
        minDistance={1.4}
        maxDistance={28}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
      />
    </Canvas>
  )
}
