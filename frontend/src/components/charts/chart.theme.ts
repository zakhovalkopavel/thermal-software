import { theme } from '../../app/theme';

export const CHART_THEME = {
  colors: [
    theme.palette.primary.main,
    '#e65100',
    '#2e7d32',
    '#6a1b9a',
    '#c62828',
    '#00838f',
    '#9e9d24',
    '#4e342e',
    '#ad1457',
    '#37474f',
  ],
  fontFamily: String(theme.typography.fontFamily),
  textColor: theme.palette.text.primary,
  mutedColor: theme.palette.text.secondary,
  gridColor: theme.palette.divider,
  bandColor: 'rgba(25, 118, 210, 0.06)',
  warningBandColor: 'rgba(237, 108, 2, 0.10)',
  greyedColor: '#bdbdbd',
  defaultHeight: 360,
  lineWidth: 2,
  emphasisLineWidth: 3.5,
} as const;
