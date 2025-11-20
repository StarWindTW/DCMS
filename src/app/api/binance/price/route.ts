import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  console.log('=== Price API Called ===');
  console.log('Raw symbol parameter:', JSON.stringify(symbol));
  console.log('Symbol type:', typeof symbol);
  console.log('Symbol length:', symbol?.length);
  console.log('Request URL:', request.url);

  if (!symbol || symbol.trim().length === 0) {
    console.error('❌ Empty or invalid symbol provided');
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    // 構建交易對符號
    const tradingPair = symbol.toUpperCase().endsWith('USDT') 
      ? symbol.toUpperCase() 
      : `${symbol.toUpperCase()}USDT`;

    console.log('✅ Trading pair:', tradingPair);

    // 獲取幣安 USDT-M 永續合約價格
    const response = await fetch(
      `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${tradingPair}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Binance API error:', errorText);
      throw new Error(`Failed to fetch price: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      symbol: data.symbol,
      price: parseFloat(data.price),
    });
  } catch (error) {
    console.error('Error fetching Binance Futures price:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch price' },
      { status: 500 }
    );
  }
}
