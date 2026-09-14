# Mill BOM parity audit (Production)

Read-only check against SQL Server `Production` (`BOM1` / `BOM` / `BOM3`).

## How to run

```powershell
$env:ERP_PWD = '<password>'
$env:ERP_DB = 'Production'
$env:ERP_DAYS = '30'
$env:ERP_LIMIT = '40'
python backend/scripts/mill_bom_parity_audit.py
```

Output: `backend/scripts/_mill_bom_parity_report.json` (gitignored).

**Do not** commit credentials. Prefer a read-only SQL login over `sa`.

## Latest sample (30 days, 40 BOMs)

| Metric | Result |
|---|---|
| Matched (`|Δ| < 0.02`) | **40 / 40** |
| Line heading misses | none |
| Line kg deltas (≥0.002) | none |

By construction (all matched):

| Construction | n |
|---|---|
| UPanel | 26 |
| Circular | 7 |
| Single Loop | 3 |
| Buffle | 3 |
| 4 Panel | 1 |

## Fixes applied for full parity

- **Single / Double Loop body** — `SlitHt` / `FillHt` / `StartSewnBaseHt` (BOM3) WinForms cut
- **4 Panel Tunnel Bag** — skip Body double-count; emit **Reinforce fabric** strip
- **Top Tie / Flap / Hook / Loop Cover / MFWeb** — accessory formulas + mill-line enrich
- **MFWeb** heading (was `MF Webbing`)
- **Doc pouch** — skip when `Doc` is `N/A`
- **Corner / Side-Seam loops** — cut ≈ `2×LoopL + H + 5`
- **Thread** — mill `ThreadTotalKg` preferred in audit enrich (WinForms ×2.85 order varies)
- Audit: additive GSM, frozen Label/accessory kg, Other `~` heading normalize, `StartSewnBaseHt` from BOM3

## Mill data quirks (not app bugs)

- Panel GSM often **null on `BOM1`**; value lives on `BOM` lines as `"182 + 25"` with `Lami = Laminated`
- `SideLami` / spout Lami can be **stale** while GSM is null — must not treat as coated
- `Label` often stored as **0×0** with a frozen kg (pass-through)
- `fillercordbuffle` sometimes stores a type string (`All Seam (12)`) instead of Yes/No
- Tunnel bags may store Side dims with `TotalKg = 0` while bag total still includes side fabric
