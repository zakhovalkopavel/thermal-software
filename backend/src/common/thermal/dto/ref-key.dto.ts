import { RefKey } from '../enum/ref-key.enum';

/**
 * Machine-readable metadata for every reference.
 * Fields match the columns in docs/REFERENCES.md.
 */
export const REFERENCES_META: Record<RefKey, {
  index: number;
  name: string;
  year: string;
  url?: string;
}> = {
  [RefKey.Szargut]:       { index: 1,  name: 'Szargut — Termodynamika Techniczna', year: 'multi' },
  [RefKey.Incropera]:     { index: 2,  name: 'Incropera et al. — Fundamentals of Heat and Mass Transfer 6th ed.', year: '2007', url: 'https://booksite.elsevier.com/9780750683661/Appendix_C.pdf' },
  [RefKey.NBS1955]:       { index: 3,  name: 'Hilsenrath et al. — NBS Tables of Thermal Properties of Gases', year: '1955', url: 'https://www.govinfo.gov/content/pkg/GOVPUB-C13-89baf9f9b4a43e5f25820bd51b0f3f11/pdf/GOVPUB-C13-89baf9f9b4a43e5f25820bd51b0f3f11.pdf' },
  [RefKey.Perry7]:        { index: 4,  name: "Perry's Chemical Engineers' Handbook 7th ed.", year: '1997' },
  [RefKey.Borgnakke]:     { index: 5,  name: 'Borgnakke & Sonntag — Thermodynamic and Transport Properties', year: '1997', url: 'https://engineering.wayne.edu/mechanical/pdfs/thermodynamic-_tables-updated.pdf' },
  [RefKey.Yaws1999]:      { index: 6,  name: 'Yaws — Chemical Properties Handbook', year: '1999' },
  [RefKey.Poling5]:       { index: 7,  name: "Poling, Prausnitz, O'Connell — The Properties of Gases and Liquids 5th ed.", year: '2000' },
  [RefKey.NASA7]:         { index: 8,  name: 'McBride, Zehe, Gordon — NASA TM-2002-211556', year: '2002' },
  [RefKey.Burcat2005]:    { index: 9,  name: 'Burcat & Ruscic — ANL-05/20', year: '2005' },
  [RefKey.Lemmon2004]:    { index: 10, name: 'Lemmon & Jacobsen — Viscosity and Thermal Conductivity for N2, O2, Ar, Air', year: '2004', url: 'https://trc.nist.gov/refprop/FAQ/NAO.PDF' },
  [RefKey.Barreiro2019]:  { index: 11, name: 'Barreiros et al. — Thermal conductivity of gases', year: '2019', url: 'https://www.physchemres.org/article_57774_2e932c91424b9180df6a5d3b309c8720.pdf' },
  [RefKey.Jones2019]:     { index: 12, name: 'Jones, Mason, Williams — Radiant emissivity', year: '2019', url: 'https://eprints.whiterose.ac.uk/133266/7/emissivity%20manuscript%20revision%20%28final%29.pdf' },
  [RefKey.Sheindlin1974]: { index: 13, name: 'Шейндлин А.Е. (ed.) — Излучательные свойства твёрдых материалов. Справочник, Энергия', year: '1974' },
  [RefKey.Bentz07]:       { index: 14, name: 'Bentz & Prasad — Thermal Performance of Fire Resistive Materials', year: '2007', url: 'https://www.researchgate.net/publication/241211063' },
  [RefKey.NIST_Cryo]:     { index: 15, name: 'NIST Cryogenic Materials Properties Database', year: 'ongoing', url: 'https://trc.nist.gov/cryogenics/materials' },
  [RefKey.Perry9]:        { index: 16, name: "Perry's Chemical Engineers' Handbook 9th ed.", year: '2019' },
  [RefKey.DIPPR_Doc]:     { index: 17, name: 'DIPPR Fit Equations — Chemicals library documentation', year: 'ongoing', url: 'https://chemicals.readthedocs.io/chemicals.dippr.html' },
  [RefKey.WolframAlpha]:  { index: 18, name: 'WolframAlpha Online Integral Calculator', year: 'ongoing', url: 'https://www.wolframalpha.com/calculators/integral-calculator/' },
  [RefKey.Asano2006]:     { index: 19, name: 'Asano — Mass Transfer: From Fundamentals to Modern Industrial Applications', year: '2006' },
  [RefKey.White3]:        { index: 20, name: 'White — Viscous Fluid Flow 3rd ed.', year: '2006' },
  [RefKey.Mikheev1977]:   { index: 21, name: 'Михеев М.А., Михеева И.М. — Основы теплопередачи, 2-е изд., Энергия', year: '1977' },
  [RefKey.Whitaker1972]:  { index: 22, name: 'Whitaker S. — Forced Convection Heat Transfer Correlations for Flow in Pipes, Past Flat Plates, Single Cylinders, Single Spheres, and for Flow in Packed Beds and Tube Bundles, AIChE J. 18(2)', year: '1972' },
};

