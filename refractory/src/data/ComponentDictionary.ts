/**
 * Component Dictionary
 * Factory pattern for creating predefined components
 */

import { Component } from '../models/Component';
import { IComponent } from '../types';

export class ComponentDictionary {
  private static instance: ComponentDictionary;
  private components: Map<string, Map<string, IComponent>>;

  private constructor() {
    this.components = new Map();
    this.initializeComponents();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ComponentDictionary {
    if (!ComponentDictionary.instance) {
      ComponentDictionary.instance = new ComponentDictionary();
    }
    return ComponentDictionary.instance;
  }

  /**
   * Initialize predefined components
   */
  private initializeComponents(): void {
    // Chamotte components
    this.components.set('chamotte', new Map([
      ['typical', {
        name: 'Chamotte (typical)',
        description: 'Fired clay aggregate, aluminosilicate-based',
        composition: {
          Al2O3: 45.0,
          SiO2: 48.0,
          CaO: 1.5,
          Fe2O3: 3.5,
          MgO: 0.8,
          TiO2: 1.2
        },
        fractions: [
          { lowerSize: 3.0, upperSize: 6.0, amount: 30.0 },
          { lowerSize: 1.0, upperSize: 3.0, amount: 35.0 },
          { lowerSize: 0.1, upperSize: 1.0, amount: 25.0 },
          { lowerSize: 0.037, upperSize: 0.1, amount: 10.0 }
        ]
      }],
      ['coarse', {
        name: 'Chamotte (coarse)',
        composition: {
          Al2O3: 45.0,
          SiO2: 48.0,
          CaO: 1.5,
          Fe2O3: 3.5,
          MgO: 0.8,
          TiO2: 1.2
        },
        fractions: [
          { lowerSize: 6.0, upperSize: 10.0, amount: 100.0 }
        ]
      }],
      ['fine', {
        name: 'Chamotte (fine)',
        composition: {
          Al2O3: 45.0,
          SiO2: 48.0,
          CaO: 1.5,
          Fe2O3: 3.5,
          MgO: 0.8,
          TiO2: 1.2
        },
        fractions: [
          { lowerSize: 0.037, upperSize: 0.6, amount: 100.0 }
        ]
      }]
    ]));

    // Alumina components
    this.components.set('alumina', new Map([
      ['tabular', {
        name: 'Tabular Alumina',
        description: 'High-purity sintered alumina',
        composition: {
          Al2O3: 99.5,
          SiO2: 0.1,
          CaO: 0.1,
          Fe2O3: 0.1,
          Na2O: 0.2
        },
        fractions: [
          { lowerSize: 1.0, upperSize: 3.0, amount: 100.0 }
        ]
      }],
      ['calcined', {
        name: 'Calcined Alumina',
        composition: {
          Al2O3: 99.0,
          SiO2: 0.3,
          CaO: 0.2,
          Fe2O3: 0.2,
          Na2O: 0.3
        },
        fractions: [
          { lowerSize: 0.1, upperSize: 1.0, amount: 60.0 },
          { lowerSize: 0.01, upperSize: 0.1, amount: 40.0 }
        ]
      }],
      ['fine', {
        name: 'Fine Alumina Powder',
        composition: {
          Al2O3: 99.8,
          SiO2: 0.05,
          CaO: 0.05,
          Fe2O3: 0.05,
          Na2O: 0.05
        },
        fractions: [
          { lowerSize: 0.001, upperSize: 0.01, amount: 100.0 }
        ]
      }]
    ]));

    // Silicon Carbide
    this.components.set('sic', new Map([
      ['typical', {
        name: 'Silicon Carbide',
        description: 'Non-oxide refractory with high thermal conductivity',
        composition: {
          SiO2: 5.0,  // Surface oxidation
          Al2O3: 1.0,
          Fe2O3: 1.0
        },
        fractions: [
          { lowerSize: 0.5, upperSize: 2.0, amount: 70.0 },
          { lowerSize: 0.1, upperSize: 0.5, amount: 30.0 }
        ]
      }]
    ]));

    // Calcium Aluminate Cement (Ciment Fondu)
    this.components.set('ciment_fondu', new Map([
      ['typical', {
        name: 'Ciment Fondu (CAC)',
        description: 'Calcium aluminate cement',
        composition: {
          Al2O3: 40.0,
          CaO: 38.0,
          SiO2: 15.0,
          Fe2O3: 5.0,
          MgO: 1.0,
          TiO2: 1.0
        },
        fractions: [
          { lowerSize: 0.01, upperSize: 0.1, amount: 100.0 }
        ]
      }]
    ]));

    // Portland Cement
    this.components.set('portland_cement', new Map([
      ['ordinary', {
        name: 'Ordinary Portland Cement (OPC)',
        description: 'Type I/II Portland cement',
        composition: {
          CaO: 63.0,
          SiO2: 20.0,
          Al2O3: 6.0,
          Fe2O3: 3.0,
          MgO: 2.5,
          SO3: 2.5,
          K2O: 1.0,
          Na2O: 0.5,
          LOI: 1.5
        },
        fractions: [
          { lowerSize: 0.001, upperSize: 0.1, amount: 100.0 }
        ]
      }],
      ['high_early', {
        name: 'High Early Strength Portland Cement',
        description: 'Type III Portland cement',
        composition: {
          CaO: 65.0,
          SiO2: 21.0,
          Al2O3: 5.5,
          Fe2O3: 2.5,
          MgO: 2.0,
          SO3: 3.0,
          K2O: 0.5,
          Na2O: 0.3,
          LOI: 0.2
        },
        fractions: [
          { lowerSize: 0.001, upperSize: 0.045, amount: 100.0 }
        ]
      }],
      ['sulfate_resistant', {
        name: 'Sulfate Resistant Portland Cement',
        description: 'Type V Portland cement',
        composition: {
          CaO: 64.0,
          SiO2: 24.0,
          Al2O3: 3.5,
          Fe2O3: 4.5,
          MgO: 1.5,
          SO3: 2.0,
          K2O: 0.3,
          Na2O: 0.2,
          LOI: 0.5
        },
        fractions: [
          { lowerSize: 0.001, upperSize: 0.1, amount: 100.0 }
        ]
      }]
    ]));

    // High Alumina Cement
    this.components.set('high_alumina_cement', new Map([
      ['70', {
        name: 'High Alumina Cement (70% Al₂O₃)',
        composition: {
          Al2O3: 70.0,
          CaO: 26.0,
          SiO2: 2.0,
          Fe2O3: 1.5,
          MgO: 0.5
        },
        fractions: [
          { lowerSize: 0.01, upperSize: 0.1, amount: 100.0 }
        ]
      }],
      ['80', {
        name: 'High Alumina Cement (80% Al₂O₃)',
        composition: {
          Al2O3: 80.0,
          CaO: 17.0,
          SiO2: 1.5,
          Fe2O3: 1.0,
          MgO: 0.5
        },
        fractions: [
          { lowerSize: 0.01, upperSize: 0.1, amount: 100.0 }
        ]
      }]
    ]));

    // Metakaolin
    this.components.set('metakaolin', new Map([
      ['typical', {
        name: 'Metakaolin',
        description: 'Calcined kaolin clay',
        composition: {
          Al2O3: 40.0,
          SiO2: 55.0,
          Fe2O3: 2.0,
          TiO2: 2.0,
          K2O: 0.5,
          Na2O: 0.5
        },
        fractions: [
          { lowerSize: 0.001, upperSize: 0.01, amount: 100.0 }
        ]
      }]
    ]));

    // Microsilica
    this.components.set('microsilica', new Map([
      ['typical', {
        name: 'Microsilica',
        description: 'Amorphous silica fume',
        composition: {
          SiO2: 96.0,
          Al2O3: 1.0,
          CaO: 1.0,
          Fe2O3: 1.0,
          K2O: 0.5,
          Na2O: 0.5
        },
        fractions: [
          { lowerSize: 0.0001, upperSize: 0.001, amount: 100.0 }
        ]
      }]
    ]));

    // Magnesia (MgO)
    this.components.set('magnesia', new Map([
      ['fused', {
        name: 'Fused Magnesia',
        description: 'Electro-fused magnesia (periclase)',
        composition: {
          MgO: 98.0,
          CaO: 1.0,
          SiO2: 0.5,
          Fe2O3: 0.3,
          Al2O3: 0.2
        },
        fractions: [
          { lowerSize: 1.0, upperSize: 3.0, amount: 100.0 }
        ]
      }],
      ['sintered', {
        name: 'Sintered Magnesia',
        description: 'Dead-burned magnesia',
        composition: {
          MgO: 96.5,
          CaO: 1.5,
          SiO2: 1.0,
          Fe2O3: 0.5,
          Al2O3: 0.5
        },
        fractions: [
          { lowerSize: 0.5, upperSize: 2.0, amount: 100.0 }
        ]
      }],
      ['caustic', {
        name: 'Caustic Magnesia',
        description: 'Light-burned magnesia',
        composition: {
          MgO: 93.0,
          CaO: 2.0,
          SiO2: 2.5,
          Fe2O3: 1.5,
          Al2O3: 1.0
        },
        fractions: [
          { lowerSize: 0.001, upperSize: 0.1, amount: 100.0 }
        ]
      }]
    ]));

    // Talc
    this.components.set('talc', new Map([
      ['typical', {
        name: 'Talc',
        description: 'Hydrated magnesium silicate (3MgO·4SiO2·H2O)',
        composition: {
          MgO: 31.7,
          SiO2: 63.5,
          CaO: 1.0,
          Fe2O3: 1.5,
          Al2O3: 1.3,
          H2O: 1.0  // Combined water
        },
        fractions: [
          { lowerSize: 0.001, upperSize: 0.045, amount: 100.0 }
        ]
      }],
      ['coarse', {
        name: 'Talc (coarse)',
        composition: {
          MgO: 31.7,
          SiO2: 63.5,
          CaO: 1.0,
          Fe2O3: 1.5,
          Al2O3: 1.3,
          H2O: 1.0
        },
        fractions: [
          { lowerSize: 0.1, upperSize: 1.0, amount: 100.0 }
        ]
      }]
    ]));

    // Quartz
    this.components.set('quartz', new Map([
      ['typical', {
        name: 'Quartz Sand',
        description: 'High-purity crystalline silica',
        composition: {
          SiO2: 99.5,
          Al2O3: 0.2,
          Fe2O3: 0.1,
          TiO2: 0.1,
          CaO: 0.05,
          MgO: 0.05
        },
        fractions: [
          { lowerSize: 0.1, upperSize: 0.6, amount: 100.0 }
        ]
      }],
      ['coarse', {
        name: 'Coarse Quartz',
        composition: {
          SiO2: 99.5,
          Al2O3: 0.2,
          Fe2O3: 0.1,
          TiO2: 0.1,
          CaO: 0.05,
          MgO: 0.05
        },
        fractions: [
          { lowerSize: 1.0, upperSize: 3.0, amount: 100.0 }
        ]
      }],
      ['fine', {
        name: 'Fine Quartz Powder',
        composition: {
          SiO2: 99.7,
          Al2O3: 0.1,
          Fe2O3: 0.05,
          TiO2: 0.05,
          CaO: 0.05,
          MgO: 0.05
        },
        fractions: [
          { lowerSize: 0.001, upperSize: 0.045, amount: 100.0 }
        ]
      }]
    ]));
  }

  /**
   * Get component by category and variant
   */
  public getComponent(category: string, variant: string): Component | null {
    const categoryMap = this.components.get(category);
    if (!categoryMap) return null;

    const componentData = categoryMap.get(variant);
    if (!componentData) return null;

    return Component.fromObject(componentData);
  }

  /**
   * List all categories
   */
  public listCategories(): string[] {
    return Array.from(this.components.keys());
  }

  /**
   * List variants for a category
   */
  public listVariants(category: string): string[] {
    const categoryMap = this.components.get(category);
    if (!categoryMap) return [];
    return Array.from(categoryMap.keys());
  }

  /**
   * Get all components in a category
   */
  public getCategoryComponents(category: string): Component[] {
    const categoryMap = this.components.get(category);
    if (!categoryMap) return [];

    const components: Component[] = [];
    for (const componentData of categoryMap.values()) {
      components.push(Component.fromObject(componentData));
    }
    return components;
  }

  /**
   * List all available components
   */
  public listAllComponents(): Array<{ category: string; variant: string; name: string }> {
    const list: Array<{ category: string; variant: string; name: string }> = [];

    for (const [category, categoryMap] of this.components.entries()) {
      for (const [variant, component] of categoryMap.entries()) {
        list.push({ category, variant, name: component.name });
      }
    }

    return list;
  }
}

