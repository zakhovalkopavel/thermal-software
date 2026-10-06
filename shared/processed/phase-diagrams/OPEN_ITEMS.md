# Phase-diagram dataset: open items

What still has to be decided, verified or completed before the data is used in code.
Statuses are defined in `sources.json` → `statusLegend`. Point ids refer to `systems/*.json`, compound ids to `compounds.json`.

When an item is resolved: update the value, its `status` and `sources` in the JSON, then tick it here.

## 1. Decisions (sources conflict)

- [ ] `cas-1385` anorthite + gehlenite + hibonite: Slag Atlas Fig. 3.166 gives 1385 °C; NBS 5839 (Gentile & Foster 1963) gives 1405 ± 5 °C at a point ≈1.5 wt% away on the anorthite/hibonite boundary.
- [x] `as-eutectic` silica + mullite: Fig. 3.35 gives 1586 °C at 8.0 wt% Al2O3, confirmed by NBS 5931 (1595 °C, 8.2 wt%); NBS 5909 rejected.
- [x] Mullite variant: incongruent (Fig. 3.35). The atlas text calls it the recommended version and the stable phase relations; Fig. 3.36 congruent = metastable.
- [ ] `kas-edge-silica-ks4` quartz + K2O·4SiO2: Fig. 3.186 gives 769 °C at 26.1 wt% K2O; NBS 4992 gives 762 °C at 28.2 wt% (approximate, equal to the KS4 composition). Atlas value recommended.
- [ ] Edge values of Fig. 3.166 and Fig. 3.186 vs the Al2O3-SiO2 binary: ternary figures give 6.3–6.5 wt% Al2O3 for the silica/mullite eutectic and Fig. 3.186 uses the older mullite/corundum eutectic (~1840 °C). Plan: the binary file is the reference for all edges.
- [ ] `mas-edge-spinel-corundum` / `am-1975`: atlas binary Fig. 3.30 gives 1975 °C at 4 wt% MgO (96 wt% Al2O3); Fig. 3.187 gives 97.6 wt% Al2O3 without temperature; NBS 6077 1925 °C and NBS 6097 2000 °C (both approximate, 75 °C apart). Recommended: Fig. 3.30 (1975 °C). Atlas text: Hallstedt's assessment proposes a liquidus minimum instead of a eutectic.
- [ ] `mas-edge-periclase-spinel`: Fig. 3.187 prints 1850 °C; atlas binary Fig. 3.30 gives 1995 °C at 45 wt% MgO, identical to NBS 6095 (`am-1995`, confirmed). Recommended: 1995 °C (Fig. 3.187 label is the outlier).
- [ ] Melting points changed to the binary Fig. 3.30: periclase 2822 °C (Fig. 3.187 '~2800'), spinel 2105 °C (Fig. 3.187 '~2135'). Confirm that the binary takes precedence over the approximate ternary labels.
- [ ] Forsterite melting changed to the binary Fig. 3.125: 1890 °C (Fig. 3.187 '~1900'); periclase 2822 °C printed again in Fig. 3.125.
- [ ] `mas-edge-periclase-forsterite`: Fig. 3.187 prints ~1860 °C at 36.2 wt% SiO2; binary Fig. 3.125 gives 1850 °C at 38 wt% (`ms-1850`, no NBS entry). Within the temperature tolerance, 1.8 wt% apart. Recommended: the binary.

## 2. Verify extracted readings (Fig. 3.166, CaO-Al2O3-SiO2)

- [ ] `cas-1350` and `cas-1335-c3a`: printed ≈2 px apart; positions approximate. Needs a larger-scale source.
- [ ] `cas-1390`: confirm it is a saddle (5 °C above `cas-1385`).
- [ ] `cas-edge-two-liquid`: endpoint of the two-liquid region is tentative.
- [ ] Eutectic/peritectic classification sensitive to digitizing (liquid almost on a triangle side): `cas-1345`, `cas-1335-c3a`, `cas-1385`, `cas-1500`.
- [ ] Phase assignment of all CAS invariants (my reading of which fields meet at each label).

## 2a. Verify extracted readings (Fig. 3.186, K2O-Al2O3-SiO2)

- [ ] `kas-990` and `kas-1150`: not separable from `kas-985` / `kas-1140` on the main figure (separated only in inset a); compositions set at the boundary × join intersection.
- [ ] Eutectic/peritectic classification sensitive to digitizing: `kas-985` (mullite weight 0.01), `kas-1140` (on the SiO2–KAS6–KAS4 line).
- [ ] Phase assignment: from the sub-solidus inset (compatibility triangles) and the boundary network; please check against the figure.
- [ ] Unidentified labels `800` and `1700` (probably isotherms).

## 2b. Verify extracted readings (Fig. 3.195, Na2O-Al2O3-SiO2)

- [ ] `nas-1063` and `nas-1068`: main figure prints 1063 / 1068, the inset prints 1163 / 1168 (status `conflict`). Main-figure values recommended: the inset itself marks `nas-1108` as a maximum falling towards this junction.
- [ ] `nas-1062`: ≈1 wt% from `nas-1050`; position approximate.
- [ ] `nas-955`: fields not labelled; phases inferred from the sub-solidus triangle NS–N2S–NAS2. Liquid inside the triangle (eutectic geometry) but the arrows show a boundary leaving the point; reaction left `null`. > 40 wt% Na2O, low priority.
- [ ] `nas-edge-n2s-melting` 1120 °C: second phase not labelled.
- [ ] Classification sensitive to digitizing: `nas-1050` (mullite weight 0.02), `nas-1063` (corundum weight 0.02).
- [ ] Phase assignment: from the sub-solidus inset and the boundary network; please check against the figure.
- [ ] Fig. 3.196 (Moir & Glasser 1976, with N3S8) not used, per the atlas text ("results of Bowen, Schairer generally accepted").

## 2c. Verify extracted readings (Fig. 3.187, MgO-Al2O3-SiO2)

- [ ] `mas-1578`: the label leader ends ≈45 px below the junction (where the dashed 1600 isotherm crosses the spinel/corundum boundary); junction taken as the point.
- [ ] `mas-1367`: ≈1 wt% from `mas-1365`; position approximate.
- [ ] Classification sensitive to digitizing: `mas-1440` (mullite weight −0.015, on the SiO2–cordierite join), `mas-1365` (forsterite weight 0.05).
- [ ] Compatibility triangles from Fig. 3.190 (1350 °C, Smart & Glasser): cordierite + corundum instead of spinel + mullite below 1350 °C. Decide which set the model uses after cooling.
- [ ] Line labelled 1470 inside the protoenstatite field (continuation of the cristobalite/tridymite line); meaning not stated.
- [ ] Phase assignment: from field labels, the boundary network and Fig. 3.190; please check against the figure.

## 2d. Verify extracted readings (Fig. 3.249, CaO-MgO-SiO2)

- [ ] Page warp: the compound circles are displaced up to 13 px (≈0.8 wt%) from stoichiometry with the corners alone; all compositions use a quadratic correction fitted to corners + 10 circles (`digitization.warpCorrection`, residual ≤ 0.25 wt%).
- [ ] `cms-merwinite-c2s-periclase`: junction drawn without a temperature label.
- [ ] `cms-akermanite-c2s-merwinite`: drawn at the same junction as `cms-1400` (not resolved); temperature not printed.
- [ ] `cms-1454`: printed at a cross mark on the wollastonite/akermanite boundary, ≈1 wt% from the CS–C2MS2 join crossing; 1454 equals the recalled akermanite melting point, while a saddle must be lower. Confirm the reading.
- [ ] `cms-1490`: label sits between two junctions; assigned to the nearest (monticellite + merwinite + periclase).
- [ ] `cms-1373` (and the pyroxene label 1387): the scan glyphs resemble 1973 / 1987; read as 1373 / 1387 from context.
- [ ] `cms-1376` and `cms-1400`: ≈1.4 wt% apart in the narrow rankinite strip; positions approximate.
- [ ] Dash-dot line parallel to the β-CS/CMS2 boundary (labels 1336, 1368, 1360): meaning not stated; kept in `otherAtlasData`, not used.
- [ ] Pyroxene polymorph points (Pi / Oen / Pen; labels 1387, 1410, 1419, 1445): the 1419 leader is ambiguous and the wedge between lines B and C is unlabelled; all three fields are modelled as enstatite, so these are not model invariants.
- [ ] Classification sensitive to digitizing: `cms-1385` (forsterite weight −0.025).
- [ ] Bredigite (Fig. 3.250 inset, below 1372 °C, on the C2S–C3MS2 line): not in the phase catalog; sub-solidus only.
- [ ] Phase assignment: from field labels, the boundary network and Fig. 3.250; please check against the figure.

## 2e. Verify extracted readings (Fig. 3.30, Al2O3-MgO)

- [ ] Printed labels 2822, 2105, 1995, 1975 °C and 4, 6.5, 39, 45, 82 mass% MgO; the compositions were also checked by digitizing (4.1, 6.6, 38.6, 44.9, 82.7 wt%; within 0.7 wt%). The "6.5" is circled in pen on the scan but is printed.
- [ ] Spinel maximum read as 28.3 wt% MgO (stoichiometric MA) from the parabola fitted to the liquidus; the label "2105" covers the peak.
- [ ] Liquidus points digitized every 1–5 wt% (±5 °C, ±0.3 wt%); the periclase branch above 2800 °C is extrapolated from the y-axis ticks.
- [ ] `am-1975`: the atlas text notes Hallstedt's alternative (liquidus minimum, no A–MA eutectic); modelled as the drawn eutectic.

## 2f. Verify extracted readings (Fig. 3.125, MgO-SiO2)

- [ ] No NSRDS-NBS 61 entry for this binary (system index PDF p. 140): all values are atlas-only (`extracted`).
- [ ] Printed labels 2822, 1890, 1850, 1557, 1543, 1695, 1725, 1470 °C and 38, 61, 64, 70 mass% SiO2. Lines read within 2 °C of the labels.
- [ ] `ms-1850` and `ms-1695`: the junctions are drawn at 39.3 and 68.9 wt% SiO2, ≈1.2 wt% from the printed labels '38' and '70' (61 and 64 agree within 0.6 wt%; the compound lines sit exactly at stoichiometry, so the calibration is fine). Printed labels used; digitized liquidus points within 1.5 wt% of these junctions omitted.
- [ ] `ms-1695` SiO2-rich liquid 98.9 wt% SiO2 and the miscibility-gap critical point (1967 °C, 87.8 wt% SiO2) are not labelled; digitized only.
- [ ] Forsterite maximum digitized at 1887 °C (label 1890); periclase liquidus reaches the MgO axis at 2830 °C (label 2822).
- [ ] Dashed liquidus of Kambayashi, Kato (congruent MgSiO3) not used; enstatite kept incongruent.

## 3. Verify recalled values (replace with a page reference or delete)

### Compound melting points (`compounds.json`)

- [x] periclase 2822 °C congruent (Fig. 3.30; Fig. 3.187 '~2800'; recalled value was 2825)
- [x] mullite: incongruent 1889 °C → corundum (Fig. 3.35)
- [ ] wollastonite 1544 °C congruent
- [ ] rankinite 1464 °C incongruent → dicalcium-silicate
- [ ] dicalcium-silicate 2130 °C congruent
- [ ] tricalcium-silicate 2070 °C incongruent → lime; lower stability limit ≈1250 °C
- [ ] tricalcium-aluminate 1539 °C incongruent → lime
- [ ] mayenite 1392 °C congruent
- [ ] monocalcium-aluminate 1602 °C congruent
- [ ] grossite 1762 °C congruent
- [ ] hibonite 1830 °C incongruent → corundum
- [x] spinel 2105 °C congruent (Fig. 3.30; Fig. 3.187 '~2135')
- [x] forsterite 1890 °C congruent (Fig. 3.125; Fig. 3.187 '~1900')
- [x] enstatite 1557 °C incongruent → forsterite (Fig. 3.187, Fig. 3.125)
- [x] cordierite 1465 °C incongruent → mullite (Fig. 3.187)
- [x] diopside 1391.5 °C congruent (Fig. 3.249; recalled value was 1391)
- [ ] akermanite 1454 °C congruent (congruent confirmed by Fig. 3.249; temperature not printed)
- [ ] monticellite 1503 °C incongruent → periclase (behaviour and product confirmed by Fig. 3.249; temperature not printed)
- [ ] merwinite 1575 °C incongruent → dicalcium-silicate (behaviour and product from Fig. 3.249; temperature not printed)
- [x] k-feldspar 1150 °C incongruent → leucite (Fig. 3.186)
- [x] leucite 1693 °C congruent (Fig. 3.186; recalled value was 1686)
- [x] albite 1118 °C congruent (Fig. 3.195)
- [x] nepheline 1526 °C congruent (Fig. 3.195)
- [x] sodium-disilicate 874 °C congruent (Fig. 3.195)
- [x] sodium-metasilicate 1089 °C congruent (Fig. 3.195)
- [x] sodium-orthosilicate added: 1120 °C incongruent (Fig. 3.195; product not labelled)

### Invariant points

- [x] `as-eutectic` 1586 °C (Fig. 3.35)
- [x] `as-mullite-peritectic` 1889 °C, 76.0 wt% Al2O3 (Fig. 3.35)
- [x] `as-mullite-congruent` 1848 °C (Fig. 3.36, metastable, not used)
- [x] `as-mullite-corundum-eutectic` 1839 °C (Fig. 3.36, metastable, not used)
- [x] `kas-985` 985 °C (Fig. 3.186)
- [x] `nas-albite-silica-mullite` → `nas-1050` (Fig. 3.195)
- [x] `nas-albite-silica-ns2` → `nas-740` (Fig. 3.195)
- [x] MAS invariants (Fig. 3.187), renamed by temperature: `mas-1440`, `mas-1365`, `mas-1370`, `mas-1453`, `mas-1460`, `mas-1482`, `mas-1578`, `mas-1710`; recalled assemblages and temperatures all confirmed by the figure
- [x] `mas-edge-periclase-forsterite` ~1860 °C (Fig. 3.187; recalled value was 1850)
- [x] `mas-edge-forsterite-enstatite` 1557 °C, `mas-edge-enstatite-silica` 1543 °C (Fig. 3.187)
- [x] Phase assemblages of all CMS invariants: read from Fig. 3.249 (see 2d); skeleton ids renamed by temperature: `cms-periclase-forsterite-monticellite` → `cms-1502`, `cms-periclase-monticellite-merwinite` → `cms-1490`, `cms-periclase-merwinite-c2s` → `cms-merwinite-c2s-periclase`, `cms-periclase-c2s-c3s` → `cms-1790`, `cms-periclase-c3s-lime` → `cms-1850`, `cms-diopside-wollastonite-silica` → `cms-1320`

### NBS-only values (no atlas cross-check yet)

- [x] `mas-cordierite-enstatite-silica` → `mas-1355` (Fig. 3.187: 1355 °C, confirmed by NBS 5802: 1345 °C)
- [x] `mas-edge-periclase-spinel`: atlas value found, now a conflict (section 1)
- [ ] `cms-edge-lime-periclase` 2370 °C (NBS 6180): composition confirmed by Fig. 3.249 (67.0 wt% CaO, Δ 0.0); temperature still NBS only
- [x] `nas-edge-silica-ns2` 789 °C (Fig. 3.195, confirmed by NBS 5096, 5116)
- [x] `nas-edge-ns2-ns` 837 °C (Fig. 3.195, confirmed by NBS 5261, 5286)
- [ ] CAS edge temperatures taken from NBS only: `cas-edge-ca-grossite` 1590 °C, `cas-edge-mayenite-c3a` 1361 °C, `cas-edge-silica-wollastonite` 1436 °C, `cas-edge-wollastonite-rankinite` 1460 °C

## 4. Complete missing values

### Compounds

- [x] sapphirine stoichiometry: 4MgO·5Al2O3·2SiO2 (legend of Fig. 3.187)
- [ ] sapphirine melting (incongruent; temperature not printed in Fig. 3.187)
- [ ] kalsilite melting (outside Fig. 3.186)
- [x] potassium-tetrasilicate 770 °C, potassium-disilicate 1045 °C, potassium-metasilicate 976 °C (Fig. 3.186)

### CAS edge temperatures (composition already digitized)

- [ ] `cas-edge-hibonite-corundum`
- [ ] `cas-edge-grossite-hibonite`
- [ ] `cas-edge-ca-mayenite`
- [ ] `cas-edge-lime-c3a`
- [ ] `cas-edge-rankinite-c2s`
- [ ] `cas-edge-c2s-c3s`
- [ ] `cas-edge-lime-c3s`
- [ ] `cas-edge-two-liquid` (monotectic temperature)
- [x] `cas-edge-silica-mullite`, `cas-edge-mullite-corundum`: binary values given in the notes (1586 °C, 1889 °C)

### Liquid compositions (all null)

- [ ] `as-mullite-congruent`, `as-mullite-corundum-eutectic` (Fig. 3.36; metastable variant, low priority)
- [x] All CMS ternary invariants (Fig. 3.249)

### Whole points missing

- [x] KAS (Fig. 3.186): 8 ternary invariants, 8 saddle/melting points, 5 edge points extracted
- [x] NAS (Fig. 3.195): 7 ternary invariants, 5 saddles, 6 edge/melting points extracted; `nas-albite-mullite-corundum` → `nas-1104`, `nas-albite-nepheline-corundum` → `nas-1063`, `nas-albite-nepheline-ns2` → `nas-732`
- [x] CMS (Fig. 3.249): 15 ternary invariants (2 without printed temperature), 3 saddles, lime/periclase edge composition; 15 compatibility triangles from Fig. 3.250
- [x] MAS (Fig. 3.187): 9 ternary invariants, 2 saddles, cordierite melting, 7 edge points extracted
- [x] Figure number for the CMS atlas page: Fig. 3.249 (sub-solidus Fig. 3.250); KAS = Fig. 3.186, NAS = Fig. 3.195, MAS = Fig. 3.187
- [x] Atlas binary MgO-Al2O3: Fig. 3.30 (printed p. 44, PDF p. 64) → `systems/al2o3-mgo.json`
- [x] Atlas binary MgO-SiO2: Fig. 3.125 (printed p. 88, PDF p. 108) → `systems/mgo-sio2.json`
- [ ] Atlas binaries not yet read: CaO-MgO (Fig. 3.66, PDF p. 81), CaO-SiO2 (Fig. 3.70, PDF p. 83), K2O-SiO2 (Fig. 3.117, PDF p. 105), Na2O-SiO2 (Fig. 3.137, PDF p. 114), CaO-Al2O3 (Al2O3-CaO, before Fig. 3.35, page to look up). K2O-SiO2 eutectics currently from the edge of Fig. 3.186.

## 5. Digitize curves

- [ ] CAS: 29 boundary curves (`boundaryCurves[].polyline_wt`)
- [ ] CAS: 15 labelled isotherms (silica 1400/1600; anorthite 1300/1400/1500; gehlenite 1400/1500; corundum 1600–1900; lime 1800–2400)
- [ ] CAS: identify the unlabelled dash-dot curve in the silica field (probably cristobalite/tridymite)
- [x] Al2O3-SiO2: liquidus curves (`liquidus[].points`) from Fig. 3.35
- [x] Al2O3-MgO: liquidus curves (`liquidus[].points`) from Fig. 3.30
- [x] MgO-SiO2: liquidus curves and miscibility gap from Fig. 3.125
- [ ] KAS: 16 boundary curves and 8 labelled isotherms (silica 1000–1600, leucite 1000–1600)
- [ ] NAS: 14 boundary curves and 9 labelled isotherms (silica 1000–1600, NS2 800, nepheline/carnegieite 1000–1600)
- [ ] MAS: 17 boundary curves and 16 labelled isotherms
- [ ] CMS: 26 boundary curves and 12 labelled isotherms (silica 1400/1600, forsterite 1600/1800, C2S 1800, lime 2000–2400, periclase 2000–2600)

## 6. Unmatched NBS entries (kept for reference, not used)

- [ ] 5907 CA-C2AS join 1545 °C: inside the gehlenite field of Fig. 3.166
- [ ] 6120 CaO-SiO2 2065 °C: older diagram without a C3S field
- [ ] 5927 Al2O3-SiO2 1590 °C at 94 wt% Al2O3: impossible as printed
- [x] 4866, 5062 K2O-SiO2: matched to `kas-edge-ks4-ks2` and `kas-edge-ks2-ks` (confirmed); 4992 attached to `kas-edge-silica-ks4` (conflict, see section 1)
- [x] 5596 Na2O-SiO2 1022 °C: matched to `nas-edge-ns-n2s` (confirmed)
- [ ] 5842 Al2O3-Na2O 1410 °C: no catalog phase on that edge; the atlas draws that side dashed without values

## 7. Other step-2 data not started

- [ ] Fluoride subsystems (Slag Atlas §3.2.6, printed pp. 186–200) and NBS fluoride entries: CaF2-NaF 818 °C (5198–5200), CaF2-KF 780/782 °C (5057, 5058, 5069), CaF2-LiF 766 °C (5007), AlF3-CaF2 828 °C (5236), CaO-NaF 650 °C (4182), CaF2-CaO-SiO2 1104/1106 °C (5664, 5671), Al2O3-CaF2-CaO 1230 °C (5735), MgF2-MgO-SiO2 1192/1215 °C (5716, 5726). PDF pages still to look up.
- [ ] Fluegel fluoride convention
- [ ] Mineralogy of the 67 materials
- [ ] Refractoriness reference data: cone values (`cone-reference.data.ts`, `cone-temperature.data.ts`), ASTM C24/C27, source of the formula `t_refr = (360 + Al2O3 − ΣR) / 0.228`
