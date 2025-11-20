import { NextResponse } from 'next/server';
import ccxt from 'ccxt';
import { apiCache } from '@/lib/cache';

const CHART_CACHE_TTL = 30 * 1000; // 30s

function normalizeSymbolForCcxt(sym: string) {
  // Accept BTCUSDT, BTC/USDT or BTC-USD etc. Convert to 'BASE/QUOTE'
  if (sym.includes('/')) return sym;
  if (sym.includes('-')) return sym.replace('-', '/');
  // Split into base/quote by heuristics: try common stablecoins
  const knownQuotes = ['USDT', 'BTC', 'ETH', 'USD', 'USDC', 'BUSD'];
  for (const q of knownQuotes) {
    if (sym.toUpperCase().endsWith(q)) {
      const base = sym.slice(0, sym.length - q.length);
      return `${base}/${q}`;
    }
  }
  // Fallback: insert slash in middle
  const mid = Math.floor(sym.length / 2);
  return `${sym.slice(0, mid)}/${sym.slice(mid)}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const exchangeParam = (searchParams.get('exchange') || searchParams.get('exchangeId') || 'binance').toLowerCase();
  const symbolParam = searchParams.get('symbol') || 'BTC/USDT';
  const interval = searchParams.get('interval') || '1h';
  const limit = Number(searchParams.get('limit') || '500');

  const cacheKey = `tvbars:${exchangeParam}:${symbolParam}:${interval}:${limit}`;
  const cached = apiCache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    // Build ccxt symbol
  const normalized = normalizeSymbolForCcxt(symbolParam);
  // Ensure symbol is in CCXT format (BASE/QUOTE)
  const ccxtSymbol = normalized.includes('/') ? normalized : normalized.replace('-', '/');

    // Dynamically instantiate exchange class
    // ccxt exports classes named like 'binance', 'coinbase', etc.
    // Use (ccxt as any)[exchangeId]
    const ExchangeClass = (ccxt as any)[exchangeParam];
    if (!ExchangeClass) {
      return NextResponse.json({ error: `Unsupported exchange: ${exchangeParam}` }, { status: 400 });
    }
    const exchange = new ExchangeClass({ enableRateLimit: true });
    // Some exchanges require setting fetchOHLCV timeframe support check
    if (!exchange.has || exchange.has['fetchOHLCV'] === false) {
      return NextResponse.json({ error: `Exchange ${exchangeParam} does not support fetchOHLCV` }, { status: 400 });
    }

    // Map common interval names to ccxt timeframes (they are usually the same)
    const timeframe = interval;

    // fetchOHLCV expects symbol like 'BTC/USDT'
  const ohlcv = await exchange.fetchOHLCV(ccxtSymbol, timeframe, undefined, limit);

    // Map to TradingView style bars (time in seconds)
    const bars = ohlcv.map((c: any[]) => ({
      time: Math.floor(c[0] / 1000),
      open: c[1],
      high: c[2],
      low: c[3],
      close: c[4],
      volume: c[5]
    }));

    apiCache.set(cacheKey, bars, CHART_CACHE_TTL);
    return NextResponse.json(bars);
  } catch (err: any) {
    console.error('Error in tradingview bars API:', err && err.message ? err.message : err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch bars' }, { status: 500 });
  }
}
