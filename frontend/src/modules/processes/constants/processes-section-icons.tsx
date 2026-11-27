import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import LayersIcon from '@mui/icons-material/Layers';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TimelineIcon from '@mui/icons-material/Timeline';
import type { SvgIconComponent } from '@mui/icons-material';
import type { PROCESSES_SECTIONS } from './processes-sections.constants';

type ProcessesRoute = (typeof PROCESSES_SECTIONS)[number]['route'];

export const PROCESSES_SECTION_ICONS: Record<ProcessesRoute, SvgIconComponent> = {
  combustion: LocalFireDepartmentIcon,
  'multilayer-wall': LayersIcon,
  htc: DeviceThermostatIcon,
  recuperator: SwapHorizIcon,
  'thermal-distribution': TimelineIcon,
};
