import Highcharts from 'highcharts';
import 'highcharts/highcharts-more';
import 'highcharts/modules/exporting';
import 'highcharts/modules/export-data';
import 'highcharts/modules/offline-exporting';
import 'highcharts/modules/accessibility';
import { CHART_THEME } from './chart.theme';

Highcharts.setOptions({
  colors: [...CHART_THEME.colors],
  credits: { enabled: false },
  lang: { thousandsSep: ' ' },
  chart: {
    style: { fontFamily: CHART_THEME.fontFamily },
    zooming: { type: 'x' },
  },
  title: { text: undefined },
  exporting: {
    fallbackToExportServer: false,
    buttons: {
      contextButton: {
        menuItems: ['viewFullscreen', 'separator', 'downloadPNG', 'downloadSVG', 'separator', 'downloadCSV'],
      },
    },
  },
  legend: { itemStyle: { fontWeight: 'normal' } },
});

export default Highcharts;
