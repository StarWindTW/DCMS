'use client';

import { createChart, CandlestickSeries, ColorType, IChartApi, ISeriesApi, LineStyle } from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';
import { Box, Spinner, Center } from '@chakra-ui/react';

interface CryptoChartProps {
  containerHeight?: number | string;
  containerWidth?: number;
  symbol?: string;
  interval?: string | null;
  entryPrice?: number;
  takeProfit?: number;
  stopLoss?: number;
}

export default function CryptoChart({ 
  containerHeight = '100%', 
  containerWidth = 600,
  symbol = 'BTCUSDT',
  interval = '1h',
  entryPrice,
  takeProfit,
  stopLoss,
}: CryptoChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const priceLinesRef = useRef<any[]>([]);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Resize handler
    const handleResize = () => {
      if (chartInstanceRef.current && chartContainerRef.current) {
        chartInstanceRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    };

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerHeight]);

  useEffect(() => {
    const fetchData = async (isUpdate = false) => {
      try {
        if (!isUpdate) {
          setIsLoading(true);
        }
        setError(null);

        // 驗證 symbol 格式
        console.log('🔍 CryptoChart received symbol:', symbol);
        if (!symbol || !symbol.endsWith('USDT')) {
          console.error('❌ Invalid symbol format received:', symbol);
          setError(`無效的交易對格式: ${symbol}`);
          setIsLoading(false);
          return;
        }

        // Fetch K線數據從幣安合約 API
        console.log(isUpdate ? 'Updating chart data...' : 'Fetching chart data for symbol:', symbol, 'interval:', interval);
        const resp = await fetch(`/api/binance/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=500&_t=${Date.now()}`);
        console.log('API response status:', resp.status);
        
        if (!resp.ok) {
          const errorText = await resp.text();
          console.error('API error:', errorText);
          throw new Error('Failed to fetch data');
        }
        
        const data = await resp.json();
        console.log('Received data points:', data.length);

        if (!Array.isArray(data) || data.length === 0) {
          console.warn('Chart data is empty');
          setError('無圖表數據');
          setIsLoading(false);
          return;
        }

        // 轉換幣安數據格式為 lightweight-charts 格式
        const chartData = data.map((item: any) => ({
          time: Math.floor(item.time / 1000) as any, // 毫秒轉秒
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        }));

        // Check if container is ready
        if (!chartContainerRef.current) {
          console.warn('Chart container not ready yet');
          setIsLoading(false);
          return;
        }

        // Create or update chart
        if (!chartInstanceRef.current) {
          console.log('Creating chart with', chartData.length, 'data points');

          const chartOptions = {
            width: chartContainerRef.current.clientWidth || containerWidth,
            height: chartContainerRef.current.clientHeight || (typeof containerHeight === 'number' ? containerHeight : 400),
            layout: {
              textColor: '#333',
              background: { type: ColorType.Solid, color: '#FFFFFF' }
            },
            grid: {
              vertLines: { color: '#E0E0E0' },
              horzLines: { color: '#E0E0E0' },
            },
            timeScale: {
              borderColor: '#D1D1D1',
              timeVisible: true,
              secondsVisible: false,
            },
            localization: {
              timeFormatter: (time: number) => {
                const date = new Date(time * 1000);
                // Convert to UTC+8 (Taipei time)
                const utc8Date = new Date(date.getTime() + (8 * 60 * 60 * 1000));
                const year = utc8Date.getUTCFullYear();
                const month = String(utc8Date.getUTCMonth() + 1).padStart(2, '0');
                const day = String(utc8Date.getUTCDate()).padStart(2, '0');
                const hours = String(utc8Date.getUTCHours()).padStart(2, '0');
                const minutes = String(utc8Date.getUTCMinutes()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}`;
              },
            },
          };
          
          chartInstanceRef.current = createChart(chartContainerRef.current, chartOptions);
          console.log('Chart instance created');
          
          // Add candlestick series
          candlestickSeriesRef.current = chartInstanceRef.current.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
          });
          
          console.log('Candlestick series created successfully');
        }
        
        // Update data
        candlestickSeriesRef.current?.setData(chartData);
        console.log('Data updated successfully');

        // Fit content (only on initial load)
        if (!isUpdate) {
          chartInstanceRef.current?.timeScale().fitContent();
          
          // Set visible range to show recent data
          if (chartData.length > 100) {
            chartInstanceRef.current?.timeScale().setVisibleRange({
              from: chartData[chartData.length - 100].time as any,
              to: chartData[chartData.length - 1].time as any,
            });
          }
        }

        if (!isUpdate) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading chart data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load chart data');
        if (!isUpdate) {
          setIsLoading(false);
        }
      }
    };

    // Initial load
    fetchData(false);

    // Set up auto-refresh every 30 seconds
    updateIntervalRef.current = setInterval(() => {
      fetchData(true);
    }, 30000);

    // Cleanup
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
        candlestickSeriesRef.current = null;
        priceLinesRef.current = [];
      }
    };
  }, [containerHeight, containerWidth, symbol, interval]);

  // Update price lines when trading levels change
  useEffect(() => {
    if (!chartInstanceRef.current || !candlestickSeriesRef.current) return;

    // Remove existing price lines
    priceLinesRef.current.forEach(line => {
      if (line && candlestickSeriesRef.current) {
        candlestickSeriesRef.current.removePriceLine(line);
      }
    });
    priceLinesRef.current = [];

    // Add entry price line
    if (entryPrice && candlestickSeriesRef.current) {
      const line = candlestickSeriesRef.current.createPriceLine({
        price: entryPrice,
        color: '#FFC107',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: '開倉',
      });
      priceLinesRef.current.push(line);
    }

    // Add take profit line
    if (takeProfit && candlestickSeriesRef.current) {
      const line = candlestickSeriesRef.current.createPriceLine({
        price: takeProfit,
        color: '#4CAF50',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: '止盈',
      });
      priceLinesRef.current.push(line);
    }

    // Add stop loss line
    if (stopLoss && candlestickSeriesRef.current) {
      const line = candlestickSeriesRef.current.createPriceLine({
        price: stopLoss,
        color: '#F44336',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: '止損',
      });
      priceLinesRef.current.push(line);
    }
  }, [entryPrice, takeProfit, stopLoss]);

  return (
    <div style={{ position: 'relative', width: '100%', height: containerHeight }}>
      {isLoading && (
        <Center 
          position="absolute" 
          top={0} 
          left={0} 
          width="100%" 
          height="100%" 
          bg="rgba(255, 255, 255, 0.9)"
          zIndex={10}
        >
          <Spinner size="xl" color="blue.500" />
        </Center>
      )}
      {error && (
        <Center 
          position="absolute" 
          top={0} 
          left={0} 
          width="100%" 
          height="100%" 
          bg="rgba(255, 255, 255, 0.9)"
          zIndex={10}
        >
          <Box color="red.500" fontWeight="semibold">{error}</Box>
        </Center>
      )}
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
