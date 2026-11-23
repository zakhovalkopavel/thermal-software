import { MineralPhaseService } from '../../../../../src/modules/refractory/services/composition/mineral-phase.service';

describe('MineralPhaseService', () => {
  let service: MineralPhaseService;

  beforeEach(() => {
    service = new MineralPhaseService();
  });

  const phaseNames = (res: Array<{ phase: string }>) => res.map((p) => p.phase);

  describe('identifyPhases — alumina / silica', () => {
    it('returns Mullite for Al2O3/SiO2 ratio in the mullite band', () => {
      const res = service.identifyPhases({ Al2O3: 60, SiO2: 30 }, 1400);
      expect(phaseNames(res)).toContain('Mullite');
      const mullite = res.find((p) => p.phase === 'Mullite')!;
      expect(mullite.percent).toBeGreaterThan(1);
      expect(mullite.formula).toContain('Al');
      expect(mullite.meltingPoint).toBe(1850);
    });

    it('returns Corundum when Al2O3 exceeds 50% with excess over silica', () => {
      const res = service.identifyPhases({ Al2O3: 80, SiO2: 10 }, 1400);
      expect(phaseNames(res)).toContain('Corundum');
    });

    it('returns Quartz for silica-rich low-lime compositions', () => {
      const res = service.identifyPhases({ SiO2: 80, Al2O3: 10, CaO: 2 }, 1000);
      expect(phaseNames(res)).toContain('Quartz');
    });

    it('returns Cristobalite only above its formation temperature', () => {
      const cold = service.identifyPhases({ SiO2: 90, Al2O3: 5 }, 200);
      const hot = service.identifyPhases({ SiO2: 90, Al2O3: 5 }, 1400);
      expect(phaseNames(cold)).not.toContain('Cristobalite');
      expect(phaseNames(hot)).toContain('Cristobalite');
    });

    it('returns Tridymite for very high silica above 867 °C', () => {
      const res = service.identifyPhases({ SiO2: 95, Al2O3: 5 }, 1200);
      expect(phaseNames(res)).toContain('Tridymite');
    });
  });

  describe('identifyPhases — calcium / magnesium', () => {
    it('returns Gehlenite and Anorthite for CAS compositions', () => {
      const res = service.identifyPhases({ CaO: 25, Al2O3: 30, SiO2: 35 }, 1400);
      const names = phaseNames(res);
      expect(names.includes('Gehlenite') || names.includes('Anorthite')).toBe(true);
    });

    it('returns Spinel for MgO–Al2O3 mixes', () => {
      const res = service.identifyPhases({ MgO: 20, Al2O3: 60, SiO2: 5 }, 1400);
      expect(phaseNames(res)).toContain('Spinel');
    });

    it('returns Forsterite for MgO–SiO2 mixes', () => {
      const res = service.identifyPhases({ MgO: 40, SiO2: 30, Al2O3: 5 }, 1400);
      expect(phaseNames(res)).toContain('Forsterite');
    });

    it('returns Periclase for free magnesia', () => {
      const res = service.identifyPhases({ MgO: 90, CaO: 2, SiO2: 2 }, 1400);
      expect(phaseNames(res)).toContain('Periclase');
    });
  });

  describe('identifyPhases — iron / chrome / zirconia / alkali', () => {
    it('returns Magnetite / Wustite for iron oxides', () => {
      const res = service.identifyPhases({ Fe2O3: 20, FeO: 20, Al2O3: 10 }, 1400);
      const names = phaseNames(res);
      expect(names.includes('Magnetite') || names.includes('Wustite')).toBe(true);
    });

    it('returns Chromite when Cr2O3 and iron oxides are present', () => {
      const res = service.identifyPhases({ Cr2O3: 30, FeO: 20, Fe2O3: 10 }, 1400);
      expect(phaseNames(res)).toContain('Chromite');
    });

    it('returns Zirconia for ZrO2-rich solids', () => {
      const res = service.identifyPhases({ ZrO2: 80, Al2O3: 10 }, 1400);
      expect(phaseNames(res)).toContain('Zirconia');
    });

    it('returns Nepheline / β-Alumina for soda–alumina systems', () => {
      const res = service.identifyPhases(
        { Na2O: 10, Al2O3: 60, SiO2: 25 },
        1400,
      );
      const names = phaseNames(res);
      expect(names.includes('Nepheline') || names.includes('β-Alumina')).toBe(true);
    });
  });

  describe('identifyPhases — fallbacks', () => {
    it('returns Mixed solid solution when no oxide rule matches', () => {
      const res = service.identifyPhases({ C: 100 }, 1400);
      expect(res).toHaveLength(1);
      expect(res[0].phase).toContain('Mixed');
      expect(res[0].percent).toBe(100);
    });

    it('defaults temperature to 1400 °C', () => {
      const withDefault = service.identifyPhases({ Al2O3: 60, SiO2: 30 });
      const explicit = service.identifyPhases({ Al2O3: 60, SiO2: 30 }, 1400);
      expect(phaseNames(withDefault)).toEqual(phaseNames(explicit));
    });

    it('each identified phase has formula, percent, meltingPoint, description', () => {
      const res = service.identifyPhases({ Al2O3: 55, SiO2: 30, CaO: 10 }, 1400);
      for (const phase of res) {
        expect(phase.formula).toBeTruthy();
        expect(phase.percent).toBeGreaterThan(0);
        expect(typeof phase.meltingPoint).toBe('number');
        expect(phase.description.length).toBeGreaterThan(0);
      }
    });
  });
});
