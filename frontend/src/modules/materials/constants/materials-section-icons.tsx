import AirIcon from '@mui/icons-material/Air';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import CategoryIcon from '@mui/icons-material/Category';
import HardwareIcon from '@mui/icons-material/Hardware';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import type { SvgIconComponent } from '@mui/icons-material';
import type { MATERIALS_SECTIONS } from './materials-sections.constants';

type MaterialsRoute = (typeof MATERIALS_SECTIONS)[number]['route'];

export const MATERIALS_SECTION_ICONS: Record<MaterialsRoute, SvgIconComponent> = {
  metals: HardwareIcon,
  gases: AirIcon,
  refractories: WhatshotIcon,
  'raw-materials': Inventory2Icon,
  glasses: BlurOnIcon,
  'mineral-compositions': CategoryIcon,
};
