import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

const ICONS_DIR = path.join(process.cwd(), 'public', 'icons');
const BINANCE_FUTURES_API = 'https://fapi.binance.com/fapi/v1/exchangeInfo';

// 圖標來源（按優先順序）
const ICON_SOURCES = [
  {
    name: 'Binance CDN',
    getUrl: (symbol: string) => `https://bin.bnbstatic.com/image/admin_mgs_image_upload/20201110/${symbol}.png`
  },
  {
    name: 'Binance Icons GitHub',
    getUrl: (symbol: string) => `https://raw.githubusercontent.com/VadimMalykhin/binance-icons/master/crypto/${symbol.toLowerCase()}.svg`
  },
  {
    name: 'CoinCap',
    getUrl: (symbol: string) => `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`
  }
];

// 確保目錄存在
function ensureDirectoryExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 下載文件
function downloadFile(url: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      } else {
        file.close();
        fs.unlinkSync(dest);
        resolve(false);
      }
    }).on('error', () => {
      file.close();
      if (fs.existsSync(dest)) {
        fs.unlinkSync(dest);
      }
      resolve(false);
    });
  });
}

// 嘗試從多個來源下載圖標
async function downloadIcon(symbol: string): Promise<{ success: boolean; source?: string }> {
  const symbolUpper = symbol.toUpperCase();
  
  for (const source of ICON_SOURCES) {
    const url = source.getUrl(symbolUpper);
    const ext = url.endsWith('.svg') ? 'svg' : 'png';
    const dest = path.join(ICONS_DIR, `${symbolUpper}.${ext}`);
    
    // 如果文件已存在，跳過
    if (fs.existsSync(dest)) {
      return { success: true, source: 'cached' };
    }
    
    const success = await downloadFile(url, dest);
    
    if (success) {
      return { success: true, source: source.name };
    }
  }
  
  return { success: false };
}

// 獲取所有幣安永續合約交易對
async function getAllSymbols(): Promise<string[]> {
  try {
    const response = await fetch(BINANCE_FUTURES_API);
    const data = await response.json();
    
    const symbols = data.symbols
      .filter((s: any) => 
        s.contractType === 'PERPETUAL' && 
        s.status === 'TRADING' && 
        s.symbol.endsWith('USDT')
      )
      .map((s: any) => s.baseAsset as string);
    
    return [...new Set(symbols)] as string[];
  } catch (error) {
    throw new Error('Failed to fetch symbols from Binance');
  }
}

// API 路由
export async function POST(request: Request) {
  try {
    const { force } = await request.json().catch(() => ({ force: false }));
    
    console.log('開始同步圖標...', force ? '(強制更新)' : '');
    
    // 確保目錄存在
    ensureDirectoryExists(ICONS_DIR);
    
    // 獲取所有交易對
    const symbols = await getAllSymbols();
    console.log(`找到 ${symbols.length} 個交易對`);
    
    // 如果強制更新，清空現有圖標
    if (force && fs.existsSync(ICONS_DIR)) {
      const files = fs.readdirSync(ICONS_DIR);
      files.forEach(file => {
        fs.unlinkSync(path.join(ICONS_DIR, file));
      });
      console.log('已清空現有圖標');
    }
    
    // 下載圖標
    const results = {
      total: symbols.length,
      success: 0,
      cached: 0,
      failed: 0,
      failedSymbols: [] as string[]
    };
    
    for (const symbol of symbols) {
      const result = await downloadIcon(symbol);
      
      if (result.success) {
        if (result.source === 'cached') {
          results.cached++;
        } else {
          results.success++;
        }
      } else {
        results.failed++;
        results.failedSymbols.push(symbol);
      }
    }
    
    console.log('同步完成:', results);
    
    return NextResponse.json({
      message: '圖標同步完成',
      ...results
    });
  } catch (error) {
    console.error('圖標同步失敗:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '圖標同步失敗' },
      { status: 500 }
    );
  }
}

// GET 請求查看同步狀態
export async function GET() {
  try {
    ensureDirectoryExists(ICONS_DIR);
    
    const files = fs.existsSync(ICONS_DIR) ? fs.readdirSync(ICONS_DIR) : [];
    const symbols = await getAllSymbols();
    
    return NextResponse.json({
      totalSymbols: symbols.length,
      cachedIcons: files.length,
      coverage: `${((files.length / symbols.length) * 100).toFixed(2)}%`,
      icons: files
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
