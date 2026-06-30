/* CDNグローバルの型隔離。ECharts は <script> 読み込みで window に生える。 */
declare const echarts: any;
interface Window {
  echarts: any;
  /* next-session.html が読むトレーニングカード用データ。src/data.js で window に生やす。 */
  KINTORE_DATA: any;
}
