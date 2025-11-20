import { NextResponse } from 'next/server';
import { apiCache } from '@/lib/cache';

const KLINES_CACHE_TTL = 30 * 1000; // 30 seconds

// 將時間間隔轉換為幣安格式
function convertInterval(interval: string): string {
  const intervalMap: Record<string, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
    '1w': '1w',
  };
  return intervalMap[interval] || '1h';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const interval = searchParams.get('interval') || '1h';
  const limit = searchParams.get('limit') || '500';

  // 驗證 symbol 格式（應該是 USDT 永續合約格式，如 BTCUSDT）
  if (!symbol.endsWith('USDT') && symbol !== 'BTCUSDT') {
    console.error('❌ Invalid symbol format:', symbol);
    return NextResponse.json(
      { 
        error: `Invalid symbol format: "${symbol}". Expected format: BTCUSDT, ETHUSDT, etc.`,
        symbol,
        interval,
        hint: 'Make sure you are passing the trading pair symbol (e.g., BTCUSDT) not the coin name.'
      },
      { status: 400 }
    );
  }

  console.log('Fetching klines for:', { symbol, interval, limit });

  const cacheKey = `binance:klines:${symbol}:${interval}:${limit}`;
  const cached = apiCache.get(cacheKey);
  if (cached) {
    console.log('Returning cached klines');
    return NextResponse.json(cached);
  }

  try {
    const binanceInterval = convertInterval(interval);
    const binanceUrl = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${binanceInterval}&limit=${limit}`;
    
    console.log('Binance API URL:', binanceUrl);
    
    // 獲取幣安 USDT-M 永續合約 K 線數據
    const response = await fetch(binanceUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Binance klines API error:', response.status, errorText);
      throw new Error(`Binance API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      console.error('Invalid klines data:', data);
      throw new Error('Invalid klines data from Binance');
    }

    console.log(`Successfully fetched ${data.length} klines`);
    
    // 轉換為標準格式
    const klines = data.map((k: any) => ({
      time: k[0],                    // 開盤時間
      open: parseFloat(k[1]),        // 開盤價
      high: parseFloat(k[2]),        // 最高價
      low: parseFloat(k[3]),         // 最低價
      close: parseFloat(k[4]),       // 收盤價
      volume: parseFloat(k[5]),      // 成交量
    }));

    apiCache.set(cacheKey, klines, KLINES_CACHE_TTL);
    return NextResponse.json(klines);
  } catch (error) {
    console.error('Error fetching Binance Futures klines:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch klines';
    return NextResponse.json(
      { error: errorMessage, symbol, interval },
      { status: 500 }
    );
  }
}
