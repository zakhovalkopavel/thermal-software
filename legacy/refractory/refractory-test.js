// Test script to run in Docker container
const {
  RefractoryCalculatorService,
  ComponentDictionary
} = require('./dist');

console.log('\n🔥 Refractory Calculator - TypeScript Docker Test\n');
console.log('================================================\n');

try {
  // Get component dictionary
  const dictionary = ComponentDictionary.getInstance();
  console.log('✅ ComponentDictionary initialized');

  // Create calculator
  const calculator = new RefractoryCalculatorService();
  console.log('✅ RefractoryCalculatorService initialized');

  // Get components
  const chamotte = dictionary.getComponent('chamotte', 'typical');
  const cement = dictionary.getComponent('ciment_fondu', 'typical');
  console.log('✅ Components loaded');

  if (!chamotte || !cement) {
    throw new Error('Failed to load components');
  }

  // Set amounts
  chamotte.amount = 85;
  cement.amount = 15;

  console.log('\n📊 Calculation Input:');
  console.log(`   - Chamotte: ${chamotte.amount}%`);
  console.log(`   - Ciment Fondu: ${cement.amount}%`);
  console.log(`   - Temperature: 1450°C`);

  // Perform calculation
  const result = calculator.calculate(
    [chamotte.toObject(), cement.toObject()],
    1450
  );

  console.log('\n📈 Calculation Results:\n');
  console.log(`   Temperature:        1450°C`);
  console.log(`   Liquid Phase:       ${result.liquid.percent.toFixed(2)}%`);
  console.log(`   Solid Phase:        ${result.solid.percent.toFixed(2)}%`);
  console.log(`   Viscosity:          ${result.liquid.viscosity?.toFixed(3)} Pa·s`);
  console.log(`   Refractoriness:     ${result.thermalPerformance.refractoriness}°C`);
  console.log(`   RUL (0.2 MPa):      ${result.thermalPerformance.deformationTemperature_0_2MPa}°C`);

  console.log('\n🧪 Liquid Composition (top oxides):');
  const liquidOxides = Object.entries(result.liquid.composition)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  liquidOxides.forEach(([oxide, percent]) => {
    console.log(`   - ${oxide}: ${percent.toFixed(2)}%`);
  });

  console.log('\n🧱 Solid Composition (top oxides):');
  const solidOxides = Object.entries(result.solid.composition)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  solidOxides.forEach(([oxide, percent]) => {
    console.log(`   - ${oxide}: ${percent.toFixed(2)}%`);
  });

  // Display phase composition at test temperature
  console.log('\n🔬 Phase Composition AT TEST TEMPERATURE (1450°C):');
  console.log('   What phases exist while the sample is at temperature:');
  console.log('');
  console.log(`   🔴 Liquid Phase: ${result.liquid.percent.toFixed(2)}%`);
  console.log(`      - Actually molten, flowing material`);
  console.log(`      - CaO-enriched: ${result.liquid.composition.CaO?.toFixed(2)}%`);
  console.log(`      - Al₂O₃: ${result.liquid.composition.Al2O3?.toFixed(2)}%`);
  console.log(`      - SiO₂: ${result.liquid.composition.SiO2?.toFixed(2)}%`);
  if (result.liquid.viscosity) {
    console.log(`      - Viscosity: ${result.liquid.viscosity.toFixed(3)} Pa·s`);
  }
  console.log('');
  console.log(`   ⚪ Solid Phase: ${result.solid.percent.toFixed(2)}%`);
  console.log(`      - Crystalline minerals (mullite, quartz, etc.)`);
  console.log(`      - Al₂O₃-enriched: ${result.solid.composition.Al2O3?.toFixed(2)}%`);
  console.log(`      - SiO₂: ${result.solid.composition.SiO2?.toFixed(2)}%`);
  console.log(`      - CaO: ${result.solid.composition.CaO?.toFixed(2)}%`);
  console.log(`      - Some amorphous/disordered structure`);

  // Display mineralogy if available
  if (result.solid.mineralogy && result.solid.mineralogy.length > 0) {
    console.log('\n🏺 FINAL MICROSTRUCTURE (After Cooling to Room Temperature):');
    console.log('   Note: This shows phases in the cooled/fired product.');
    console.log('   The liquid at 1450°C transforms into glass during cooling.');
    console.log('');
    result.solid.mineralogy
      .filter(phase => phase.percent > 1)
      .sort((a, b) => b.percent - a.percent)
      .forEach(phase => {
        console.log(`   - ${phase.phase} (${phase.formula}): ${phase.percent.toFixed(1)}%`);
        if (phase.phase === 'Amorphous') {
          if (phase.viscosityPoints) {
            const vp = phase.viscosityPoints;
            console.log(`     Viscosity Fixed Points (ASTM C965):`);
            console.log(`       Melting point: ${vp.melting}°C (η = 1 Pa·s = 10 poise)`);
            console.log(`       Flow point: ${vp.flow}°C (η = 10⁴ Pa·s = 10⁵ poise)`);
            console.log(`       Working point: ${vp.working}°C (η = 10³ Pa·s = 10⁴ poise)`);
            console.log(`       Softening point: ${vp.softening}°C (η = 10^6.6 Pa·s = 10^7.6 poise)`);
            console.log(`       Annealing point: ${vp.annealing}°C (η = 10¹² Pa·s = 10¹³ poise)`);
            console.log(`       Strain point: ${vp.strain}°C (η = 10^13.5 Pa·s = 10^14.5 poise)`);
            console.log(`     Glass transition: ${vp.glassTransitionLow}-${vp.glassTransitionHigh}°C`);
          }
        } else {
          console.log(`     Melting point: ${phase.meltingPoint}°C`);
        }
      });
  }

  if (result.diagnostics.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.diagnostics.warnings.forEach(w => console.log(`   - ${w}`));
  }

  // Display refractoriness standards evaluation
  if (result.refractorinessEvaluation) {
    console.log('\n📏 Refractoriness Standards Evaluation:');
    console.log('\n   EN ISO 1893 (Refractoriness Under Load @ 0.2 MPa):');
    console.log(`     T₀.₅ (0.5% deformation): ${result.refractorinessEvaluation.enISO1893.T05}°C`);
    console.log(`     T₁   (1% deformation):   ${result.refractorinessEvaluation.enISO1893.T1}°C`);
    console.log(`     T₂   (2% deformation):   ${result.refractorinessEvaluation.enISO1893.T2}°C`);

    console.log('\n   ASTM C24/C71:');
    console.log(`     PCE (Pyrometric Cone Equivalent): ${result.refractorinessEvaluation.astmPCE}°C`);

    console.log('\n   GOST 4069-69:');
    console.log(`     Cone Softening Temperature: ${result.refractorinessEvaluation.gostCone}°C`);

    console.log('\n   Models Used:');
    Object.entries(result.refractorinessEvaluation.modelsSummary).forEach(([model, desc]) => {
      console.log(`     ${model}: ${desc}`);
    });
  }

  console.log('\n✅ Test completed successfully!');
  console.log('\n================================================\n');

} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error('\nStack:', error.stack);
  process.exit(1);
}

