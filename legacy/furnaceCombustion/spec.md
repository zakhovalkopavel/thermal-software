# Full Specification: Layer-by-Layer Combustion Model for Cylindrical Furnace with Charcoal Briquettes

## Implementation Stages

---

## **Stage 1: Project Structure and Core Thermodynamic Classes**

### 1.1 File Structure
```
import/
├── furnace_combustion_model.js       # Main simulation entry point
├── classes/
│   ├── Thermodynamics.js             # NASA-7 polynomials, Cp, H, S, G
│   ├── TransportProperties.js        # Viscosity, thermal conductivity
│   ├── DiffusionCoefficients.js      # Chapman-Enskog for multicomponent
│   ├── GasProperties.js              # Aggregated gas mixture properties
│   └── FuelDatabase.js               # Reference data for solid fuels
├── modules/
│   ├── ChemicalKinetics.js           # Rate expressions for all reactions
│   ├── HeatTransfer.js               # Convection, radiation, wall losses
│   ├── Aerodynamics.js               # Flow velocity, pressure drop
│   └── EquilibriumSolver.js          # Optional Gibbs minimizer
├── utils/
│   ├── Constants.js                  # Universal constants (R, σ, etc.)
│   ├── Helpers.js                    # Normalization, interpolation
│   └── References.js                 # Bibliography with page numbers
└── output/
    └── layer_data.json               # Per-layer simulation results
```

### 1.2 Thermodynamics.js
**Purpose:** Calculate thermodynamic properties using NASA 7-coefficient polynomials.

**References:**
- McBride, B.J., Gordon, S., Reno, M.A. "Coefficients for Calculating Thermodynamic and Transport Properties of Individual Species." NASA TM-4513, 1993, pp. 1-98.

**Implementation:**
```javascript
class Thermodynamics {
  constructor() {
    this.NASA7_DATA = {
      CO: { low: [...], high: [...], Tswitch: 1000 },
      CO2: { low: [...], high: [...], Tswitch: 1000 },
      H2: { low: [...], high: [...], Tswitch: 1000 },
      H2O: { low: [...], high: [...], Tswitch: 1000 },
      O2: { low: [...], high: [...], Tswitch: 1000 },
      N2: { low: [...], high: [...], Tswitch: 1000 },
      CH4: { low: [...], high: [...], Tswitch: 1000 }
    };
  }

  Cp_NASA(species, T) { /* J/mol/K */ }
  H_NASA(species, T) { /* J/mol */ }
  S_NASA(species, T) { /* J/mol/K */ }
  G_NASA(species, T) { /* J/mol */ }
  
  // Mixture properties
  Cp_mix(composition, T) { /* Weighted by mole fractions */ }
  H_mix(composition, T) { /* Weighted by mole fractions */ }
}
```

**Test:** Verify Cp, H at 298K and 1500K against NASA tables.

---

## **Stage 2: Transport Properties**

### 2.1 TransportProperties.js
**Purpose:** Calculate viscosity and thermal conductivity.

**References:**
- Poling, B.E., Prausnitz, J.M., O'Connell, J.P. "The Properties of Gases and Liquids," 5th ed., McGraw-Hill, 2001, pp. 9-12 (viscosity), pp. 10-14 (thermal conductivity).
- Sutherland formula: Bird, R.B., Stewart, W.E., Lightfoot, E.N. "Transport Phenomena," 2nd ed., Wiley, 2002, p. 26.

**Implementation:**
```javascript
class TransportProperties {
  // Sutherland's formula for pure species
  viscosity_Pa_s(species, T_K) {
    const params = {
      O2: { mu0: 1.919e-5, T0: 273, S: 127 },
      N2: { mu0: 1.663e-5, T0: 273, S: 107 },
      CO: { mu0: 1.657e-5, T0: 273, S: 136 },
      CO2: { mu0: 1.370e-5, T0: 273, S: 222 },
      H2: { mu0: 8.411e-6, T0: 273, S: 97 },
      H2O: { mu0: 1.12e-5, T0: 350, S: 1064 },
      CH4: { mu0: 1.027e-5, T0: 273, S: 170 }
    };
    // Return mu0 * (T/T0)^1.5 * (T0+S)/(T+S)
  }

  // Wilke's mixing rule for mixture viscosity
  viscosity_mix(composition, T_K) { /* Pa·s */ }

  // Eucken correlation for thermal conductivity
  thermalConductivity_W_mK(species, T_K, Cp_J_molK) {
    // k = (Cp + 1.25*R) * mu / M
  }

  thermalConductivity_mix(composition, T_K) { /* W/m/K */ }
}
```

**Test:** Compare air viscosity at 300K, 1000K with literature values.

---

### 2.2 DiffusionCoefficients.js
**Purpose:** Chapman-Enskog method for binary diffusion, then multicomponent mixture.

**References:**
- Bird, Stewart, Lightfoot "Transport Phenomena," 2nd ed., 2002, pp. 526-530.
- Hirschfelder, J.O., Curtiss, C.F., Bird, R.B. "Molecular Theory of Gases and Liquids," Wiley, 1954, pp. 539-543.

**Implementation:**
```javascript
class DiffusionCoefficients {
  constructor() {
    // Lennard-Jones parameters σ (Å) and ε/k (K)
    this.LJ_params = {
      O2: { sigma: 3.467, epsilon_k: 106.7 },
      N2: { sigma: 3.798, epsilon_k: 71.4 },
      CO: { sigma: 3.690, epsilon_k: 91.7 },
      CO2: { sigma: 3.941, epsilon_k: 195.2 },
      H2: { sigma: 2.827, epsilon_k: 59.7 },
      H2O: { sigma: 2.641, epsilon_k: 809.1 },
      CH4: { sigma: 3.758, epsilon_k: 148.6 }
    };
  }

  // Binary diffusion coefficient (Chapman-Enskog)
  D_binary_m2s(species1, species2, T_K, P_atm) {
    // D_12 = 0.00266 * T^1.5 / (P * sigma_12^2 * Omega_D)
    // where sigma_12 = (sigma1 + sigma2)/2
    // Omega_D from collision integral tables
  }

  // Multicomponent effective diffusion
  D_effective_m2s(species_i, composition, T_K, P_atm) {
    // D_i,mix = (1 - y_i) / Σ(y_j / D_ij)
  }

  // All species diffusion coefficients
  getAllDiffusionCoefficients(composition, T_K, P_atm) {
    return {
      O2: this.D_effective_m2s('O2', composition, T_K, P_atm),
      CO2: this.D_effective_m2s('CO2', composition, T_K, P_atm),
      CO: this.D_effective_m2s('CO', composition, T_K, P_atm),
      H2: this.D_effective_m2s('H2', composition, T_K, P_atm),
      H2O: this.D_effective_m2s('H2O', composition, T_K, P_atm),
      CH4: this.D_effective_m2s('CH4', composition, T_K, P_atm)
    };
  }
}
```

**Test:** Verify D\_O2-N2 at 300K, 1 atm ≈ 2.0×10⁻⁵ m²/s.

---

### 2.3 GasProperties.js
**Purpose:** Aggregated properties of gas mixture at given T, P, composition.

```javascript
class GasProperties {
  constructor(thermo, transport, diffusion) {
    this.thermo = thermo;
    this.transport = transport;
    this.diffusion = diffusion;
  }

  getProperties(composition, T_K, P_atm = 1.0) {
    return {
      Cp_J_molK: this.thermo.Cp_mix(composition, T_K),
      H_J_mol: this.thermo.H_mix(composition, T_K),
      mu_Pa_s: this.transport.viscosity_mix(composition, T_K),
      k_W_mK: this.transport.thermalConductivity_mix(composition, T_K),
      D: this.diffusion.getAllDiffusionCoefficients(composition, T_K, P_atm),
      density_kg_m3: this.getDensity(composition, T_K, P_atm),
      molecularWeight_kg_mol: this.getMolecularWeight(composition)
    };
  }

  getDensity(composition, T_K, P_atm) {
    // ρ = (P * M_avg) / (R * T), P in Pa, M in kg/mol
    const R = 8.314; // J/mol/K
    const M_avg = this.getMolecularWeight(composition);
    const P_Pa = P_atm * 101325;
    return (P_Pa * M_avg) / (R * T_K);
  }

  getMolecularWeight(composition) {
    const MW = { O2: 0.032, N2: 0.028, CO: 0.028, CO2: 0.044, 
                 H2: 0.002, H2O: 0.018, CH4: 0.016 };
    let M_avg = 0;
    for (const [sp, y] of Object.entries(composition)) {
      M_avg += y * (MW[sp] || 0);
    }
    return M_avg;
  }
}
```

---

## **Stage 3: Fuel Database and Kinetics**

### 3.1 FuelDatabase.js
**Purpose:** Store measured properties of solid fuels.

**References:**
- Basu, P. "Combustion and Gasification in Fluidized Beds," CRC Press, 2006, pp. 45-78.
- Van Krevelen, D.W. "Coal: Typology, Physics, Chemistry, Constitution," Elsevier, 1993, pp. 220-250.

```javascript
class FuelDatabase {
  constructor() {
    this.fuels = {
      'charcoal-briquette': {
        elementalComp: { C: 0.85, H: 0.03, O: 0.10, N: 0.01, ash: 0.01 },
        porosity: 0.45,
        bulkDensity_kg_m3: 450,
        particleSize_m: 0.05, // 5 cm pillow shape
        tortuosity: 3.0,
        activityFactor: 1.0,
        heatOfFormation_J_kg: -8500000, // Approx for charcoal
        specificHeat_J_kgK: 1100,
        emissivity: 0.85,
        ref: 'Basu 2006, p. 67'
      },
      'charcoal-oak': {
        elementalComp: { C: 0.82, H: 0.04, O: 0.12, N: 0.01, ash: 0.01 },
        porosity: 0.50,
        bulkDensity_kg_m3: 380,
        particleSize_m: 0.03,
        tortuosity: 2.8,
        activityFactor: 1.1,
        heatOfFormation_J_kg: -8200000,
        specificHeat_J_kgK: 1050,
        emissivity: 0.83,
        ref: 'Van Krevelen 1993, p. 235'
      },
      // Add: wood-oak, wood-beech, coal-bituminous, anthracite, coke, pellets
    };
  }

  getFuel(fuelType) {
    return this.fuels[fuelType] || this.fuels['charcoal-briquette'];
  }
}
```

---

### 3.2 ChemicalKinetics.js
**Purpose:** Reaction rates for gas-phase and surface reactions.

**References:**
- Turns, S.R. "An Introduction to Combustion," 3rd ed., McGraw-Hill, 2012, pp. 120-145 (gas-phase kinetics).
- Laurendeau, N.M. "Heterogeneous Kinetics of Coal Char Gasification and Combustion," Progress in Energy and Combustion Science, 1978, 4(4), pp. 221-270.
- Higman, C., van der Burgt, M. "Gasification," 2nd ed., Elsevier, 2008, pp. 78-95 (Boudouard, water-gas).

```javascript
class ChemicalKinetics {
  constructor() {
    this.R = 8.314; // J/mol/K
    
    // Activation energies
    this.E = {
      E1: 140000,              // C + O2 → CO2
      E2: 1.1 * 140000,        // 2C + O2 → 2CO
      E3: 2.2 * 140000,        // C + CO2 → 2CO (Boudouard)
      E31: 1.6 * 140000,       // C + H2O → CO + H2 (water-gas)
      E32: 240000,             // C + 2H2O → CO2 + 2H2
      E33: 80000,              // C + 2H2 → CH4 (methanation)
      E4: 96300,               // 2CO + O2 → 2CO2 (gas)
      E41: 70000,              // 2H2 + O2 → 2H2O (gas)
      E42: 125000,             // CH4 + 2O2 → CO2 + 2H2O (gas)
      E43: 90000               // CO + H2O ↔ CO2 + H2 (shift)
    };

    // Pre-exponential factors (literature-based, tuned)
    this.A = {
      A1: 1e7,   A2: 5e6,   A3: 1e5,   A31: 1e4,
      A32: 1e4,  A33: 1e3,  A4: 1e10,  A41: 1e11,
      A42: 1e9,  A43: 1e7
    };
  }

  // Arrhenius rate constant
  k(A, E, T_K) {
    return A * Math.exp(-E / (this.R * T_K));
  }

  // Surface reaction rates with effectiveness factor
  surfaceReactionRates(composition, T_gas_K, T_solid_K, fuelProps, D_eff_O2, D_eff_CO2, D_eff_H2O, particleRadius_m) {
    const P_atm = 1.0;
    const pO2 = composition.O2 * P_atm;
    const pCO2 = composition.CO2 * P_atm;
    const pCO = composition.CO * P_atm;
    const pH2O = composition.H2O * P_atm;

    // Thiele modulus and effectiveness factor
    const calcEta = (k_surf, D_eff, R_p) => {
      const phi = R_p * Math.sqrt(k_surf / D_eff);
      if (phi < 0.01) return 1.0;
      const coth_phi = 1 / Math.tanh(phi);
      return (3 / (phi * phi)) * (phi * coth_phi - 1);
    };

    // T_kinetic = ln-mean of T_solid and T_gas
    const T_kin = (T_solid_K - T_gas_K) / Math.log(T_solid_K / T_gas_K);

    // Surface kinetics
    const k1 = this.k(this.A.A1, this.E.E1, T_kin);
    const k3 = this.k(this.A.A3, this.E.E3, T_kin);
    const k31 = this.k(this.A.A31, this.E.E31, T_kin);

    const eta1 = calcEta(k1, D_eff_O2, particleRadius_m) * fuelProps.activityFactor;
    const eta3 = calcEta(k3, D_eff_CO2, particleRadius_m) * fuelProps.activityFactor;
    const eta31 = calcEta(k31, D_eff_H2O, particleRadius_m) * fuelProps.activityFactor;

    // Specific surface area (external, m²/m³ bed)
    const epsilon = fuelProps.porosity;
    const a_s = 3 * (1 - epsilon) / particleRadius_m;

    // Reaction rates (mol/m³/s bed volume)
    const r1 = eta1 * a_s * k1 * pO2;            // C + O2 → CO2
    const r3 = eta3 * a_s * k3 * (pCO2 - pCO);   // C + CO2 ↔ 2CO
    const r31 = eta31 * a_s * k31 * pH2O;        // C + H2O → CO + H2

    return { r1, r3, r31, a_s };
  }

  // Gas-phase reaction rates
  gasPhaseReactionRates(composition, T_K, P_atm = 1.0) {
    const k4 = this.k(this.A.A4, this.E.E4, T_K);
    const k41 = this.k(this.A.A41, this.E.E41, T_K);
    const k42 = this.k(this.A.A42, this.E.E42, T_K);
    const k43 = this.k(this.A.A43, this.E.E43, T_K);

    const pCO = composition.CO * P_atm;
    const pO2 = composition.O2 * P_atm;
    const pH2 = composition.H2 * P_atm;
    const pH2O = composition.H2O * P_atm;
    const pCH4 = composition.CH4 * P_atm;

    const r4 = k4 * pCO * pCO * pO2;            // 2CO + O2 → 2CO2
    const r41 = k41 * pH2 * pH2 * pO2;          // 2H2 + O2 → 2H2O
    const r42 = k42 * pCH4 * pO2 * pO2;         // CH4 + 2O2 → CO2 + 2H2O
    const r43_fwd = k43 * pCO * pH2O;           // CO + H2O → CO2 + H2
    const r43_rev = k43 / 10 * composition.CO2 * pH2; // Reverse (simplified)

    return { r4, r41, r42, r43: r43_fwd - r43_rev };
  }

  // Heat effects (J/mol C reacted)
  heatOfReaction() {
    return {
      dH1: -393500,     // C + O2 → CO2
      dH2: -110500,     // 2C + O2 → 2CO (per mol C)
      dH3: 172000,      // C + CO2 → 2CO (endothermic)
      dH31: 131000,     // C + H2O → CO + H2 (endothermic)
      dH32: 90000,      // C + 2H2O → CO2 + 2H2 (endothermic)
      dH33: -75000,     // C + 2H2 → CH4 (exothermic)
      dH4: -283000,     // 2CO + O2 → 2CO2 (per mol CO)
      dH41: -241800,    // 2H2 + O2 → 2H2O (per mol H2)
      dH42: -802000,    // CH4 + 2O2 → CO2 + 2H2O
      dH43: -41000      // CO + H2O → CO2 + H2 (water-gas shift)
    };
  }
}
```

---

## **Stage 4: Heat Transfer Module**

### 4.1 HeatTransfer.js
**Purpose:** Convection, radiation, wall losses.

**References:**
- Incropera, F.P., DeWitt, D.P., Bergman, T.L., Lavine, A.S. "Fundamentals of Heat and Mass Transfer," 7th ed., Wiley, 2011, pp. 490-530 (convection), pp. 746-790 (radiation).
- Holman, J.P. "Heat Transfer," 10th ed., McGraw-Hill, 2010, pp. 327-350.

```javascript
class HeatTransfer {
  constructor() {
    this.sigma = 5.67e-8; // Stefan-Boltzmann, W/m²/K⁴
  }

  // Gas-to-solid convection in packed bed (Gunn correlation)
  h_convection_W_m2K(v_m_s, D_p_m, T_K, rho_kg_m3, mu_Pa_s, k_W_mK, Cp_J_kgK, epsilon) {
    const Re = (rho_kg_m3 * v_m_s * D_p_m) / mu_Pa_s;
    const Pr = (mu_Pa_s * Cp_J_kgK) / k_W_mK;
    
    // Gunn correlation for packed beds
    const Nu = (7 - 10*epsilon + 5*epsilon*epsilon) * (1 + 0.7*Math.pow(Re, 0.2)*Math.pow(Pr, 1/3))
             + (1.33 - 2.4*epsilon + 1.2*epsilon*epsilon) * Math.pow(Re, 0.7) * Math.pow(Pr, 1/3);
    
    return Nu * k_W_mK / D_p_m;
  }

  // Radiation between fuel particles and wall (simplified)
  q_radiation_W_m2(T_fuel_K, T_wall_K, epsilon_fuel, epsilon_wall) {
    const F_fuel_wall = 0.5; // View factor approximation
    const epsilon_eff = 1 / (1/epsilon_fuel + 1/epsilon_wall - 1);
    return epsilon_eff * F_fuel_wall * this.sigma * (Math.pow(T_fuel_K, 4) - Math.pow(T_wall_K, 4));
  }

  // Gas-to-wall convection
  q_conv_gas_wall_W_m2(h_W_m2K, T_gas_K, T_wall_K) {
    return h_W_m2K * (T_gas_K - T_wall_K);
  }

  // External natural convection (vertical cylinder)
  h_external_natural_W_m2K(T_wall_K, T_ambient_K, L_m) {
    const T_film = (T_wall_K + T_ambient_K) / 2;
    const beta = 1 / T_film; // Volumetric expansion coefficient for ideal gas
    const g = 9.81;
    const deltaT = Math.abs(T_wall_K - T_ambient_K);
    
    // Air properties at film temperature (simplified)
    const nu = 1.5e-5; // m²/s
    const alpha = 2.2e-5; // m²/s
    const Pr = 0.7;
    
    const Gr = (g * beta * deltaT * Math.pow(L_m, 3)) / (nu * nu);
    const Ra = Gr * Pr;
    
    // Churchill-Chu correlation for vertical plate/cylinder
    const Nu = Math.pow(0.825 + 0.387 * Math.pow(Ra, 1/6) / Math.pow(1 + Math.pow(0.492/Pr, 9/16), 8/27), 2);
    
    const k_air = 0.026; // W/m/K at typical temp
    return Nu * k_air / L_m;
  }

  // External radiation to ambient
  q_radiation_external_W_m2(T_wall_K, T_ambient_K, epsilon_wall) {
    return epsilon_wall * this.sigma * (Math.pow(T_wall_K, 4) - Math.pow(T_ambient_K, 4));
  }

  // Wall conduction (cylindrical)
  wallTemperatures(T_gas_K, T_ambient_K, r_inner_m, thickness_m, k_wall_W_mK, 
                   h_gas_W_m2K, epsilon_wall_inner, epsilon_wall_outer, L_m) {
    const r_outer_m = r_inner_m + thickness_m;
    
    // Iterative solution for T_inner and T_outer
    let T_inner = T_gas_K - 50;
    let T_outer = T_ambient_K + 50;
    
    for (let iter = 0; iter < 10; iter++) {
      const h_ext = this.h_external_natural_W_m2K(T_outer, T_ambient_K, L_m);
      
      // Conduction through wall: q = k * 2π*L * (T_inner - T_outer) / ln(r_outer/r_inner)
      // Heat balance at inner surface
      const q_gas_to_inner = h_gas_W_m2K * (T_gas_K - T_inner) 
                           + epsilon_wall_inner * this.sigma * (Math.pow(T_gas_K, 4) - Math.pow(T_inner, 4));
      
      // Heat balance at outer surface
      const q_outer_to_ambient = h_ext * (T_outer - T_ambient_K)
                               + this.q_radiation_external_W_m2(T_outer, T_ambient_K, epsilon_wall_outer);
      
      // Conduction heat flux
      const q_cond_per_area = k_wall_W_mK * (T_inner - T_outer) / (thickness_m * r_inner_m / ((r_inner_m + r_outer_m)/2));
      
      // Update temperatures (simplified)
      T_inner = T_gas_K - q_gas_to_inner / (h_gas_W_m2K + 4*epsilon_wall_inner*this.sigma*Math.pow(T_gas_K,3));
      T_outer = T_ambient_K + q_outer_to_ambient / (h_ext + 4*epsilon_wall_outer*this.sigma*Math.pow(T_ambient_K,3));
    }
    
    return { T_inner, T_outer };
  }
}
```

---

## **Stage 5: Aerodynamics Module**

### 5.1 Aerodynamics.js
**Purpose:** Flow velocity, pressure drop through packed bed.

**References:**
- Ergun, S. "Fluid Flow Through Packed Columns," Chemical Engineering Progress, 1952, 48(2), pp. 89-94.
- Bird, Stewart, Lightfoot "Transport Phenomena," 2nd ed., 2002, pp. 191-195.

```javascript
class Aerodynamics {
  // Ergun equation for pressure drop
  pressureDrop_Pa_m(v_superficial_m_s, D_p_m, epsilon, rho_kg_m3, mu_Pa_s) {
    const term1 = 150 * (1 - epsilon) * (1 - epsilon) * mu_Pa_s * v_superficial_m_s 
                / (epsilon * epsilon * epsilon * D_p_m * D_p_m);
    const term2 = 1.75 * (1 - epsilon) * rho_kg_m3 * v_superficial_m_s * v_superficial_m_s 
                / (epsilon * epsilon * epsilon * D_p_m);
    return term1 + term2;
  }

  // Update superficial velocity accounting for temperature and composition changes
  updateVelocity(volumetricFlow_m3s_at_inlet, T_inlet_K, T_local_K, A_m2) {
    // V_local = V_inlet * (T_local / T_inlet) at constant pressure
    const v_inlet = volumetricFlow_m3s_at_inlet / A_m2;
    return v_inlet * (T_local_K / T_inlet_K);
  }
}
```

---

## **Stage 6: Main Simulation Loop**

### 6.1 furnace_combustion_model.js
**Purpose:** Layer-by-layer calculation with inputs/outputs as specified.

```javascript
class FurnaceCombustionModel {
  constructor() {
    this.thermo = new Thermodynamics();
    this.transport = new TransportProperties();
    this.diffusion = new DiffusionCoefficients();
    this.gasProps = new GasProperties(this.thermo, this.transport, this.diffusion);
    this.fuelDB = new FuelDatabase();
    this.kinetics = new ChemicalKinetics();
    this.heatTransfer = new HeatTransfer();
    this.aerodynamics = new Aerodynamics();
  }

  run(params) {
    // Inputs
    const fuelType = params.fuelType || 'charcoal-briquette';
    const bedHeight_m = params.bedHeight_m || 0.5;
    const diameter_m = params.diameter_m || 0.3;
    const insulationThickness_m = params.insulationThickness_m || 0.04;
    const insulationK_W_mK = params.insulationK_W_mK || 0.15;
    const airFlow_m3h = params.airFlow_m3h || 10;
    const airPreheatT_K = params.airPreheatT_K || 400;
    const steamInjectionPercent = params.steamInjectionPercent || 10;
    const steamT_K = params.steamT_K || 500;
    const nLayers = params.nLayers || 25;
    const T_ambient_K = params.T_ambient_K || 293;

    const fuelProps = this.fuelDB.getFuel(fuelType);
    const A_m2 = Math.PI * diameter_m * diameter_m / 4;
    const dz = bedHeight_m / nLayers;

    // Initialize layers
    const layers = [];
    let composition = { O2: 0.21, N2: 0.79, CO: 0, CO2: 0, H2: 0, H2O: 0, CH4: 0 };
    let T_gas = airPreheatT_K;
    let volumetricFlow_m3s = airFlow_m3h / 3600;

    // Results storage
    const results = {
      layers: [],
      oxidationZoneHeight_m: null,
      heatReleased_oxidation_W: 0,
      heatAbsorbed_other_W: 0,
      heatLoss_wall_W: 0,
      outletGasComposition: null,
      outletT_K: null,
      Tad_stoichiometric_K: null
    };

    // Layer-by-layer calculation
    for (let i = 0; i < nLayers; i++) {
      const z = i * dz + dz / 2;
      
      // Particle size variation (fresh at top, smaller at bottom)
      const particleRadius_m = fuelProps.particleSize_m * (0.6 + 0.4 * (nLayers - i) / nLayers) / 2;

      // Get gas properties
      const gasData = this.gasProps.getProperties(composition, T_gas, 1.0);
      
      // Superficial velocity
      const v_superficial = this.aerodynamics.updateVelocity(volumetricFlow_m3s, airPreheatT_K, T_gas, A_m2);

      // Heat transfer coefficients
      const h_conv = this.heatTransfer.h_convection_W_m2K(
        v_superficial, particleRadius_m*2, T_gas, 
        gasData.density_kg_m3, gasData.mu_Pa_s, gasData.k_W_mK, 
        gasData.Cp_J_molK / gasData.molecularWeight_kg_mol, fuelProps.porosity
      );

      // Reaction rates
      const T_solid = T_gas + 100; // Initial guess
      const surfRates = this.kinetics.surfaceReactionRates(
        composition, T_gas, T_solid, fuelProps,
        gasData.D.O2, gasData.D.CO2, gasData.D.H2O, particleRadius_m
      );
      const gasRates = this.kinetics.gasPhaseReactionRates(composition, T_gas);

      // Update composition (simplified explicit scheme)
      const dt = dz / v_superficial; // Residence time in layer
      const layerVolume_m3 = A_m2 * dz;
      
      // Species balance (mol/s changes)
      const heatEffects = this.kinetics.heatOfReaction();
      let qDot_W = 0;

      // Surface reactions
      composition.O2 -= surfRates.r1 * layerVolume_m3 * dt / volumetricFlow_m3s;
      composition.CO2 += surfRates.r1 * layerVolume_m3 * dt / volumetricFlow_m3s;
      composition.CO2 -= surfRates.r3 * layerVolume_m3 * dt / volumetricFlow_m3s;
      composition.CO += 2 * surfRates.r3 * layerVolume_m3 * dt / volumetricFlow_m3s;
      composition.H2O -= surfRates.r31 * layerVolume_m3 * dt / volumetricFlow_m3s;
      composition.CO += surfRates.r31 * layerVolume_m3 * dt / volumetricFlow_m3s;
      composition.H2 += surfRates.r31 * layerVolume_m3 * dt / volumetricFlow_m3s;

      qDot_W += surfRates.r1 * heatEffects.dH1 * layerVolume_m3;
      qDot_W += surfRates.r3 * heatEffects.dH3 * layerVolume_m3;
      qDot_W += surfRates.r31 * heatEffects.dH31 * layerVolume_m3;

      // Gas-phase reactions (simplified)
      // ... (similar updates for r4, r41, r42, r43)

      // Normalize composition
      const total = Object.values(composition).reduce((a,b) => a+b, 0);
      for (const sp in composition) composition[sp] /= total;

      // Steam injection at layer with max CO2
      // (Implemented after first pass to find max CO2 layer)

      // Energy balance
      const wallTemps = this.heatTransfer.wallTemperatures(
        T_gas, T_ambient_K, diameter_m/2, insulationThickness_m, 
        insulationK_W_mK, h_conv, 0.85, 0.9, dz
      );

      const q_wall_W = A_m2 * h_conv * (T_gas - wallTemps.T_inner);
      results.heatLoss_wall_W += q_wall_W;

      T_gas += (qDot_W - q_wall_W) / (volumetricFlow_m3s * gasData.density_kg_m3 * gasData.Cp_J_molK / gasData.molecularWeight_kg_mol);

      // Store layer data
      results.layers.push({
        z_m: z,
        T_gas_K: T_gas,
        T_solid_K: T_solid,
        T_wall_inner_K: wallTemps.T_inner,
        T_wall_outer_K: wallTemps.T_outer,
        composition: {...composition},
        burnRate_g_s: (surfRates.r1 + surfRates.r3 + surfRates.r31) * 0.012 * layerVolume_m3,
        burnRate_per_area_g_s_cm2: (surfRates.r1 + surfRates.r3 + surfRates.r31) * 0.012 / (surfRates.a_s * 10000),
        h_conv_W_m2K: h_conv,
        D_O2_m2s: gasData.D.O2,
        D_CO2_m2s: gasData.D.CO2,
        D_CO_m2s: gasData.D.CO,
        D_H2O_m2s: gasData.D.H2O,
        deltaT_K: i > 0 ? T_gas - results.layers[i-1].T_gas_K : 0
      });
    }

    // Find oxidation zone (CO < 1%, O2 present)
    for (let i = nLayers-1; i >= 0; i--) {
      if (results.layers[i].composition.CO < 0.01 && results.layers[i].composition.O2 > 0.01) {
        results.oxidationZoneHeight_m = results.layers[i].z_m;
        break;
      }
    }

    // Outlet gas
    results.outletGasComposition = results.layers[nLayers-1].composition;
    results.outletT_K = results.layers[nLayers-1].T_gas_K;

    // Adiabatic flame temperature (λ=1, stoichiometric)
    results.Tad_stoichiometric_K = this.calculateTad(results.outletGasComposition, results.outletT_K, T_ambient_K);

    // Write JSON output
    fs.writeFileSync('output/layer_data.json', JSON.stringify(results, null, 2));

    return results;
  }

  calculateTad(composition, T_initial_K, T_air_K) {
    // Stoichiometric combustion with air
    // CO + 0.5O2 → CO2
    // H2 + 0.5O2 → H2O
    // CH4 + 2O2 → CO2 + 2H2O
    
    const O2_needed = 0.5*composition.CO + 0.5*composition.H2 + 2*composition.CH4;
    const air_moles = O2_needed / 0.21;
    
    const reactants_H = this.thermo.H_mix(composition, T_initial_K) 
                      + air_moles * (0.21*this.thermo.H_NASA('O2', T_air_K) + 0.79*this.thermo.H_NASA('N2', T_air_K));
    
    const products = {
      CO2: composition.CO2 + composition.CO + composition.CH4,
      H2O: composition.H2O + composition.H2 + 2*composition.CH4,
      N2: composition.N2 + 0.79*air_moles,
      O2: 0, CO: 0, H2: 0, CH4: 0
    };
    
    // Bisection to find Tad where H_products(Tad) = reactants_H
    let T_low = Math.max(T_initial_K, T_air_K);
    let T_high = 3000;
    
    while (T_high - T_low > 1) {
      const T_mid = (T_low + T_high) / 2;
      const H_prod = this.thermo.H_mix(products, T_mid);
      
      if (H_prod < reactants_H) {
        T_low = T_mid;
      } else {
        T_high = T_mid;
      }
    }
    
    return (T_low + T_high) / 2;
  }
}

// Example usage
const model = new FurnaceCombustionModel();
const results = model.run({
  fuelType: 'charcoal-briquette',
  bedHeight_m: 0.5,
  diameter_m: 0.3,
  insulationThickness_m: 0.04,
  airFlow_m3h: 10,
  airPreheatT_K: 400,
  steamInjectionPercent: 10,
  nLayers: 25
});

console.log('Outlet gas composition:', results.outletGasComposition);
console.log('Outlet temperature:', results.outletT_K, 'K');
console.log('Adiabatic flame temperature (λ=1):', results.Tad_stoichiometric_K, 'K');
console.log('Oxidation zone height:', results.oxidationZoneHeight_m, 'm');
console.log('Full layer data written to output/layer_data.json');
```

---

## **Stage 7: Output and Validation**

### 7.1 Output Format
- Console summary of key results
- JSON file `output/layer_data.json` with all layer-by-layer data
- Include all requested fields: gas composition, temperatures, burn rates, diffusion coefficients, heat transfer data

### 7.2 Validation Steps
1. Verify thermodynamic properties against NIST tables
2. Check diffusion coefficients against literature (Bird et al.)
3. Compare kinetic rates with experimental data from references
4. Energy balance closure (heat in = heat out + losses)
5. Mass balance closure for C, H, O, N atoms

### 7.3 References Documentation
Create `utils/References.js` with full bibliography:
```javascript
const REFERENCES = {
  NASA_polynomials: 'McBride, B.J., et al. NASA TM-4513, 1993, pp. 1-98',
  transport_props: 'Poling, B.E., et al. Properties of Gases and Liquids, 5th ed., 2001, pp. 9-14',
  diffusion: 'Bird, R.B., et al. Transport Phenomena, 2nd ed., 2002, pp. 526-530',
  kinetics_gas: 'Turns, S.R. Introduction to Combustion, 3rd ed., 2012, pp. 120-145',
  kinetics_solid: 'Laurendeau, N.M. Prog. Energy Combust. Sci., 1978, 4(4), pp. 221-270',
  heat_transfer: 'Incropera, F.P., et al. Heat and Mass Transfer, 7th ed., 2011, pp. 490-790',
  ergun: 'Ergun, S. Chem. Eng. Prog., 1952, 48(2), pp. 89-94',
  fuel_properties: 'Basu, P. Combustion and Gasification, 2006, pp. 45-78; Van Krevelen, Coal, 1993, pp. 220-250'
};
```

---

## **Implementation Summary**

**Stage 1:** Core thermodynamic classes with NASA polynomials  
**Stage 2:** Transport properties (viscosity, thermal conductivity, diffusion)  
**Stage 3:** Fuel database and chemical kinetics  
**Stage 4:** Heat transfer module (convection, radiation, wall losses)  
**Stage 5:** Aerodynamics (flow velocity, pressure drop)  
**Stage 6:** Main simulation loop with layer-by-layer calculation  
**Stage 7:** Output formatting, validation, and documentation  

Each stage should be implemented, tested, and validated before proceeding to the next. All property values must include literature references with page numbers as specified.