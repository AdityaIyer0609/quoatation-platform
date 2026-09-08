# Customer BOM field mapping

Source of truth for **labels, pick-lists, visibility, and operator defaults**: `frmBOM_NEW.cs` + `frmBOM_NEW.Designer.cs`.  
Source of truth for **weight math**: Web ERP `BomCreationService` (same formulas the form later persisted).

Customer UI uses the form’s strings (`UPanel`, `Open`, `Top Spout`, `Non-Builder`, `Std`, `Simple`, `UnPrinted`), not marketing paraphrases.

WinForms defaults applied in the configurator:
- Circular loops → `Cross Corner`, width 7 cm, GSM from `LoopGRMTable`
- UPanel / 4 Panel loops → `Corner`, width 5 cm (4 cm if Builder/Tunnel)
- Circular bottom GSM = body GSM + 10 when copying fabric
- Top spout → Simple, Ø 35, height 50, GSM 70, lami 25
- Duffle height = ((L+W)/2) − 10
- Liner micron default 70; colour default Milky White

Customer configurator fields map to the Web ERP calculation engine (`BomCreationService`) **internally**. Customers never see ERP table or dictionary names.

Source of truth: Web ERP `BomCreationService.PreviewAsync` → `PopulateCalculatedComponentValues` → `BuildDerivedLines` → `CalculateTotalKg`.

| Customer field | Internal (engine) | Type | Used in | ERP method |
|---|---|---|---|---|
| Construction | `BagType` part 1 / `Construction` | string | Body, side, top, bottom, loop, thread | `ResolveBagTypeParts` |
| Body style | `BagType` part 2 / `BodyStyle` | string | Body/side variants (tunnel, ventilated, UN) | `ResolveBagTypeParts` |
| Body grade | `BagType` part 3 / `BodyGrade` | string | FDA / UN fold allowances | `ResolveBagTypeParts` |
| Size type Inner/Outer | `SizeType` | INNER or OUTER | All fold extras. **Not OUTER ⇒ inner** | `IsInnerPlacement` |
| Length / Width / Height | `SizeL` `SizeW` `SizeH` | cm, decimal | All fabric cuts | Header |
| SWL | `SWL` | kg | Loop cut extra, thread | `ResolveCrossCornerExtra` |
| Safety factor | `S` | e.g. `5:1` | Loop SF bucket 5/6/8 | `ResolveSfBucket` |
| Quantity | `Qty` | count | **Metres** only. **Not** body `TotalKg` | Header |
| Fabric colour | `FabColor` / `BodyColor` | string | Line colour | Derived lines |
| Body GSM | `BodyGSM` | g/m² | Body weight | `PopulateCalculatedBodyValues` |
| Body lamination | `BodyLami` | g/m² | Added to GSM | same |
| Same fabric for panels | copies into `TopGSM`, `BottomGSM`, `SideGSM`, spout GSM | UX default | Not an ERP flag | Mapper |
| Top type | `toptypes` | Open, Top Spout, Duffle or Skrit, … | Top + spout gate | `PopulateCalculatedTopValues` |
| Bottom type | `bottomtypes` | Flat, Bottom Spout/…, Conical Base | Bottom + spout gate | `PopulateCalculatedBottomValues` |
| Duffle height | `DuffleHt` | cm | Skirt / duffle top | Top + liner + thread |
| Filling spout type | `FSType` | Standard / Iris / Tube / Petal | Top spout geometry | `PopulateCalculatedTopSpoutValues` |
| Filling spout Ø / height | `FSL` / `FSW` | cm | Spout fabric/cut. π = **3.14** | same |
| Discharge spout | `DSL` `DSW` + `bottomtypes` | cm | Bottom spout | `PopulateCalculatedBottomSpoutValues` |
| Loop GSM / L / W | `LoopGSM` `LoopL` `LoopW` | grm, cm | Loop kg = cut×grm×count / 100000 | `PopulateCalculatedLoopValues` |
| Loop count | `loopRemarks` | number | **ERP uses remarks as loop count** | same |
| Loop construction | `loopconst` | Cross Corner, … | Cross-corner extra table | same |
| Till-bottom loops | `TillTheBottom` | yes/no | U-panel / 4-panel cut | same |
| Liner material | `Liner` | LD/LLD 0.92, HD 0.94, ALU 1.1 | Density | `ResolveLinerDensity` |
| Liner type | `LinerType` | Gusseted, Form Fit, … | Cut formula | `PopulateCalculatedLinerValues` |
| Liner micron | `LinerDim` | micron | Liner kg | same |
| Document pouch L×W | `docl` `docw` | cm | Density 0.92 | `PopulateCalculatedDocValues` |
| Label L×W | `LabelL` `LabelW` | **inches** in ERP | × 2.54² | `PopulateCalculatedLabelValues` |
| Double fold flags | `DoubleFoldBody/Top/Bottom` | yes/no | Extra cm on folds | Body/side/top/bottom/spouts |
| Printing / notes | `PrintType` / `Instruction` | string | Stored, not in kg | Header |

## Weight formulas (ERP)

- Fabric components: `(cut × fabric × factor × (GSM + lami)) / 10_000_000`, 4 d.p., away-from-zero.
- Loops / ties: `(cut × grm × count) / 100_000`.
- Thread: `threadLengthCm / 100_000`.
- `TotalKg` on a **body line does not multiply by quantity**. Metres do (`cut/100 × qty × factor`).
- Quotation **kg per bag** = sum of line `TotalKg` (ERP `CalculateTotalKg`).
- Quotation **total material kg** = kg per bag × quantity (**new**; ERP TotalKg is per bag).

## Customer labels vs ERP strings

| UI | Engine construction |
|---|---|
| Circular | `Circular` |
| U-Panel | `UPanel` |
| 4-Panel | `4 Panel` |
| Baffle | `Buffle` (ERP spelling). **No body-fabric branch** in `PopulateCalculatedBodyValues`. |
| Open Top | `Open` |
| Filling Spout | `Top Spout` |
| Duffle Top | `Duffle or Skrit` (ERP spelling) |
| Flat Bottom | `Flat` |
| Discharge Spout | `Bottom Spout` |

## Assumptions / ambiguities (not guessed as new math)

1. **BagType** is `Construction/BodyStyle/BodyGrade`. Pick-list values must match ERP strings for variant branches.
2. **`loopRemarks` is loop count**, not free text.
3. Full loop-cut table is only the branches in `PopulateCalculatedLoopValues`. Other loop styles yield no loop kg unless `LoopLength` override is set (not exposed in MVP).
4. Cross-corner extra is **0 above 2000 kg SWL** → loop calc exits.
5. Circular bags have **no side panel** formula.
6. π is **3.14** and half-π **1.57** as in ERP, not `Math.PI`.
7. Optional ropes/hooks/baffle fabric lines exist in ERP `BuildDerivedLines` but are not collected in the customer MVP unless values are present.

## Never sent to or shown to customers

FilePoNo, SrNo, pono, Bom1/Bom3 dictionary names, approvals, UserName, party mapping, ERP create/update APIs.
