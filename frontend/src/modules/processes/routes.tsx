import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { ComingSoon } from '../../components/common/ComingSoon';
import { PROCESSES_SECTIONS } from './constants/processes-sections.constants';
import { ProcessesHub } from './ProcessesHub';
import { ProcessesLayout } from './ProcessesLayout';
import { CombustionSection } from './sections/combustion/CombustionSection';
import { HtcSection } from './sections/htc/HtcSection';
import { MultilayerWallSection } from './sections/multilayer-wall/MultilayerWallSection';
import { RecuperatorSection } from './sections/recuperator/RecuperatorSection';
import { ThermalDistributionSection } from './sections/thermal-distribution/ThermalDistributionSection';

const SECTION_ELEMENTS: Partial<Record<(typeof PROCESSES_SECTIONS)[number]['route'], ReactNode>> = {
  combustion: <CombustionSection />,
  'multilayer-wall': <MultilayerWallSection />,
  htc: <HtcSection />,
  recuperator: <RecuperatorSection />,
  'thermal-distribution': <ThermalDistributionSection />,
};

export const processesRoutes: RouteObject[] = [
  {
    path: 'processes',
    element: <ProcessesLayout />,
    children: [
      { index: true, element: <ProcessesHub /> },
      ...PROCESSES_SECTIONS.map((section) => ({
        path: section.route,
        element: SECTION_ELEMENTS[section.route] ?? <ComingSoon title={section.label} step={section.step} />,
      })),
    ],
  },
];
