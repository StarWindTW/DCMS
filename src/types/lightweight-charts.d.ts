import 'lightweight-charts';

declare module 'lightweight-charts' {
  // Augment IChartApi to include addCandlestickSeries for TS servers using older types
  interface IChartApi {
    addCandlestickSeries(options?: any): any;
  }
}
