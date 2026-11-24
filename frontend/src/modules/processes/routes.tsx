import type { RouteObject } from 'react-router-dom';
import { ComingSoon } from '@/shared/ui/feedback/ComingSoon';
import { RouteErrorBoundary } from '@/shared/ui/feedback/RouteErrorBoundary';
import { RouteFallback } from '@/shared/ui/feedback/RouteFallback';
import { PROCESSES_SECTIONS } from './constants/processes-sections.constants';
import { ProcessesHub } from './components/ProcessesHub';
import { ProcessesLayout } from './components/ProcessesLayout';

const SECTION_LOADERS: Partial<Record<(typeof PROCESSES_SECTIONS)[number]['route'], RouteObject['lazy']>> = {
  combustion: () =>
    import('./sections/combustion/CombustionSection').then((module) => ({ Component: module.CombustionSection })),
  'multilayer-wall': () =>
    import('./sections/multilayer-wall/MultilayerWallSection').then((module) => ({
      Component: module.MultilayerWallSection,
    })),
  htc: () => import('./sections/htc/HtcSection').then((module) => ({ Component: module.HtcSection })),
  recuperator: () =>
    import('./sections/recuperator/RecuperatorSection').then((module) => ({ Component: module.RecuperatorSection })),
  'thermal-distribution': () =>
    import('./sections/thermal-distribution/ThermalDistributionSection').then((module) => ({
      Component: module.ThermalDistributionSection,
    })),
};

export const processesRoutes: RouteObject[] = [
  {
    path: 'processes',
    element: <ProcessesLayout />,
    children: [
      {
        errorElement: <RouteErrorBoundary />,
        hydrateFallbackElement: <RouteFallback />,
        children: [
          { index: true, element: <ProcessesHub /> },
          ...PROCESSES_SECTIONS.map((section): RouteObject => {
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
