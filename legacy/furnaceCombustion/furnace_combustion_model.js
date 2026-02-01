const fs = require('fs');
const Constants = require('./utils/Constants');

const Thermodynamics = require('./classes/Thermodynamics');
const TransportProperties = require('./classes/TransportProperties');
const DiffusionCoefficients = require('./classes/DiffusionCoefficients');
const GasProperties = require('./classes/GasProperties');
const FuelDatabase = require('./classes/FuelDatabase');
const ChemicalKinetics = require('./modules/ChemicalKinetics');
const HeatTransfer = require('./modules/HeatTransfer');
const Aerodynamics = require('./modules/Aerodynamics');
const Helpers = require('./utils/Helpers');

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

  /**
   * Run the layer-by-layer combustion simulation for the packed-bed furnace.
   * @param {{fuelType?: string, bedHeight_m?: number, diameter_m?: number,
   *          insulationThickness_m?: number, insulationK_W_mK?: number,
   *          airFlow_m3h?: number, airPreheatT_K?: number,
   *          steamInjectionPercent?: number, steamT_K?: number,
   *          nLayers?: number, T_ambient_K?: number}} params - Simulation parameters.
   * @returns {{layers: Array<Object>, oxidationZoneHeight_m: (number|null),
   *           heatReleased_oxidation_W: number, heatAbsorbed_other_W: number,
   *           heatLoss_wall_W: number, outletGasComposition: Object,
   *           outletT_K: number, Tad_stoichiometric_K: number}} Result object.
   */
  run(params) {
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
    const A_m2 = Math.PI * Math.pow(diameter_m, 2) / 4;
    const dz = bedHeight_m / nLayers;

    const layers = [];
    let composition = { O2: 0.21, N2: 0.79, CO: 0, CO2: 0, H2: 0, H2O: 0, CH4: 0 };
    let T_gas = airPreheatT_K;
    let volumetricFlow_m3s = airFlow_m3h / 3600;

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

    let maxCO2 = -1;
    let maxCO2LayerIndex = -1;

    // Layer-by-layer calculation
    for (let i = 0; i < nLayers; i++) {
      const z = i * dz + dz / 2;
      const particleRadius_m = fuelProps.particleSize_m * (0.6 + 0.4 * (nLayers - i) / nLayers) / 2;

      // Gas properties at current gas temperature (initial guess)
      let gasData = this.gasProps.getProperties(composition, T_gas, 1.0);

      const v_superficial = this.aerodynamics.updateVelocity(
        volumetricFlow_m3s,
        airPreheatT_K,
        T_gas,
        A_m2
      );

      const h_conv = this.heatTransfer.h_convection_W_m2K(
        v_superficial,
        particleRadius_m * 2,
        T_gas,
        gasData.density_kg_m3,
        gasData.mu_Pa_s,
        gasData.k_W_mK,
        gasData.Cp_J_molK / gasData.molecularWeight_kg_mol,
        fuelProps.porosity
      );

      // Residence time and layer volume
      const dt = dz / Math.max(v_superficial, 1e-6);
      const layerVolume_m3 = A_m2 * dz;

      // First, use a provisional solid temperature (near gas temperature)
      let T_solid = Math.max(T_gas, 900); // initial guess for burning temperature

      // Compute surface and gas-phase reaction rates with this T_solid and initial gasData
      let surfRates = this.kinetics.surfaceReactionRates(
        composition,
        T_gas,
        T_solid,
        fuelProps,
        gasData.D.O2,
        gasData.D.CO2,
        gasData.D.H2O,
        particleRadius_m
      );
      const gasRates = this.kinetics.gasPhaseReactionRates(composition, T_gas);

      const heatEffects = this.kinetics.heatOfReaction();
      let qDot_W = 0;

      const scale = layerVolume_m3 * dt / Math.max(volumetricFlow_m3s, 1e-9);

      // Surface reactions: C + O2 -> CO2, C + CO2 -> 2CO, C + H2O -> CO + H2
      composition.O2 -= surfRates.r1 * scale;
      composition.CO2 += surfRates.r1 * scale;
      composition.CO2 -= surfRates.r3 * scale;
      composition.CO += 2 * surfRates.r3 * scale;
      composition.H2O -= surfRates.r31 * scale;
      composition.CO += surfRates.r31 * scale;
      composition.H2 += surfRates.r31 * scale;

      // Surface reaction heat contributions
      const q_r1_W = surfRates.r1 * heatEffects.dH1 * layerVolume_m3;
      const q_r3_W = surfRates.r3 * heatEffects.dH3 * layerVolume_m3;
      const q_r31_W = surfRates.r31 * heatEffects.dH31 * layerVolume_m3;

      qDot_W += q_r1_W + q_r3_W + q_r31_W;

      // Classify surface heats: oxidation (exothermic) vs gasification (endothermic)
      // r1: C + O2 -> CO2 (oxidation, exothermic)
      if (q_r1_W < 0) {
        results.heatReleased_oxidation_W += -q_r1_W;
      }
      // r3, r31: Boudouard and water-gas (endothermic gasification)
      if (q_r3_W > 0) {
        results.heatAbsorbed_other_W += q_r3_W;
      }
      if (q_r31_W > 0) {
        results.heatAbsorbed_other_W += q_r31_W;
      }

      // Gas-phase reactions (mole-fraction changes scaled similarly)
      const r4 = gasRates.r4;   // 2CO + O2 -> 2CO2
      const r41 = gasRates.r41; // 2H2 + O2 -> 2H2O
      const r42 = gasRates.r42; // CH4 + 2O2 -> CO2 + 2H2O
      const r43 = gasRates.r43; // CO + H2O -> CO2 + H2 (net)

      // Apply gas-phase reactions to composition
      composition.CO -= 2 * r4 * scale;
      composition.O2 -= 1 * r4 * scale;
      composition.CO2 += 2 * r4 * scale;

      composition.H2 -= 2 * r41 * scale;
      composition.O2 -= 1 * r41 * scale;
      composition.H2O += 2 * r41 * scale;

      composition.CH4 -= 1 * r42 * scale;
      composition.O2 -= 2 * r42 * scale;
      composition.CO2 += 1 * r42 * scale;
      composition.H2O += 2 * r42 * scale;

      composition.CO -= 1 * r43 * scale;
      composition.H2O -= 1 * r43 * scale;
      composition.CO2 += 1 * r43 * scale;
      composition.H2 += 1 * r43 * scale;

      // Gas-phase reaction heat contributions
      const q_r4_W = r4 * heatEffects.dH4 * layerVolume_m3;
      const q_r41_W = r41 * heatEffects.dH41 * layerVolume_m3;
      const q_r42_W = r42 * heatEffects.dH42 * layerVolume_m3;
      const q_r43_W = r43 * heatEffects.dH43 * layerVolume_m3;

      qDot_W += q_r4_W + q_r41_W + q_r42_W + q_r43_W;

      // Classify gas-phase heats: oxidation vs shift
      // r4, r41, r42 are oxidation reactions (exothermic)
      if (q_r4_W < 0) {
        results.heatReleased_oxidation_W += -q_r4_W;
      }
      if (q_r41_W < 0) {
        results.heatReleased_oxidation_W += -q_r41_W;
      }
      if (q_r42_W < 0) {
        results.heatReleased_oxidation_W += -q_r42_W;
      }
      // r43: water-gas shift (typically mildly exo or endo). Treat endothermic part as "other".
      if (q_r43_W > 0) {
        results.heatAbsorbed_other_W += q_r43_W;
      }

      // Clamp small negatives and normalize composition
      for (const sp of Object.keys(composition)) {
        if (composition[sp] < 0) composition[sp] = 0;
      }
      composition = Helpers.normalizeComposition(composition);

      // Track max CO2 so far
      if (composition.CO2 > maxCO2) {
        maxCO2 = composition.CO2;
        maxCO2LayerIndex = i;
      }

      // Steam injection: when we first hit the global-max CO2 layer, modify
      if (
        steamInjectionPercent > 0 &&
        maxCO2LayerIndex === i &&
        // inject only once, on first visit of this index
        (!this._steamInjected || this._steamInjectedIndex !== i)
      ) {
        // Composition update
        const y = { ...composition };
        const fracSteam = steamInjectionPercent / 100;
        y.H2O = (y.H2O || 0) + fracSteam;
        const yNorm = Helpers.normalizeComposition(y);

        // Enthalpy-based temperature correction
        const T_old = T_gas;
        const H_gas = this.thermo.H_mix(composition, T_old);
        const H_steam = this.thermo.H_NASA('H2O', steamT_K);
        const f = fracSteam;
        const H_target = (1 - f) * H_gas + f * H_steam;

        let T_lo = Math.min(T_old, steamT_K);
        let T_hi = Math.max(T_old, steamT_K);
        // Allow some margin
        T_lo = Math.max(Constants.T_MIN_K, T_lo - 200);
        T_hi = Math.min(Constants.T_MAX_K, T_hi + 200);

        for (let iter = 0; iter < Constants.STEAM_ENTHALPY_BISECT_MAX_ITER; iter++) {
          const T_mid = 0.5 * (T_lo + T_hi);
          const H_mid = this.thermo.H_mix(yNorm, T_mid);
          if (H_mid < H_target) {
            T_lo = T_mid;
          } else {
            T_hi = T_mid;
          }
          if (Math.abs(T_hi - T_lo) < 1e-3) break;
        }
        const T_new = 0.5 * (T_lo + T_hi);

        // Update state so downstream layers see steam-modified gas
        composition = yNorm;
        T_gas = T_new;
        this._steamInjected = true;
        this._steamInjectedIndex = i;
      }

      // After computing qDot_W from all reactions, update T_solid based on energy balance
      T_solid = this._estimateSolidTemperature(T_gas, qDot_W, fuelProps, layerVolume_m3, dt);

      // Recompute gas properties at T_solid so diffusion coefficients reflect surface temperature
      gasData = this.gasProps.getProperties(composition, T_solid, 1.0);

      // Recompute surface reaction rates once with updated T_solid and updated diffusion
      surfRates = this.kinetics.surfaceReactionRates(
        composition,
        T_gas,
        T_solid,
        fuelProps,
        gasData.D.O2,
        gasData.D.CO2,
        gasData.D.H2O,
        particleRadius_m
      );
      // Note: for simplicity we do not re-apply composition changes with these updated rates;
      // T_solid and diffusion coefficients at the burning temperature are now available
      // for diagnostics and future refinement.

      const wallTemps = this.heatTransfer.wallTemperatures(
        T_gas,
        T_ambient_K,
        diameter_m / 2,
        insulationThickness_m,
        insulationK_W_mK,
        h_conv,
        Constants.EPS_WALL_INNER_DEFAULT,
        Constants.EPS_WALL_OUTER_DEFAULT,
        dz
      );

      const q_wall_W = A_m2 * h_conv * (T_gas - wallTemps.T_inner);
      results.heatLoss_wall_W += q_wall_W;

      T_gas += (qDot_W - q_wall_W)
        / (volumetricFlow_m3s * gasData.density_kg_m3
          * gasData.Cp_J_molK / gasData.molecularWeight_kg_mol);

      results.layers.push({
        z_m: z,
        T_gas_K: T_gas,
        T_solid_K: T_solid,
        T_wall_inner_K: wallTemps.T_inner,
        T_wall_outer_K: wallTemps.T_outer,
        composition: { ...composition },
        burnRate_g_s: (surfRates.r1 + surfRates.r3 + surfRates.r31) * 0.012 * layerVolume_m3,
        burnRate_per_area_g_s_cm2:
          (surfRates.r1 + surfRates.r3 + surfRates.r31) * 0.012
          / (surfRates.a_s * 10000),
        h_conv_W_m2K: h_conv,
        D_O2_m2s: gasData.D.O2,
        D_CO2_m2s: gasData.D.CO2,
        D_CO_m2s: gasData.D.CO,
        D_H2O_m2s: gasData.D.H2O,
        deltaT_K: i > 0 ? T_gas - results.layers[i - 1].T_gas_K : 0
      });
    }

    for (let i = nLayers - 1; i >= 0; i--) {
      const layer = results.layers[i];
      if (layer.composition.CO < 0.01 && layer.composition.O2 > 0.01) {
        results.oxidationZoneHeight_m = layer.z_m;
        break;
      }
    }

    results.outletGasComposition = results.layers[nLayers - 1].composition;
    results.outletT_K = results.layers[nLayers - 1].T_gas_K;
    results.Tad_stoichiometric_K = this.calculateTad(
      results.outletGasComposition,
      results.outletT_K,
      T_ambient_K
    );

    try {
      fs.mkdirSync('output', { recursive: true });
    } catch (e) {
      // ignore
    }
    fs.writeFileSync('output/layer_data.json', JSON.stringify(results, null, 2));

    return results;
  }

  /**
   * Estimate solid (char) burning temperature in a layer from a simple energy balance.
   * @param {number} T_gas - Local gas temperature [K].
   * @param {number} qDot_W - Volumetric heat release rate in the layer [W].
   * @param {Object} fuelProps - Fuel properties, including bulkDensity_kg_m3 and specificHeat_J_kgK.
   * @param {number} layerVolume_m3 - Geometric volume of the layer [m^3].
   * @param {number} dt - Gas residence time in the layer [s].
   * @returns {number} Estimated solid surface temperature [K].
   */
  _estimateSolidTemperature(T_gas, qDot_W, fuelProps, layerVolume_m3, dt) {
    // Use fuel bulk density and solid Cp to estimate how much the solid can heat up
    const rho_s = fuelProps.bulkDensity_kg_m3 || 400;          // kg/m3 of bed occupied by solid
    const cp_s = fuelProps.specificHeat_J_kgK || 1100;         // J/kg/K

    // Total solid heat capacity in layer volume
    const C_layer_J_K = rho_s * cp_s * layerVolume_m3;         // J/K per layer

    // Energy added to solid over dt [J]
    const Q_solid_J = Math.max(0, qDot_W) * dt;                // only exothermic part heats solid

    const dT_solid = C_layer_J_K > 0 ? Q_solid_J / C_layer_J_K : 0;

    // Burning temperature is gas temperature plus some fraction of dT_solid
    // Clamp to a plausible range for charcoal combustion
    const T_burn = T_gas + 0.5 * dT_solid;                     // 0.5: sharing between gas & solid
    const T_min = Math.max(Constants.T_MIN_SOLID_BURN_K, T_gas);                        // at least gas temp, ~800 K
    const T_max = Constants.T_MAX_K;                                        // avoid unrealistically high T
    return Math.min(T_max, Math.max(T_min, T_burn));
  }

  /**
   * Compute adiabatic flame temperature for completion of combustion with
   * stoichiometric air at λ = 1 based on current gas composition and air temperature.
   * @param {Object.<string, number>} composition - Gas composition (mole fractions) at inlet to ideal flame [-].
   * @param {number} T_initial_K - Initial gas temperature [K].
   * @param {number} T_air_K - Combustion air temperature [K].
   * @returns {number} Adiabatic flame temperature Tad [K].
   */
  calculateTad(composition, T_initial_K, T_air_K) {
    const O2_needed = 0.5 * (composition.CO || 0)
      + 0.5 * (composition.H2 || 0)
      + 2 * (composition.CH4 || 0);
    const air_moles = O2_needed / 0.21;

    const reactants_H = this.thermo.H_mix(composition, T_initial_K)
      + air_moles * (
        0.21 * this.thermo.H_NASA('O2', T_air_K)
        + 0.79 * this.thermo.H_NASA('N2', T_air_K)
      );

    const products = {
      CO2: (composition.CO2 || 0)
        + (composition.CO || 0)
        + (composition.CH4 || 0),
      H2O: (composition.H2O || 0)
        + (composition.H2 || 0)
        + 2 * (composition.CH4 || 0),
      N2: (composition.N2 || 0) + 0.79 * air_moles,
      O2: 0, CO: 0, H2: 0, CH4: 0
    };

    let T_low = Math.max(T_initial_K, T_air_K);
    let T_high = Constants.T_MAX_K;

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

module.exports = FurnaceCombustionModel;

if (require.main === module) {
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
}
