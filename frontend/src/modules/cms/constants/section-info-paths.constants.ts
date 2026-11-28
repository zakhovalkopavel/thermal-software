/** CMS info paths for each calculator surface (in-page SectionIntro). */
export const SECTION_INFO_PATHS = {
  metals: '/info/materials/metals',
  gasesPure: '/info/materials/gases/pure',
  gasesMixture: '/info/materials/gases/mixture',
  otherMaterials: '/info/materials/other-materials',
  refractories: '/info/materials/refractories',
  rawMaterials: '/info/materials/raw-materials',
  glasses: '/info/materials/glasses',
  mineralCompositions: '/info/materials/mineral-compositions',
  combustion: '/info/processes/combustion',
  multilayerWall: '/info/processes/multilayer-wall',
  htc: '/info/processes/htc',
  htcBody: '/info/processes/htc/body',
  recuperator: '/info/processes/recuperator',
  thermalDistribution: '/info/processes/thermal-distribution',
} as const;

export const SECTION_INFO_LIMITS = {
  SHORT_INTRO_CHARS: 300,
  FULL_INFO_PLAIN_CHARS: 2500,
} as const;
