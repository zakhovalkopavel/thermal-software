"""Canonical handbook correlation formulas for Yaws 1999 tables.

Chapter intros define the authoritative equations; table-page OCR often
mangles or misses them. ``apply_canonical_equations`` overwrites / fills
``equations`` (and optional metadata) from this map during parse/rebuild.

Public table JSON exposes a single ``equations`` list (no singular
``equation``, ``definition``, ``estimationEquation``, or
``derivedDefinitions``). ``equationPage`` is the **published** (printed)
chapter-intro page number (not DjVu). ``coefficients`` lists physical
symbols only (``{text, latex, meaning}``). Polynomial fit letters A–E /
a / m / n are omitted. Coefficient ``text`` matches column key style
(Tc, Zc, Sf_at_298_K).
"""
from __future__ import annotations

from typing import Any


def _c(text: str, meaning: str, latex: str | None = None) -> dict[str, str]:
    """One coefficient / symbol entry."""
    return {
        "text": text,
        "latex": text if latex is None else latex,
        "meaning": meaning,
    }


def _coeffs(*entries: dict[str, str]) -> list[dict[str, str]]:
    return list(entries)


# Per-table curated equations. When an entry includes a trailing unit
# footnote ``(prop - unit, T - K)``, put that form first so
# ``attach_column_units`` can parse units from ``equations[0]``.
TABLE_EQUATIONS: dict[str, dict[str, Any]] = {
    '16-1': {
        "equations": [
            r'\log_{10} S = A + B X + C X^2 (S - ppm(wt), X - ppm(wt))',
        ],
        "equationPage": 371,
        "coefficients": _coeffs(
            _c('S', 'solubility in salt water at 25 C, ppm (wt)'),
            _c('X', 'concentration of salt (NaCl) in water, ppm (wt)'),
        ),
    },
    '19-1': {
        "equations": [
            r'\log_{10} Q = A + B[\log_{10} y] + C[\log_{10} y]^2 (Q - g/100g carbon, y - ppmv)',
            r'\log_{10} Q = A + B\mu + C\mu^2 + D\mu^3 + E\mu^4 + F\mu^5 \quad (19-2)',
        ],
        "equationPage": 407,
        "coefficients": _coeffs(
            _c('Q', 'adsorption capacity at equilibrium, g of compound/100 g of carbon'),
            _c('y', 'concentration in gas at 25 C and 1 atm, ppmv'),
            _c('mu', 'adsorption potential of compound (chapter 19-2)', '\\mu'),
        ),
    },
    '5-1': {
        "equations": [
            r'\Delta H_{\mathrm{vap}} = A (1 - T/T_c)^n (HVAP - kjoule/mol, T - K)',
        ],
        "equationPage": 103,
        "coefficients": _coeffs(
            _c('HVAP', 'enthalpy of vaporization, kjoule/mol', '\\Delta H_{\\mathrm{vap}}'),
            _c('Tc', 'critical temperature, K', 'T_c'),
            _c('T', 'temperature, K'),
            _c('Tb', 'boiling temperature, K', 'T_b'),
            _c('HVAP_at_Tb', 'enthalpy of vaporization at Tb', '\\Delta H_{\\mathrm{vap}}'),
        ),
    },
    '5-2': {
        "equations": [
            r'\Delta H_{\mathrm{vap}} = A (1 - T/T_c)^n (HVAP - kjoule/mol, T - K)',
        ],
        "equationPage": 103,
        "coefficients": _coeffs(
            _c('HVAP', 'enthalpy of vaporization, kjoule/mol', '\\Delta H_{\\mathrm{vap}}'),
            _c('Tc', 'critical temperature, K', 'T_c'),
            _c('T', 'temperature, K'),
            _c('Tb', 'boiling temperature, K', 'T_b'),
            _c('HVAP_at_Tb', 'enthalpy of vaporization at Tb', '\\Delta H_{\\mathrm{vap}}'),
        ),
    },
    '8-1': {
        "equations": [
            r'\mathrm{density} = A B^{-(1 - T/T_c)^n} (density - g/ml, T - K)',
        ],
        "equationPage": 179,
        "coefficients": _coeffs(
            _c('density', 'saturated liquid density, g/ml', '\\mathrm{density}'),
            _c('T', 'temperature, K'),
            _c('Tc', 'critical temperature, K', 'T_c'),
        ),
    },
    '8-2': {
        "equations": [
            r'\mathrm{density} = A B^{-(1 - T/T_c)^n} (density - g/ml, T - K)',
        ],
        "equationPage": 179,
        "coefficients": _coeffs(
            _c('density', 'saturated liquid density, g/ml', '\\mathrm{density}'),
            _c('T', 'temperature, K'),
            _c('Tc', 'critical temperature, K', 'T_c'),
        ),
    },
    '9-1': {
        "equations": [
            r'\sigma = A (1 - T/T_c)^n (sigma - dynes/cm, T - K)',
        ],
        "equationPage": 206,
        "coefficients": _coeffs(
            _c('sigma', 'surface tension, dynes/cm', '\\sigma'),
            _c('Tc', 'critical temperature, K', 'T_c'),
            _c('T', 'temperature, K'),
        ),
    },
    '9-2': {
        "equations": [
            r'\sigma = A (1 - T/T_c)^n (sigma - dynes/cm, T - K)',
        ],
        "equationPage": 206,
        "coefficients": _coeffs(
            _c('sigma', 'surface tension, dynes/cm', '\\sigma'),
            _c('Tc', 'critical temperature, K', 'T_c'),
            _c('T', 'temperature, K'),
        ),
    },
    '12-1': {
        "equations": [
            r'\Delta H_f = A + B T + C T^2 (Hf - kjoule/mol, T - K)',
        ],
        "equationPage": 282,
        "coefficients": _coeffs(
            _c('Hf', 'enthalpy of formation of ideal gas, kjoule/mol', '\\Delta H_f'),
            _c('T', 'temperature, K'),
            _c('Hf_at_298_K', 'enthalpy of formation at 298 K', '\\Delta H_f'),
            _c('Hf_at_500_K', 'enthalpy of formation at 500 K', '\\Delta H_f'),
        ),
    },
    '13-1': {
        "equations": [
            r'\Delta G_f = A + B T + C T^2 (Gf - kjoule/mol, T - K)',
        ],
        "equationPage": 308,
        "coefficients": _coeffs(
            _c('Gf', 'Gibbs energy of formation of ideal gas, kjoule/mol', '\\Delta G_f'),
            _c('T', 'temperature, K'),
            _c('Gf_at_298_K', 'Gibbs energy of formation at 298 K', '\\Delta G_f'),
            _c('Gf_at_500_K', 'Gibbs energy of formation at 500 K', '\\Delta G_f'),
        ),
    },
    '22-1': {
        "equations": [
            r'\log_{10} n_{\mathrm{liq}} = A + B/T + C T + D T^2 (n_liq - centipoise, T - K)',
        ],
        "equationPage": 460,
        "coefficients": _coeffs(
            _c('n_liq', 'viscosity of liquid, centipoise', 'n_{\\mathrm{liq}}'),
            _c('T', 'temperature, K'),
        ),
    },
    '22-2': {
        "equations": [
            r'\log_{10} n_{\mathrm{liq}} = A + B/T + C T + D T^2 (n_liq - centipoise, T - K)',
        ],
        "equationPage": 460,
        "coefficients": _coeffs(
            _c('n_liq', 'viscosity of liquid, centipoise', 'n_{\\mathrm{liq}}'),
            _c('T', 'temperature, K'),
        ),
    },
    '24-1': {
        "equations": [
            r'\log_{10} k_{\mathrm{liq}} = A + B [1 - T/C]^{2/7} (k_liq - W/m-K, T - K)',
        ],
        "equationPage": 513,
        "coefficients": _coeffs(
            _c('k_liq', 'thermal conductivity of liquid, W/(m K)', 'k_{\\mathrm{liq}}'),
            _c('T', 'temperature, K'),
        ),
    },
    '24-2': {
        "equations": [
            'k = A + B T + C T^2 (k - W/m-K, T - K)',
        ],
        "equationPage": 513,
        "coefficients": _coeffs(
            _c('k', 'thermal conductivity of liquid or solid, W/(m K)'),
            _c('T', 'temperature, K'),
            _c('Phase', 'phase (solid or liquid)'),
        ),
    },
    '28-1': {
        "equations": [
            r'B_{\mathrm{liq}} = a (1 - T/T_C)^m (B_liq - 1/C, T - K, density_liq - g/cm3)',
            r'B_{\mathrm{liq}} = (1/v)(\partial v/\partial T)_P \approx (1/v)(\partial v/\partial T)_{saturation} \quad (28-2)',
            r'Q_v = B_{\mathrm{liq}} / (\rho_{\mathrm{liq}} C_P) UA (T_{ext} - T) \quad (28-3)',
        ],
        "equationPage": 598,
        "coefficients": _coeffs(
            _c('B_liq', 'thermal expansion coefficient of liquid, 1/C', 'B_{\\mathrm{liq}}'),
            _c('T', 'temperature of liquid, K'),
            _c('Tc', 'critical temperature, K', 'T_c'),
            _c('v', 'specific volume of liquid'),
            _c('Qv', 'volumetric expansion rate', 'Q_v'),
            _c('rho_liq', 'density of liquid', '\\rho_{\\mathrm{liq}}'),
            _c('Cp', 'heat capacity of liquid', 'C_P'),
            _c('U', 'overall heat transfer coefficient'),
            _c('A', 'area for heat transfer'),
            _c('Text', 'external temperature', 'T_{\\mathrm{ext}}'),
        ),
    },
    '28-2': {
        "equations": [
            r'B_{\mathrm{liq}} = a (1 - T/T_C)^m (B_liq - 1/C, T - K, density_liq - g/cm3)',
            r'B_{\mathrm{liq}} = (1/v)(\partial v/\partial T)_P \approx (1/v)(\partial v/\partial T)_{saturation} \quad (28-2)',
        ],
        "equationPage": 598,
        "coefficients": _coeffs(
            _c('B_liq', 'thermal expansion coefficient of liquid, 1/C', 'B_{\\mathrm{liq}}'),
            _c('T', 'temperature of liquid, K'),
            _c('Tc', 'critical temperature, K', 'T_c'),
            _c('v', 'specific volume of liquid'),
        ),
    },
    '2-1': {
        "equations": [
            'C_p = A + B T + C T^2 + D T^3 + E T^4 (C_p - joule/mol-K, T - K)',
            r'\Delta H = \int C_p dT',
        ],
        "equationPage": 24,
        "coefficients": _coeffs(
            _c('Cp', 'heat capacity of ideal gas, joule/(mol K)', 'C_p'),
            _c('T', 'temperature, K'),
        ),
    },
    '2-2': {
        "equations": [
            'C_p = A + B T + C T^2 + D T^3 + E T^4 (C_p - joule/mol-K, T - K)',
            r'\Delta H = \int C_p dT',
        ],
        "equationPage": 24,
        "coefficients": _coeffs(
            _c('Cp', 'heat capacity of ideal gas, joule/(mol K)', 'C_p'),
            _c('T', 'temperature, K'),
        ),
    },
    '3-1': {
        "equations": [
            'C_p = A + B T + C T^2 + D T^3 (C_p - joule/mol-K, T - K)',
            r'\Delta H = \int C_p dT',
        ],
        "equationPage": 50,
        "coefficients": _coeffs(
            _c('Cp', 'heat capacity of liquid, joule/(mol K)', 'C_p'),
            _c('T', 'temperature, K'),
        ),
    },
    '3-2': {
        "equations": [
            'C_p = A + B T + C T^2 + D T^3 (C_p - joule/mol-K, T - K)',
            r'\Delta H = \int C_p dT',
        ],
        "equationPage": 50,
        "coefficients": _coeffs(
            _c('Cp', 'heat capacity of liquid, joule/(mol K)', 'C_p'),
            _c('T', 'temperature, K'),
        ),
    },
    '4-1': {
        "equations": [
            'C_p = A + B T + C T^2 (C_p - joule/mol-K, T - K)',
            r'\Delta H = \int C_p dT',
        ],
        "equationPage": 77,
        "coefficients": _coeffs(
            _c('Cp', 'heat capacity of solid, joule/(mol K)', 'C_p'),
            _c('T', 'temperature, K'),
            _c('Cp_at_25_C', 'heat capacity of solid at 25 C', 'C_p'),
            _c('Cp_at_Tmin', 'heat capacity of solid at Tmin', 'C_p'),
            _c('Cp_at_Tmax', 'heat capacity of solid at Tmax', 'C_p'),
        ),
    },
    '4-2': {
        "equations": [
            'C_p = A + B T + C T^2 (C_p - joule/mol-K, T - K)',
            r'\Delta H = \int C_p dT',
        ],
        "equationPage": 77,
        "coefficients": _coeffs(
            _c('Cp', 'heat capacity of solid, joule/(mol K)', 'C_p'),
            _c('T', 'temperature, K'),
            _c('Cp_at_25_C', 'heat capacity of solid at 25 C', 'C_p'),
            _c('Cp_at_Tmin', 'heat capacity of solid at Tmin', 'C_p'),
            _c('Cp_at_Tmax', 'heat capacity of solid at Tmax', 'C_p'),
        ),
    },
    '7-1': {
        "equations": [
            r'\log_{10} P = A + B/T + C \log_{10} T + D T + E T^2 (P - mm Hg, T - K)',
        ],
        "equationPage": 153,
        "coefficients": _coeffs(
            _c('P', 'vapor pressure, mm Hg'),
            _c('T', 'temperature, K'),
        ),
    },
    '7-2': {
        "equations": [
            r'\log_{10} P = A + B/T + C \log_{10} T + D T + E T^2 (P - mm Hg, T - K)',
        ],
        "equationPage": 153,
        "coefficients": _coeffs(
            _c('P', 'vapor pressure, mm Hg'),
            _c('T', 'temperature, K'),
        ),
    },
    '17-1': {
        "equations": [
            r'\log_{10} S = A + B/T + C/T^2 (S - ppm(wt), T - K)',
        ],
        "equationPage": 378,
        "coefficients": _coeffs(
            _c('S', 'solubility in water, ppm (wt)'),
            _c('T', 'temperature, K'),
        ),
    },
    '21-1': {
        "equations": [
            r'n_{\mathrm{gas}} = A + B T + C T^2 (n_gas - micropoise, T - K)',
        ],
        "equationPage": 434,
        "coefficients": _coeffs(
            _c('n_gas', 'viscosity of gas, micropoise', 'n_{\\mathrm{gas}}'),
            _c('T', 'temperature, K'),
        ),
    },
    '21-2': {
        "equations": [
            r'n_{\mathrm{gas}} = A + B T + C T^2 (n_gas - micropoise, T - K)',
        ],
        "equationPage": 434,
        "coefficients": _coeffs(
            _c('n_gas', 'viscosity of gas, micropoise', 'n_{\\mathrm{gas}}'),
            _c('T', 'temperature, K'),
        ),
    },
    '23-1': {
        "equations": [
            r'k_{\mathrm{gas}} = A + B T + C T^2 (k_gas - W/m-K, T - K)',
        ],
        "equationPage": 487,
        "coefficients": _coeffs(
            _c('k_gas', 'thermal conductivity of gas, W/(m K)', 'k_{\\mathrm{gas}}'),
            _c('T', 'temperature, K'),
        ),
    },
    '23-2': {
        "equations": [
            r'k_{\mathrm{gas}} = A + B T + C T^2 (k_gas - W/m-K, T - K)',
        ],
        "equationPage": 487,
        "coefficients": _coeffs(
            _c('k_gas', 'thermal conductivity of gas, W/(m K)', 'k_{\\mathrm{gas}}'),
            _c('T', 'temperature, K'),
        ),
    },
    '1-1': {
        "equations": [
            r'\rho_c = MW / V_c \quad (1-1)',
            r'Z_c = P_c V_c / (R T_c) \quad (1-2)',
            r'\omega = -\frac{3}{7}\frac{T_b/T_c}{1 - T_b/T_c}(\log_{10} P_c) - 1 \quad (1-3)',
        ],
        "equationPage": 1,
        "coefficients": _coeffs(
            _c('MW', 'molecular weight'),
            _c('Tf', 'melting / freezing temperature', 'T_f'),
            _c('Tb', 'boiling temperature', 'T_b'),
            _c('Tc', 'critical temperature', 'T_c'),
            _c('Pc', 'critical pressure', 'P_c'),
            _c('Vc', 'critical volume', 'V_c'),
            _c('rhoc', 'critical density', '\\rho_c'),
            _c('Zc', 'critical compressibility factor', 'Z_c'),
            _c('omega', 'acentric factor', '\\omega'),
            _c('R', 'gas constant'),
        ),
    },
    '1-2': {
        "equations": [
            r'\rho_c = MW / V_c \quad (1-1)',
            r'Z_c = P_c V_c / (R T_c) \quad (1-2)',
            r'\omega = -\frac{3}{7}\frac{T_b/T_c}{1 - T_b/T_c}(\log_{10} P_c) - 1 \quad (1-3)',
        ],
        "equationPage": 1,
        "coefficients": _coeffs(
            _c('MW', 'molecular weight'),
            _c('Tf', 'melting / freezing temperature', 'T_f'),
            _c('Tb', 'boiling temperature', 'T_b'),
            _c('Tc', 'critical temperature', 'T_c'),
            _c('Pc', 'critical pressure', 'P_c'),
            _c('Vc', 'critical volume', 'V_c'),
            _c('rhoc', 'critical density', '\\rho_c'),
            _c('Zc', 'critical compressibility factor', 'Z_c'),
            _c('omega', 'acentric factor', '\\omega'),
            _c('R', 'gas constant'),
        ),
    },
    '6-1': {
        "equations": None,
        "equationPage": 129,
        "coefficients": _coeffs(
            _c('MW', 'molecular weight'),
            _c('Tf', 'melting / fusion temperature', 'T_f'),
            _c('Hfus_kjoule_mol', 'enthalpy of fusion, kjoule/mol', '\\Delta H_{\\mathrm{fus}}'),
            _c('Hfus_kjoule_kg', 'enthalpy of fusion, kjoule/kg', '\\Delta H_{\\mathrm{fus}}'),
            _c('Hfus_BTU_lb', 'enthalpy of fusion, BTU/lb', '\\Delta H_{\\mathrm{fus}}'),
        ),
    },
    '6-2': {
        "equations": None,
        "equationPage": 129,
        "coefficients": _coeffs(
            _c('MW', 'molecular weight'),
            _c('Tf', 'melting / fusion temperature', 'T_f'),
            _c('Hfus_kjoule_mol', 'enthalpy of fusion, kjoule/mol', '\\Delta H_{\\mathrm{fus}}'),
            _c('Hfus_kjoule_kg', 'enthalpy of fusion, kjoule/kg', '\\Delta H_{\\mathrm{fus}}'),
            _c('Hfus_BTU_lb', 'enthalpy of fusion, BTU/lb', '\\Delta H_{\\mathrm{fus}}'),
        ),
    },
    '10-1': {
        "equations": [
            r'n = c_{\mathrm{vacuum}} / c_{\mathrm{compound}} \quad (\mathrm{refractive\ index})',
        ],
        "equationPage": 233,
        "coefficients": _coeffs(
            _c('T', 'temperature, C'),
            _c('refractive_index', 'refractive index at T', 'n'),
            _c('State', 'physical state'),
            _c('dipole_moment', 'dipole moment, Debye'),
            _c('radius_of_gyration', 'radius of gyration, Angstrom'),
        ),
    },
    '10-2': {
        "equations": [
            r'n = c_{\mathrm{vacuum}} / c_{\mathrm{compound}} \quad (\mathrm{refractive\ index})',
        ],
        "equationPage": 233,
        "coefficients": _coeffs(
            _c('T', 'temperature, C'),
            _c('refractive_index', 'refractive index at T', 'n'),
            _c('State', 'physical state'),
            _c('dipole_moment', 'dipole moment, Debye'),
            _c('radius_of_gyration', 'radius of gyration, Angstrom'),
        ),
    },
    '11-1': {
        "equations": None,
        "equationPage": 258,
        "coefficients": _coeffs(
            _c('MW', 'molecular weight'),
            _c('S_at_298_K', 'absolute entropy at 298 K, joule/(mol K)', 'S'),
            _c('Sf_at_298_K', 'entropy of formation at 298 K, joule/(mol K)', 'S_f'),
        ),
    },
    '11-2': {
        "equations": None,
        "equationPage": 258,
        "coefficients": _coeffs(
            _c('MW', 'molecular weight'),
            _c('S_at_298_K', 'absolute entropy at 298 K, joule/(mol K)', 'S'),
            _c('Sf_at_298_K', 'entropy of formation at 298 K, joule/(mol K)', 'S_f'),
        ),
    },
    '12-2': {
        "equations": [
            r'\Delta H_{\mathrm{reaction}} = \sum (n\Delta H_f)_{\mathrm{products}} - \sum (n\Delta H_f)_{\mathrm{reactants}} \quad (12-1)',
            r'\Delta U_{\mathrm{reaction}} = \sum (n\Delta U_f)_{\mathrm{products}} - \sum (n\Delta U_f)_{\mathrm{reactants}} \quad (12-5)',
        ],
        "equationPage": 282,
        "coefficients": _coeffs(
            _c('MW', 'molecular weight'),
            _c('State', 'physical state'),
            _c('Hf_at_298_K', 'enthalpy of formation at 298 K, kjoule/mol', '\\Delta H_f'),
            _c('Uf_at_298_K', 'internal energy of formation at 298 K, kjoule/mol', '\\Delta U_f'),
            _c('S_at_298_K', 'absolute entropy at 298 K, joule/(mol K)', 'S'),
        ),
    },
    '13-2': {
        "equations": [
            r'\Delta G_{\mathrm{reaction}} = \sum (n\Delta G_f)_{\mathrm{products}} - \sum (n\Delta G_f)_{\mathrm{reactants}} \quad (13-1)',
            r'\Delta A_{\mathrm{reaction}} = \sum (n\Delta A_f)_{\mathrm{products}} - \sum (n\Delta A_f)_{\mathrm{reactants}} \quad (13-4)',
        ],
        "equationPage": 308,
        "coefficients": _coeffs(
            _c('MW', 'molecular weight'),
            _c('State', 'physical state'),
            _c('Gf_at_298_K', 'Gibbs energy of formation at 298 K, kjoule/mol', '\\Delta G_f'),
            _c('Af_at_298_K', 'Helmholtz energy of formation at 298 K, kjoule/mol', '\\Delta A_f'),
            _c('Sf_at_298_K', 'entropy of formation at 298 K, joule/(mol K)', 'S_f'),
        ),
    },
    '14-1': {
        "equations": [
            (
                r'\delta = \sqrt{(\Delta H_{\mathrm{vap}} - R T) / V}'
                r' \quad (\mathrm{Hildebrand\ solubility\ parameter})'
            ),
        ],
        "equationPage": 340,
        "coefficients": _coeffs(
            _c('MW', 'molecular weight'),
            _c(
                'solubility_parameter',
                'Hildebrand solubility parameter, (joule/cm3)^0.5',
                r'\delta',
            ),
            _c('liquid_volume', 'liquid molar volume, cm3/mol', r'V'),
            _c(
                'Hvap',
                'enthalpy of vaporization',
                r'\Delta H_{\mathrm{vap}}',
            ),
            _c('R', 'gas constant'),
            _c('T', 'absolute temperature, K'),
            _c('vdw_area', 'van der Waals area, cm2/mol'),
            _c('vdw_volume', 'van der Waals volume, cm3/mol'),
        ),
    },
    '14-2': {
        "equations": [
            (
                r'\delta = \sqrt{(\Delta H_{\mathrm{vap}} - R T) / V}'
                r' \quad (\mathrm{Hildebrand\ solubility\ parameter})'
            ),
        ],
        "equationPage": 340,
        "coefficients": _coeffs(
            _c('MW', 'molecular weight'),
            _c(
                'solubility_parameter',
                'Hildebrand solubility parameter, (joule/cm3)^0.5',
                r'\delta',
            ),
            _c('liquid_volume', 'liquid molar volume, cm3/mol', r'V'),
            _c(
                'Hvap',
                'enthalpy of vaporization',
                r'\Delta H_{\mathrm{vap}}',
            ),
            _c('R', 'gas constant'),
            _c('T', 'absolute temperature, K'),
            _c('vdw_area', 'van der Waals area, cm2/mol'),
            _c('vdw_volume', 'van der Waals volume, cm3/mol'),
        ),
    },
    '15-1': {
        "equations": [
            r'K_{\mathrm{ow}} = (\mathrm{concentration\ in\ octanol})/(\mathrm{concentration\ in\ water}) \quad (15-2)',
            r'\log_{10} S = A + B T_B + C T_B^2 + D T_B^3 (S - ppm(wt) at 25 C, T_B - K; family coeffs) \quad (15-1)',
        ],
        "equationPage": 346,
        "coefficients": _coeffs(
            _c('S', 'solubility in water at 25 C, ppm (wt)'),
            _c('S_at_T_ppm_wt', 'solubility in water at T, ppm (wt)'),
            _c('S_at_T_ppm_mol', 'solubility in water at T, ppm (mol)'),
            _c('Kow', 'octanol-water partition coefficient', 'K_{\\mathrm{ow}}'),
            _c('log10_Kow', 'base-10 log of Kow', '\\log_{10} K_{\\mathrm{ow}}'),
        ),
    },
    '18-1': {
        "equations": [
            r'K_i = H_i / P \quad (18)',
            r'y_i = K_i x_i',
            r'x_i = y_i / K_i',
        ],
        "equationPage": 385,
        "coefficients": _coeffs(
            _c('MW', 'molecular weight'),
            _c('Tf', 'melting / freezing temperature', 'T_f'),
            _c('Tb', 'boiling temperature', 'T_b'),
            _c('T', 'temperature, C'),
            _c('H_at_T_atm_mol_frac', "Henry's law constant at T, atm/mol frac", 'H'),
            _c('H_at_T_atm_mol_m3', "Henry's law constant at T, atm/(mol/m3)", 'H'),
        ),
    },
    '20-1': {
        "equations": [
            r'x/m = K_{\mathrm{oc}} C \quad (20-1)',
            r'K_{\mathrm{oc}} = (\mathrm{mg\ sorbed/kg\ organic\ carbon})/(\mathrm{mg/L\ aqueous}) \quad (20-2)',
        ],
        "equationPage": 425,
        "coefficients": _coeffs(
            _c('x/m', 'mass of compound adsorbed / mass of soil organic carbon'),
            _c('Koc', 'soil sorption coefficient', 'K_{\\mathrm{oc}}'),
            _c('Koc_at_20_C', 'soil sorption coefficient at 20 C', 'K_{\\mathrm{oc}}'),
            _c('CODE', 'data source code (data or estimated)'),
        ),
    },
    '25-1': {
        "equations": [
            r'\mathrm{LEL},\% = 0.55(100)/(4.76m + 1.19x + 1 - 2.38y) \quad (25-1)',
            r'\mathrm{UEL},\% = 3.50(100)/(4.76m + 1.19x + 1 - 2.38y) \quad (25-2)',
            r'\mathrm{LEL}_{mixture},\% = 1 / \sum(y_i/\mathrm{LEL}_i) \quad (25-3)',
            r'\mathrm{UEL}_{mixture},\% = 1 / \sum(y_i/\mathrm{UEL}_i) \quad (25-4)',
        ],
        "equationPage": 539,
        "coefficients": _coeffs(
            _c('code', 'data source / reliability code'),
            _c('LEL', 'lower explosive limit in air, vol %'),
            _c('UEL', 'upper explosive limit in air, vol %'),
            _c('flash_point_code', 'flash point data code'),
            _c('flash_point_F', 'flash point, F'),
            _c('autoignition_code', 'autoignition temperature data code'),
            _c('autoignition_F', 'autoignition temperature, F'),
        ),
    },
    '25-2': {
        "equations": [
            r'\mathrm{LEL},\% = 0.55(100)/(4.76m + 1.19x + 1 - 2.38y) \quad (25-1)',
            r'\mathrm{UEL},\% = 3.50(100)/(4.76m + 1.19x + 1 - 2.38y) \quad (25-2)',
            r'\mathrm{LEL}_{mixture},\% = 1 / \sum(y_i/\mathrm{LEL}_i) \quad (25-3)',
            r'\mathrm{UEL}_{mixture},\% = 1 / \sum(y_i/\mathrm{UEL}_i) \quad (25-4)',
        ],
        "equationPage": 539,
        "coefficients": _coeffs(
            _c('code', 'data source / reliability code'),
            _c('LEL', 'lower explosive limit in air, vol %'),
            _c('UEL', 'upper explosive limit in air, vol %'),
            _c('flash_point_code', 'flash point data code'),
            _c('flash_point_F', 'flash point, F'),
            _c('autoignition_code', 'autoignition temperature data code'),
            _c('autoignition_F', 'autoignition temperature, F'),
        ),
    },
    '26-1': {
        "equations": [
            r'\Delta H = (-\Delta H_{\mathrm{combustion}})(\mathrm{mass})',
        ],
        "equationPage": 564,
        "coefficients": _coeffs(
            _c('State', 'physical state'),
            _c('Hc_kjoule_mol', 'enthalpy of combustion at 77 F, kjoule/mol', '\\Delta H_c'),
            _c('Hc_kjoule_kg', 'enthalpy of combustion at 77 F, kjoule/kg', '\\Delta H_c'),
            _c('Hc_BTU_lb', 'enthalpy of combustion at 77 F, BTU/lb', '\\Delta H_c'),
        ),
    },
    '27-1': {
        "equations": [
            r'\mathrm{PEL}_{mixture} = \sum y_i / \sum (y_i / \mathrm{PEL}_i) \quad (27-1)',
        ],
        "equationPage": 585,
        "coefficients": _coeffs(
            _c('CAS_No', 'CAS registry number'),
            _c('TLV_ACGIH_ppm', 'threshold limit value (ACGIH), ppm (vol)'),
            _c('TLV_ACGIH_mg_m3', 'threshold limit value (ACGIH), mg/m3'),
            _c('PEL_OSHA_ppm', 'permissible exposure limit (OSHA), ppm (vol)'),
            _c('PEL_OSHA_mg_m3', 'permissible exposure limit (OSHA), mg/m3'),
            _c('REL_NIOSH_ppm', 'recommended exposure limit (NIOSH), ppm (vol)'),
            _c('REL_NIOSH_mg_m3', 'recommended exposure limit (NIOSH), mg/m3'),
            _c('MAK_DFG_ppm', 'maximale Arbeitsplatz-Konzentration (DFG), ppm (vol)'),
            _c('MAK_DFG_mg_m3', 'maximale Arbeitsplatz-Konzentration (DFG), mg/m3'),
        ),
    },
    '27-2': {
        "equations": [
            r'\mathrm{PEL}_{mixture} = \sum y_i / \sum (y_i / \mathrm{PEL}_i) \quad (27-1)',
        ],
        "equationPage": 585,
        "coefficients": _coeffs(
            _c('CAS_No', 'CAS registry number'),
            _c('TLV_ACGIH_ppm', 'threshold limit value (ACGIH), ppm (vol)'),
            _c('TLV_ACGIH_mg_m3', 'threshold limit value (ACGIH), mg/m3'),
            _c('PEL_OSHA_ppm', 'permissible exposure limit (OSHA), ppm (vol)'),
            _c('PEL_OSHA_mg_m3', 'permissible exposure limit (OSHA), mg/m3'),
            _c('REL_NIOSH_ppm', 'recommended exposure limit (NIOSH), ppm (vol)'),
            _c('REL_NIOSH_mg_m3', 'recommended exposure limit (NIOSH), mg/m3'),
            _c('MAK_DFG_ppm', 'maximale Arbeitsplatz-Konzentration (DFG), ppm (vol)'),
            _c('MAK_DFG_mg_m3', 'maximale Arbeitsplatz-Konzentration (DFG), mg/m3'),
        ),
    },
}


_LEGACY_EQ_KEYS = (
    "equation",
    "definition",
    "estimationEquation",
    "derivedDefinitions",
    "equationDjvuPage",
)


def _equations_from_meta(meta: dict[str, Any]) -> list[str] | None:
    """Return curated equations list, or None when the table has no formula."""
    if "equations" in meta:
        eqs = meta["equations"]
        if eqs is None:
            return None
        return [str(e) for e in eqs if e]
    # legacy single primary during migration
    if meta.get("equation"):
        return [str(meta["equation"])]
    return None


def apply_canonical_equations(parsed: dict[str, Any]) -> dict[str, Any]:
    """Fill / overwrite equation fields from ``TABLE_EQUATIONS`` for ``parsed['id']``.

    Sets ``equations`` only (list, or empty when curated null). Strips legacy
    singular / alternate equation fields. ``equationPage`` is the published
    chapter-intro page; emitted when chapter content or coefficients exist.

    Returns the same dict (mutated) for chaining.
    """
    table_id = str(parsed.get("id") or "")
    meta = TABLE_EQUATIONS.get(table_id)
    for key in _LEGACY_EQ_KEYS:
        parsed.pop(key, None)
    if meta is None:
        return parsed

    eqs = _equations_from_meta(meta)
    if eqs is None:
        parsed["equations"] = []
    else:
        parsed["equations"] = list(eqs)

    if meta.get("coefficients") is not None:
        parsed["coefficients"] = [dict(entry) for entry in meta["coefficients"]]

    has_chapter_content = bool(eqs) or bool(meta.get("coefficients"))
    if has_chapter_content and meta.get("equationPage") is not None:
        parsed["equationPage"] = meta["equationPage"]
    else:
        parsed.pop("equationPage", None)

    parsed["equationSource"] = "curated"
    return parsed


def canonical_equations(table_id: str | None) -> list[str]:
    """Return curated equations for ``table_id`` (empty if none)."""
    if not table_id:
        return []
    meta = TABLE_EQUATIONS.get(str(table_id))
    if not meta:
        return []
    eqs = _equations_from_meta(meta)
    return list(eqs or [])


def canonical_equation(table_id: str | None) -> str | None:
    """Return the primary curated equation string for ``table_id``, if any."""
    eqs = canonical_equations(table_id)
    return eqs[0] if eqs else None
