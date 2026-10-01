import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { ComingSoon } from '../../components/common/ComingSoon';
import { RouteErrorBoundary } from '@/components/common/RouteErrorBoundary';
import { MATERIALS_SECTIONS } from './constants/materials-sections.constants';
import { MaterialsHub } from './MaterialsHub';
import { MaterialsLayout } from './MaterialsLayout';
import { GasesSection } from './sections/gases/GasesSection';
import { GlassesSection } from './sections/glasses/GlassesSection';
import { MetalsSection } from './sections/metals/MetalsSection';
import { MineralCompositionsSection } from './sections/mineral-compositions/MineralCompositionsSection';
import { RawMaterialsSection } from './sections/raw-materials/RawMaterialsSection';
import { RefractoriesSection } from './sections/refractories/RefractoriesSection';

const SECTION_ELEMENTS: Partial<Record<(typeof MATERIALS_SECTIONS)[number]['route'], ReactNode>> = {
  metals: <MetalsSection />,
  gases: <GasesSection />,
  refractories: <RefractoriesSection />,
  'raw-materials': <RawMaterialsSection />,
  glasses: <GlassesSection />,
  'mineral-compositions': <MineralCompositionsSection />,
};

export const materialsRoutes: RouteObject[] = [
  {
    path: 'materials',
    element: <MaterialsLayout />,
    children: [
      {
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <MaterialsHub /> },
          ...MATERIALS_SECTIONS.map((section) => ({
            path: section.route,
            element: SECTION_ELEMENTS[section.route] ?? <ComingSoon title={section.label} step={section.step} />,
          })),
        ],
      },
    ],
  },
];
