import { Bounds, ContactShadows, OrbitControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useEffect, useMemo } from "react"
import * as THREE from "three"

import {
  BaffleKit,
  CornerSeamKit,
  DischargeKit,
  Fabric,
  FillingKit,
  InkEdges,
  LoopKit,
  StitchKit,
  UPanelWrap,
  VentilatedFaces,
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
    // Fit longest body edge; keep cm ratios (spouts/loops use same scale — no artificial clamps).
    const scale = 2.2 / Math.max(length, width, height)
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
    const topSpoutDia = num(spec.topSpoutDia, 40)
    const botSpoutDia = num(spec.bottomSpoutDia, 35)
    const loopLenCm = num(spec.loopLength, 30)
    const loopWCm = num(spec.loopWidth, 5)
    const duffleCm = num(spec.duffleHeight, 0)
    const bodyColor = fabricColor(spec.fabricColour)
    const loopColor = fabricColor(spec.loopColour || spec.fabricColour)
    const laminated = num(spec.bodyLami, 0) > 0
    // ~1 weave tile per 6–8 cm of fabric face
    const weaveU = Math.max(6, Math.round(length / 7))
    const weaveV = Math.max(8, Math.round(height / 7))
    // Filled look: soft belly; baffle stays near-square (drawing accuracy).
    const belly = circular ? 0.07 : baffle ? 0.015 : liftBag ? 0.055 : 0.05
    return {
      sx,
      sy,
      sz,
      scale,
      circular,
      liftBag,
      baffle,
      upanel,
      fourPanel,
      ventilated: /ventilat/i.test(spec.bodyStyle),
      laminated,
      weaveRepeat: [weaveU, weaveV] as [number, number],
      color: bodyColor,
      baffleColor: shade(bodyColor, 28),
      strap: (spec.loopColour || "").trim() ? loopColor : webbingColor(spec.fabricColour),
      spoutTopH: Math.max(0.08, num(spec.topSpoutHeight, 50) * scale),
      spoutTopR: Math.min(Math.min(sx, sz) * 0.48, Math.max(0.05, (topSpoutDia * scale) / 2)),
      spoutBotH: Math.max(0.08, num(spec.bottomSpoutHeight, 40) * scale),
      spoutBotR: Math.min(Math.min(sx, sz) * 0.48, Math.max(0.05, (botSpoutDia * scale) / 2)),
      duffleH: Math.max(0, duffleCm * scale),
      conicalH: Math.max(0.08, num(spec.conicalTop || spec.bottomConicalHeight, 30) * scale),
      loopAbove: Math.max(0.1, loopLenCm * scale),
      sewDown: Math.max(0.08, Math.min(height * 0.55, loopLenCm * 1.15) * scale),
      strapWidth: Math.max(0.02, (loopWCm * scale) / 2),
      loopCount: Math.min(12, Math.max(0, Number.parseInt(spec.loopCount || "4", 10) || 4)),
      doc: spec.docPouch,
      docW: Math.max(0.1, num(spec.docWidth || spec.docLength, 30) * scale * 0.45),
      docH: Math.max(0.08, num(spec.docLength || spec.docWidth, 35) * scale * 0.4),
      printed: isPrinted(spec.printing),
      twoSided: /^2S/i.test(spec.printing || ""),
      twoColor: /2C/i.test(spec.printing || ""),
      belly,
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
    ventilated,
    laminated,
    weaveRepeat,
    color,
    baffleColor,
    strap,
    spoutTopH,
    spoutTopR,
    spoutBotH,
    spoutBotR,
    duffleH,
    conicalH,
    loopAbove,
    sewDown,
    strapWidth,
    loopCount,
    doc,
    docW,
    docH,
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
    (upanel ? 0.12 : 0)
  const faceZ = sz / 2 + 0.02
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
        <Fabric color={color} repeat={weaveRepeat} laminated={laminated} />
      </mesh>
      <group position={[0, sy / 2, 0]}>
        <InkEdges geometry={sack} color={shade(color, -85)} />
      </group>

      <CornerSeamKit sx={sx} sy={sy} sz={sz} color={color} circular={circular} />

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

      {baffle ? <BaffleKit sx={sx} sy={sy} sz={sz} color={color} baffleColor={baffleColor} /> : null}
      {ventilated ? <VentilatedFaces sx={sx} sy={sy} sz={sz} color={color} /> : null}

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
        loopAbove={loopAbove}
        sewDown={sewDown}
        strapWidth={strapWidth}
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

      {/* Safety / Palmetto-style label */}
      <group position={[-sx * 0.2, sy * 0.74, faceZ + 0.01]}>
        <mesh>
          <planeGeometry args={[sx * 0.14, sy * 0.09]} />
          <meshStandardMaterial color="#f0d24a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.002]}>
          <planeGeometry args={[sx * 0.1, sy * 0.012]} />
          <meshStandardMaterial color="#1a1a18" roughness={0.6} />
        </mesh>
        <mesh position={[0, -sy * 0.02, 0.002]}>
          <planeGeometry args={[sx * 0.08, sy * 0.008]} />
          <meshStandardMaterial color="#333" roughness={0.6} />
        </mesh>
      </group>

      {doc ? (
        <group position={[sx * 0.28, sy * 0.68, faceZ + 0.014]}>
          {/* PE open pouch — clear-ish plastic */}
          <mesh castShadow>
            <boxGeometry args={[docW, docH, 0.018]} />
            <meshStandardMaterial color="#dceaf2" transparent opacity={0.55} roughness={0.25} metalness={0.08} />
          </mesh>
          <mesh position={[0, docH * 0.35, 0.01]}>
            <boxGeometry args={[docW * 0.92, 0.008, 0.004]} />
            <meshStandardMaterial color="#9bb0c0" roughness={0.4} />
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
