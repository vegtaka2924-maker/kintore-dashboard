/* CDNグローバルの型隔離。ECharts は <script> 読み込みで window に生える。 */
declare const echarts: any;
interface Window { echarts: any; }
