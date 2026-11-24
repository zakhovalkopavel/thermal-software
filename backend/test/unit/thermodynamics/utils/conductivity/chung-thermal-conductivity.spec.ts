import { ChungThermalConductivity } from '../../../../../src/modules/thermodynamics/utils/conductivity/chung-thermal-conductivity';

describe('ChungThermalConductivity', () => {
  it('matches chemicals.Chung_dense reference example (propylene-like)', () => {
    // chemicals.thermal_conductivity.Chung_dense example
    const T = 473;
    const MW_g = 42.081;
    const Tc = 364.9;
    const Vc = 184.6e-6;
    const omega = 0.142;
    const Cvm = 82.67;
    const Vm = 172.1e-6;
    const mu = 134e-7;
    const dipole = 0.4;

    const mix = {
      Tc,
      Vc,
      omega,
      mur: 131.3 * dipole * Math.pow(Vc * 1e6 * Tc, -0.5),
      M: MW_g / 1000,
      kappa: 0,
    };
    const lambda = ChungThermalConductivity.conductivity(T, mix, mu, Cvm, Vm);
    expect(lambda).toBeCloseTo(0.06160569232570781, 12);
  });

  it('y → 0 shrinks dense-gas correction relative to a denser state', () => {
    const mix = {
      Tc: 126.2,
      Vc: 8.921e-5,
      omega: 0.0377,
      mur: 0,
      M: 0.0280134,
      kappa: 0,
    };
    const T = 300;
    const eta0 = 1.8e-5;
    const Cv = 20.8;
    const V_atm = ChungThermalConductivity.idealGasMolarVolume(T, 101_325);
    const V_dense = ChungThermalConductivity.idealGasMolarVolume(T, 5e6);
    const yAtm = ChungThermalConductivity.densityParameterY(mix.Vc, V_atm);
    const yDense = ChungThermalConductivity.densityParameterY(mix.Vc, V_dense);
    expect(yAtm).toBeLessThan(0.01);
    expect(yDense).toBeGreaterThan(0.01);

    const lamAtm = ChungThermalConductivity.conductivity(T, mix, eta0, Cv, V_atm);
    const lamDense = ChungThermalConductivity.conductivity(T, mix, eta0, Cv, V_dense);
    expect(lamDense).toBeGreaterThan(lamAtm);
    expect(lamAtm).toBeGreaterThan(0.01);
    expect(lamAtm).toBeLessThan(0.05);
  });

  it('mixParameters for pure species recovers Tc and Vc', () => {
    const params = ChungThermalConductivity.mixParameters([{
      y: 1,
      M: 0.0280134,
      Tc: 126.2,
      Vc: 8.921e-5,
      omega: 0.0377,
      dipole_D: 0,
    }]);
    expect(params.Tc).toBeCloseTo(126.2, 6);
    expect(params.Vc).toBeCloseTo(8.921e-5, 10);
    expect(params.omega).toBeCloseTo(0.0377, 6);
  });

  it('dipoleToDebye converts SI dipole', () => {
    const D = ChungThermalConductivity.dipoleToDebye(6.170934e-30);
    expect(D).toBeCloseTo(1.85, 2);
  });
});
