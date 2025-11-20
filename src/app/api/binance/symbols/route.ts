import { NextResponse } from 'next/server';
import { apiCache } from '@/lib/cache';

const SYMBOLS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').toLowerCase().trim();

  const cacheKey = `binance:symbols:${q}`;
  const cached = apiCache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    // 獲取 USDT-M 永續合約交易對資訊
    const infoResponse = await fetch('https://fapi.binance.com/fapi/v1/exchangeInfo');
    if (!infoResponse.ok) {
      throw new Error('Failed to fetch Binance futures exchange info');
    }
    const infoData = await infoResponse.json();
    
    // 獲取 24 小時合約交易量資訊
    const tickerResponse = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr');
    if (!tickerResponse.ok) {
      throw new Error('Failed to fetch Binance futures ticker data');
    }
    const tickerData = await tickerResponse.json();
    
    // 建立交易量和價格變化對照表
    const tickerMap = new Map();
    tickerData.forEach((ticker: any) => {
      tickerMap.set(ticker.symbol, {
        volume: parseFloat(ticker.quoteVolume),
        priceChangePercent: parseFloat(ticker.priceChangePercent),
      });
    });
    
    // 只取 USDT 永續合約，並過濾掉特殊交易對
    const usdtPairs = infoData.symbols
      .filter((symbol: any) => {
        return symbol.symbol.endsWith('USDT') && 
               symbol.contractType === 'PERPETUAL' &&
               symbol.status === 'TRADING' &&
               !symbol.baseAsset.includes('_');
      })
      .map((symbol: any) => {
        const baseAsset = symbol.baseAsset || symbol.symbol.replace('USDT', '');
        const tickerInfo = tickerMap.get(symbol.symbol);
        return {
          value: symbol.symbol,           // BTCUSDT
          label: baseAsset,                // BTC
          symbol: baseAsset,               // BTC (用於價格查詢)
          slug: symbol.symbol,             // BTCUSDT (用於圖表)
          id: symbol.symbol,               // BTCUSDT
          volume: tickerInfo?.volume || 0,
          priceChangePercent: tickerInfo?.priceChangePercent || 0, // 24小時漲跌幅
        };
      })
      // 按 24 小時成交量（USDT）排序，從高到低
      .sort((a: any, b: any) => b.volume - a.volume);

    // 如果有搜尋關鍵字，進行過濾
    let filteredPairs = usdtPairs;
    if (q) {
      filteredPairs = usdtPairs.filter((pair: any) => 
        pair.symbol.toLowerCase().includes(q)
      );
    }

    // 如果搜尋結果太少，增加返回數量到 100，否則返回 50
    const limit = q ? 100 : 50;
    const result = filteredPairs.slice(0, limit);

    apiCache.set(cacheKey, result, SYMBOLS_CACHE_TTL);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching Binance symbols:', error);
    return NextResponse.json(
      { error: 'Failed to fetch symbols' },
      { status: 500 }
    );
  }
}
