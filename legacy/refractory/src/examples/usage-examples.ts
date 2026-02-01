/**
 * Example usage of the Refractory Calculator TypeScript library
 */

import {
  RefractoryCalculatorService,
  ComponentDictionary,
  IComponent
} from '../index';

// Example 1: Simple calculation with predefined components
function example1_SimpleCalculation() {
  console.log('=== Example 1: Simple Calculation ===\n');

  // Get component dictionary
  const dictionary = ComponentDictionary.getInstance();

  // Get components
  const chamotte = dictionary.getComponent('chamotte', 'typical');
  const cement = dictionary.getComponent('ciment_fondu', 'typical');

  if (!chamotte || !cement) {
    console.error('Could not load components');
    return;
  }

  // Set amounts (percentages)
  chamotte.amount = 85;
  cement.amount = 15;

  // Create calculator
  const calculator = new RefractoryCalculatorService();

  // Perform calculation at 1450°C
  const result = calculator.calculate(
    [chamotte.toObject(), cement.toObject()],
    1450
  );

  // Display results
  console.log(`Temperature: 1450°C`);
  console.log(`\nSolid Phase: ${result.solid.percent.toFixed(2)}%`);
  console.log('Composition:', result.solid.composition);
  console.log(`\nLiquid Phase: ${result.liquid.percent.toFixed(2)}%`);
  console.log('Composition:', result.liquid.composition);
  console.log(`Viscosity: ${result.liquid.viscosity?.toFixed(3)} Pa·s`);
  console.log(`\nRefractoriness: ${result.thermalPerformance.refractoriness}°C`);
  console.log(`RUL (0.2 MPa): ${result.thermalPerformance.deformationTemperature_0_2MPa}°C`);
  console.log(`\nWarnings: ${result.diagnostics.warnings.length}`);
  result.diagnostics.warnings.forEach((w: string) => console.log(`  - ${w}`));
}

// Example 2: Custom component
function example2_CustomComponent() {
  console.log('\n=== Example 2: Custom Component ===\n');

  const customComponent: IComponent = {
    name: 'Custom Refractory',
    description: 'High alumina aggregate',
    composition: {
      Al2O3: 85.0,
      SiO2: 10.0,
      CaO: 2.0,
      Fe2O3: 2.0,
      MgO: 1.0
    },
    fractions: [
      { lowerSize: 1.0, upperSize: 3.0, amount: 50.0 },
      { lowerSize: 0.1, upperSize: 1.0, amount: 30.0 },
      { lowerSize: 0.01, upperSize: 0.1, amount: 20.0 }
    ],
    amount: 100
  };

  const calculator = new RefractoryCalculatorService();
  const result = calculator.calculate([customComponent], 1500);

  console.log(`Liquid at 1500°C: ${result.liquid.percent.toFixed(2)}%`);
  console.log(`Solid at 1500°C: ${result.solid.percent.toFixed(2)}%`);
}

// Example 3: Multi-component mixture
function example3_MultiComponent() {
  console.log('\n=== Example 3: Multi-Component Mixture ===\n');

  const dictionary = ComponentDictionary.getInstance();

  const components = [
    { component: dictionary.getComponent('chamotte', 'coarse'), amount: 40 },
    { component: dictionary.getComponent('chamotte', 'fine'), amount: 25 },
    { component: dictionary.getComponent('alumina', 'tabular'), amount: 20 },
    { component: dictionary.getComponent('ciment_fondu', 'typical'), amount: 10 },
    { component: dictionary.getComponent('microsilica', 'typical'), amount: 5 }
  ];

  const mixture = components
    .filter(c => c.component !== null)
    .map(c => {
      c.component!.amount = c.amount;
      return c.component!.toObject();
    });

  const calculator = new RefractoryCalculatorService();

  // Calculate at multiple temperatures
  console.log('Temperature scan:');
  for (let temp = 1300; temp <= 1600; temp += 50) {
    const result = calculator.calculate(mixture, temp);
    console.log(
      `${temp}°C: Liquid=${result.liquid.percent.toFixed(1)}% ` +
      `Solid=${result.solid.percent.toFixed(1)}%`
    );
  }
}

// Example 4: Custom configuration
function example4_CustomConfiguration() {
  console.log('\n=== Example 4: Custom Configuration ===\n');

  const dictionary = ComponentDictionary.getInstance();
  const chamotte = dictionary.getComponent('chamotte', 'typical');

  if (!chamotte) return;

  chamotte.amount = 100;

  // Create calculator with custom config
  const calculator = new RefractoryCalculatorService({
    participation: {
      T50_fine: 1300,      // Lower temperature for fine particles
      T50_medium: 1400,
      T50_coarse: 1550,
      k_steepness: 0.015,   // Steeper participation curve
      coarseDampingSize: 3.0,
      coarseDampingRate: 0.15
    }
  });

  const result = calculator.calculate([chamotte.toObject()], 1450);

  console.log('Using custom participation factors:');
  console.log(`Liquid: ${result.liquid.percent.toFixed(2)}%`);
  console.log(`Solid: ${result.solid.percent.toFixed(2)}%`);
}

// Example 5: List available components
function example5_ListComponents() {
  console.log('\n=== Example 5: Available Components ===\n');

  const dictionary = ComponentDictionary.getInstance();
  const allComponents = dictionary.listAllComponents();

  console.log(`Total components available: ${allComponents.length}\n`);

  const categories = dictionary.listCategories();
  categories.forEach((category: string) => {
    const variants = dictionary.listVariants(category);
    console.log(`${category}: ${variants.join(', ')}`);
  });
}

// Run examples
if (require.main === module) {
  example1_SimpleCalculation();
  example2_CustomComponent();
  example3_MultiComponent();
  example4_CustomConfiguration();
  example5_ListComponents();
}

