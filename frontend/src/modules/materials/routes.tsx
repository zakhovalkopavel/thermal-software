import type { RouteObject } from 'react-router-dom';
import { ComingSoon } from '@/shared/ui/feedback/ComingSoon';
import { RouteErrorBoundary } from '@/shared/ui/feedback/RouteErrorBoundary';
import { RouteFallback } from '@/shared/ui/feedback/RouteFallback';
import { MATERIALS_SECTIONS } from './constants/materials-sections.constants';
import { MaterialsHub } from './components/MaterialsHub';
import { MaterialsLayout } from './components/MaterialsLayout';

const SECTION_LOADERS: Partial<Record<(typeof MATERIALS_SECTIONS)[number]['route'], RouteObject['lazy']>> = {
  metals: () => import('./sections/metals/MetalsSection').then((module) => ({ Component: module.MetalsSection })),
  gases: () => import('./sections/gases/GasesSection').then((module) => ({ Component: module.GasesSection })),
  refractories: () =>
    import('./sections/refractories/RefractoriesSection').then((module) => ({ Component: module.RefractoriesSection })),
  'raw-materials': () =>
    import('./sections/raw-materials/RawMaterialsSection').then((module) => ({ Component: module.RawMaterialsSection })),
  glasses: () => import('./sections/glasses/GlassesSection').then((module) => ({ Component: module.GlassesSection })),
  'mineral-compositions': () =>
    import('./sections/mineral-compositions/MineralCompositionsSection').then((module) => ({
      Component: module.MineralCompositionsSection,
    })),
};

export const materialsRoutes: RouteObject[] = [
  {
    path: 'materials',
    element: <MaterialsLayout />,
    children: [
      {
        errorElement: <RouteErrorBoundary />,
        hydrateFallbackElement: <RouteFallback />,
        children: [
          { index: true, element: <MaterialsHub /> },
          ...MATERIALS_SECTIONS.map((section): RouteObject => {
            const lazy = SECTION_LOADERS[section.route];
            return lazy
              ? { path: section.route, lazy }
              : { path: section.route, element: <ComingSoon title={section.label} step={section.step} /> };
          }),
        ],
      },
    ],
  },
];
