class FuelDatabase {
  constructor() {
    this.fuels = {
      'charcoal-briquette': {
        elementalComp: { C: 0.85, H: 0.03, O: 0.10, N: 0.01, ash: 0.01 },
        porosity: 0.45,
        bulkDensity_kg_m3: 450,
        particleSize_m: 0.05,
        tortuosity: 3.0,
        activityFactor: 1.0,
        heatOfFormation_J_kg: -8500000,
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
      }
      // TODO: add more fuels as needed
    };
  }

  /**
   * Retrieve fuel property record by type.
   * @param {string} fuelType - Fuel key (e.g. 'charcoal-briquette', 'charcoal-oak').
   * @returns {{elementalComp: Object, porosity: number, bulkDensity_kg_m3: number,
   *           particleSize_m: number, tortuosity: number, activityFactor: number,
   *           heatOfFormation_J_kg: number, specificHeat_J_kgK: number,
   *           emissivity: number, ref: string}} Fuel property object.
   */
  getFuel(fuelType) {
    return this.fuels[fuelType] || this.fuels['charcoal-briquette'];
  }
}

module.exports = FuelDatabase;
