/**
 * Material Library for Polyfractional Blend Design
 *
 * Provides material properties database with true densities, shrinkage coefficients,
 * and sintering parameters.
 *
 * References:
 * - Kingery, W.D. et al. (1976) "Introduction to Ceramics"
 * - Lee, W.E. & Moore, R.E. (1998) "Evolution of in situ refractories"
 * - Banerjee, S. (2004) "Monolithic Refractories: A Comprehensive Handbook"
 *
 * @module MaterialLibrary
 */

import { MaterialEntry } from '../types/blend-types';

export class MaterialLibrary {
  private static instance: MaterialLibrary;
  private materials: Map<string, MaterialEntry>;

  private constructor() {
    this.materials = new Map();
    this.initializeDefaultMaterials();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MaterialLibrary {
    if (!MaterialLibrary.instance) {
      MaterialLibrary.instance = new MaterialLibrary();
    }
    return MaterialLibrary.instance;
  }

  /**
   * Initialize default material entries with literature values
   */
  private initializeDefaultMaterials(): void {
    // Chamotte / Shamotte (fired clay aggregates)
    this.materials.set('chamotte_std', {
      materialId: 'chamotte_std',
      name: 'Chamotte (Standard)',
      rho_true_after_firing_kgm3: 2650,
      chemicalShrinkage_volFrac: 0.002,  // Minimal, already fired
      activationEnergy_Jmol: 450000,  // ~450 kJ/mol
      typicalGrainSize_um: 50,
      meltingPoint_C: 1650,
      sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/chamotte',
      notes: 'Typical aluminosilicate chamotte, 40-50% Al2O3'
    });

    this.materials.set('chamotte_high_al', {
      materialId: 'chamotte_high_al',
      name: 'Chamotte (High Alumina)',
      rho_true_after_firing_kgm3: 2850,
      chemicalShrinkage_volFrac: 0.002,
      activationEnergy_Jmol: 480000,
      typicalGrainSize_um: 45,
      meltingPoint_C: 1720,
      sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/chamotte',
      notes: '60-70% Al2O3, higher refractoriness'
    });

    // Alumina variants
    this.materials.set('alumina_tabular', {
      materialId: 'alumina_tabular',
      name: 'Tabular Alumina',
      rho_true_after_firing_kgm3: 3950,
      chemicalShrinkage_volFrac: 0.001,
      activationEnergy_Jmol: 580000,  // ~580 kJ/mol
      typicalGrainSize_um: 30,
      meltingPoint_C: 2050,
      sourceUrl: 'https://www.almatis.com/products/tabular-alumina',
      notes: '99.5% Al2O3, high purity, low porosity'
    });

    this.materials.set('alumina_calcined', {
      materialId: 'alumina_calcined',
      name: 'Calcined Alumina',
      rho_true_after_firing_kgm3: 3900,
      chemicalShrinkage_volFrac: 0.003,
      activationEnergy_Jmol: 560000,
      typicalGrainSize_um: 20,
      meltingPoint_C: 2050,
      sourceUrl: 'https://www.almatis.com/products/calcined-alumina',
      notes: '99.0-99.8% Al2O3, various grain sizes'
    });

    this.materials.set('alumina_reactive', {
      materialId: 'alumina_reactive',
      name: 'Reactive Alumina',
      rho_true_after_firing_kgm3: 3850,
      chemicalShrinkage_volFrac: 0.015,  // Higher shrinkage due to sintering
      activationEnergy_Jmol: 520000,
      typicalGrainSize_um: 5,
      meltingPoint_C: 2050,
      sourceUrl: 'https://www.sciencedirect.com/topics/chemistry/reactive-alumina',
      notes: 'Fine particle size, high sintering activity'
    });

    // High-alumina cement (CAC)
    this.materials.set('cac_ca70', {
      materialId: 'cac_ca70',
      name: 'Calcium Aluminate Cement (CA-70)',
      rho_true_after_firing_kgm3: 3200,
      chemicalShrinkage_volFrac: 0.12,  // 12% chemical shrinkage (hydration)
      activationEnergy_Jmol: 420000,
      typicalGrainSize_um: 15,
      meltingPoint_C: 1600,
      sourceUrl: 'https://www.sciencedirect.com/science/article/pii/S0008884616303474',
      notes: '70% Al2O3, common in refractory castables'
    });

    this.materials.set('cac_ca80', {
      materialId: 'cac_ca80',
      name: 'Calcium Aluminate Cement (CA-80)',
      rho_true_after_firing_kgm3: 3300,
      chemicalShrinkage_volFrac: 0.11,
      activationEnergy_Jmol: 440000,
      typicalGrainSize_um: 12,
      meltingPoint_C: 1650,
      sourceUrl: 'https://www.sciencedirect.com/science/article/pii/S0008884616303474',
      notes: '80% Al2O3, higher refractoriness'
    });

    // Portland cement
    this.materials.set('cement_pc', {
      materialId: 'cement_pc',
      name: 'Portland Cement',
      rho_true_after_firing_kgm3: 3150,
      chemicalShrinkage_volFrac: 0.064,  // ~6.4% chemical shrinkage
      activationEnergy_Jmol: 380000,
      typicalGrainSize_um: 20,
      meltingPoint_C: 1450,
      sourceUrl: 'https://www.sciencedirect.com/science/article/pii/S0950061814006200',
      notes: 'Ordinary Portland cement, limited refractory use'
    });

    // Silica variants
    this.materials.set('silica_quartz', {
      materialId: 'silica_quartz',
      name: 'Quartz Sand',
      rho_true_after_firing_kgm3: 2650,
      chemicalShrinkage_volFrac: 0.001,
      activationEnergy_Jmol: 500000,
      typicalGrainSize_um: 100,
      meltingPoint_C: 1713,
      sourceUrl: 'https://www.sciencedirect.com/topics/engineering/quartz-sand',
      notes: 'Crystalline SiO2, common aggregate'
    });

    this.materials.set('silica_fused', {
      materialId: 'silica_fused',
      name: 'Fused Silica',
      rho_true_after_firing_kgm3: 2200,
      chemicalShrinkage_volFrac: 0.0,
      activationEnergy_Jmol: 550000,
      typicalGrainSize_um: 50,
      meltingPoint_C: 1713,
      sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/fused-silica',
      notes: 'Amorphous SiO2, low thermal expansion'
    });

    this.materials.set('silica_fume', {
      materialId: 'silica_fume',
      name: 'Silica Fume (Microsilica)',
      rho_true_after_firing_kgm3: 2200,
      chemicalShrinkage_volFrac: 0.008,  // Pozzolanic reaction
      activationEnergy_Jmol: 400000,
      typicalGrainSize_um: 0.15,
      meltingPoint_C: 1713,
      sourceUrl: 'https://www.sciencedirect.com/topics/engineering/silica-fume',
      notes: 'Ultra-fine pozzolanic additive, improves packing'
    });

    // Silicon carbide
    this.materials.set('sic_black', {
      materialId: 'sic_black',
      name: 'Silicon Carbide (Black)',
      rho_true_after_firing_kgm3: 3210,
      chemicalShrinkage_volFrac: 0.0,
      activationEnergy_Jmol: 650000,  // Very high
      typicalGrainSize_um: 80,
      meltingPoint_C: 2730,
      sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/silicon-carbide',
      notes: 'Excellent thermal shock resistance, high thermal conductivity'
    });

    this.materials.set('sic_green', {
      materialId: 'sic_green',
      name: 'Silicon Carbide (Green)',
      rho_true_after_firing_kgm3: 3200,
      chemicalShrinkage_volFrac: 0.0,
      activationEnergy_Jmol: 660000,
      typicalGrainSize_um: 60,
      meltingPoint_C: 2730,
      sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/silicon-carbide',
      notes: 'Higher purity than black SiC'
    });

    // Andalusite
    this.materials.set('andalusite', {
      materialId: 'andalusite',
      name: 'Andalusite',
      rho_true_after_firing_kgm3: 3150,
      chemicalShrinkage_volFrac: 0.005,  // Expands on conversion to mullite
      activationEnergy_Jmol: 490000,
      typicalGrainSize_um: 70,
      meltingPoint_C: 1850,
      sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/andalusite',
      notes: 'Al2SiO5, converts to mullite + silica at high temp'
    });

    // Bauxite
    this.materials.set('bauxite_calcined', {
      materialId: 'bauxite_calcined',
      name: 'Calcined Bauxite',
      rho_true_after_firing_kgm3: 3050,
      chemicalShrinkage_volFrac: 0.003,
      activationEnergy_Jmol: 470000,
      typicalGrainSize_um: 90,
      meltingPoint_C: 1800,
      sourceUrl: 'https://www.sciencedirect.com/topics/earth-and-planetary-sciences/bauxite',
      notes: '80-90% Al2O3, cost-effective aggregate'
    });

    // Mullite
    this.materials.set('mullite', {
      materialId: 'mullite',
      name: 'Mullite',
      rho_true_after_firing_kgm3: 3160,
      chemicalShrinkage_volFrac: 0.002,
      activationEnergy_Jmol: 510000,
      typicalGrainSize_um: 40,
      meltingPoint_C: 1850,
      sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/mullite',
      notes: '3Al2O3·2SiO2, excellent thermal shock resistance'
    });

    // Magnesia
    this.materials.set('magnesia_fused', {
      materialId: 'magnesia_fused',
      name: 'Fused Magnesia',
      rho_true_after_firing_kgm3: 3580,
      chemicalShrinkage_volFrac: 0.001,
      activationEnergy_Jmol: 540000,
      typicalGrainSize_um: 50,
      meltingPoint_C: 2850,
      sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/magnesia',
      notes: 'MgO, basic refractory'
    });

    // Zirconia
    this.materials.set('zirconia_stabilized', {
      materialId: 'zirconia_stabilized',
      name: 'Stabilized Zirconia',
      rho_true_after_firing_kgm3: 5680,
      chemicalShrinkage_volFrac: 0.002,
      activationEnergy_Jmol: 600000,
      typicalGrainSize_um: 35,
      meltingPoint_C: 2715,
      sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/zirconia',
      notes: 'ZrO2 with Y2O3 or CaO stabilizer'
    });

    // Spinel
    this.materials.set('spinel', {
      materialId: 'spinel',
      name: 'Magnesium Aluminate Spinel',
      rho_true_after_firing_kgm3: 3580,
      chemicalShrinkage_volFrac: 0.003,
      activationEnergy_Jmol: 520000,
      typicalGrainSize_um: 30,
      meltingPoint_C: 2135,
      sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/spinel',
      notes: 'MgAl2O4, excellent corrosion resistance'
    });

    // Lightweight aggregates
    this.materials.set('expanded_clay', {
      materialId: 'expanded_clay',
      name: 'Expanded Clay (LECA)',
      rho_true_after_firing_kgm3: 1600,  // Bulk, highly porous
      chemicalShrinkage_volFrac: 0.001,
      activationEnergy_Jmol: 400000,
      typicalGrainSize_um: 200,
      meltingPoint_C: 1450,
      sourceUrl: 'https://www.sciencedirect.com/topics/engineering/expanded-clay',
      notes: 'Lightweight insulating aggregate'
    });

    this.materials.set('perlite', {
      materialId: 'perlite',
      name: 'Expanded Perlite',
      rho_true_after_firing_kgm3: 1100,
      chemicalShrinkage_volFrac: 0.0,
      activationEnergy_Jmol: 420000,
      typicalGrainSize_um: 150,
      meltingPoint_C: 1260,
      sourceUrl: 'https://www.sciencedirect.com/topics/earth-and-planetary-sciences/perlite',
      notes: 'Ultra-lightweight insulating aggregate'
    });
  }

  /**
   * Get material by ID
   */
  public getMaterial(materialId: string): MaterialEntry | undefined {
    return this.materials.get(materialId);
  }

  /**
   * Get all material IDs
   */
  public getAllMaterialIds(): string[] {
    return Array.from(this.materials.keys());
  }

  /**
   * Get all materials
   */
  public getAllMaterials(): MaterialEntry[] {
    return Array.from(this.materials.values());
  }

  /**
   * Get materials by name pattern
   */
  public searchMaterials(query: string): MaterialEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllMaterials().filter(
      m => m.name.toLowerCase().includes(lowerQuery) ||
           m.materialId.toLowerCase().includes(lowerQuery) ||
           (m.notes && m.notes.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Add custom material
   */
  public addMaterial(material: MaterialEntry): void {
    if (this.materials.has(material.materialId)) {
      throw new Error(`Material ${material.materialId} already exists`);
    }
    this.materials.set(material.materialId, material);
  }

  /**
   * Update existing material
   */
  public updateMaterial(materialId: string, updates: Partial<MaterialEntry>): void {
    const existing = this.materials.get(materialId);
    if (!existing) {
      throw new Error(`Material ${materialId} not found`);
    }
    this.materials.set(materialId, { ...existing, ...updates });
  }

  /**
   * Delete material
   */
  public deleteMaterial(materialId: string): boolean {
    return this.materials.delete(materialId);
  }

  /**
   * Get materials suitable for a given temperature range
   */
  public getMaterialsByTemperature(maxTemp_C: number): MaterialEntry[] {
    return this.getAllMaterials().filter(
      m => !m.meltingPoint_C || m.meltingPoint_C > maxTemp_C + 100
    );
  }

  /**
   * Export materials to JSON
   */
  public exportToJSON(): string {
    const materialsObj: { [key: string]: MaterialEntry } = {};
    this.materials.forEach((material, id) => {
      materialsObj[id] = material;
    });
    return JSON.stringify(materialsObj, null, 2);
  }

  /**
   * Import materials from JSON
   */
  public importFromJSON(json: string): void {
    const materialsObj = JSON.parse(json) as { [key: string]: MaterialEntry };
    Object.entries(materialsObj).forEach(([id, material]) => {
      this.materials.set(id, material);
    });
  }

  /**
   * Validate material entry
   */
  public validateMaterial(material: MaterialEntry): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!material.materialId || material.materialId.trim() === '') {
      errors.push('Material ID is required');
    }

    if (!material.name || material.name.trim() === '') {
      errors.push('Material name is required');
    }

    if (!material.rho_true_after_firing_kgm3 || material.rho_true_after_firing_kgm3 <= 0) {
      errors.push('Valid true density is required (> 0)');
    }

    if (material.rho_true_after_firing_kgm3 > 20000) {
      errors.push('True density seems unreasonably high (> 20000 kg/m³)');
    }

    if (material.chemicalShrinkage_volFrac !== undefined &&
        (material.chemicalShrinkage_volFrac < -0.1 || material.chemicalShrinkage_volFrac > 0.3)) {
      errors.push('Chemical shrinkage should be between -10% and 30%');
    }

    if (material.activationEnergy_Jmol !== undefined && material.activationEnergy_Jmol <= 0) {
      errors.push('Activation energy must be positive');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

