import { NextResponse } from 'next/server';
import ccxt from 'ccxt';
import { apiCache } from '@/lib/cache';

const SYMBOLS_CACHE_TTL = 60 * 1000; // 1 minute

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const exchangeParam = (searchParams.get('exchange') || 'bingx').toLowerCase();
  const q = (searchParams.get('q') || '').toLowerCase();

  const cacheKey = `tv:symbols:${exchangeParam}:${q}`;
  const cached = apiCache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const ExchangeClass = (ccxt as any)[exchangeParam];
    if (!ExchangeClass) return NextResponse.json({ error: `Unsupported exchange: ${exchangeParam}` }, { status: 400 });

    const exchange = new ExchangeClass({ enableRateLimit: true });
    // loadMarkets can be heavy — use fetchMarkets or fetch tickers depending on ccxt build
    if (typeof exchange.loadMarkets === 'function') {
      await exchange.loadMarkets();
    }

    const markets = Object.values(exchange.markets || {});

    const filtered = markets
      .filter((m: any) => m.active !== false)
      .filter((m: any) => {
        if (!q) return true;
        const s = (m.symbol || '').toLowerCase();
        const base = (m.base || '').toLowerCase();
        const quote = (m.quote || '').toLowerCase();
        return s.includes(q) || base.includes(q) || quote.includes(q) || (m.info && JSON.stringify(m.info).toLowerCase().includes(q));
      })
      .slice(0, 100)
      .map((m: any) => ({
        value: m.symbol,
        label: `${m.symbol} (${m.base}/${m.quote})`,
        id: `${exchangeParam.toUpperCase()}:${m.symbol}`,
      }));

    apiCache.set(cacheKey, filtered, SYMBOLS_CACHE_TTL);
    return NextResponse.json(filtered);
  } catch (err: any) {
    console.error('Error fetching symbols:', err?.message || err);
    return NextResponse.json({ error: 'Failed to fetch symbols' }, { status: 500 });
  }
}
