/**
 * 從幣安下載所有加密貨幣圖標
 * 使用方法: node scripts/sync-icons.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ICONS_DIR = path.join(process.cwd(), 'public', 'icons');
const BINANCE_FUTURES_API = 'https://fapi.binance.com/fapi/v1/exchangeInfo';

// 圖標來源（按優先順序）
const ICON_SOURCES = [
  {
    name: 'Binance CDN',
    getUrl: (symbol) => `https://bin.bnbstatic.com/image/admin_mgs_image_upload/20201110/${symbol}.png`
  },
  {
    name: 'Binance Icons GitHub',
    getUrl: (symbol) => `https://raw.githubusercontent.com/VadimMalykhin/binance-icons/master/crypto/${symbol.toLowerCase()}.svg`
  },
  {
    name: 'CoinCap',
    getUrl: (symbol) => `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`
  }
];

// 確保目錄存在
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ 創建目錄: ${dir}`);
  }
}

// 下載文件
function downloadFile(url, dest) {
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
async function downloadIcon(symbol) {
  const symbolUpper = symbol.toUpperCase();
  
  for (const source of ICON_SOURCES) {
    const url = source.getUrl(symbolUpper);
    const ext = url.endsWith('.svg') ? 'svg' : 'png';
    const dest = path.join(ICONS_DIR, `${symbolUpper}.${ext}`);
    
    // 如果文件已存在，跳過
    if (fs.existsSync(dest)) {
      console.log(`⊙ ${symbolUpper}: 已存在`);
      return true;
    }
    
    console.log(`⟳ ${symbolUpper}: 嘗試從 ${source.name}...`);
    const success = await downloadFile(url, dest);
    
    if (success) {
      console.log(`✓ ${symbolUpper}: 成功下載自 ${source.name}`);
      return true;
    }
  }
  
  console.log(`✗ ${symbolUpper}: 所有來源都失敗`);
  return false;
}

// 獲取所有幣安永續合約交易對
async function getAllSymbols() {
  try {
    const response = await fetch(BINANCE_FUTURES_API);
    const data = await response.json();
    
    const symbols = data.symbols
      .filter(s => 
        s.contractType === 'PERPETUAL' && 
        s.status === 'TRADING' && 
        s.symbol.endsWith('USDT')
      )
      .map(s => s.baseAsset); // 只取基礎資產名稱，例如 BTC, ETH
    
    // 去重
    return [...new Set(symbols)];
  } catch (error) {
    console.error('獲取交易對列表失敗:', error);
    return [];
  }
}

// 延遲函數（避免請求過快）
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主函數
async function main() {
  console.log('開始同步幣安加密貨幣圖標...\n');
  
  // 確保目錄存在
  ensureDirectoryExists(ICONS_DIR);
  
  // 獲取所有交易對
  console.log('正在獲取交易對列表...');
  const symbols = await getAllSymbols();
  console.log(`找到 ${symbols.length} 個交易對\n`);
  
  // 下載圖標
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    const success = await downloadIcon(symbol);
    
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // 每 10 個請求延遲一下
    if ((i + 1) % 10 === 0) {
      await delay(1000);
      console.log(`進度: ${i + 1}/${symbols.length}`);
    }
  }
  
  console.log('\n同步完成！');
  console.log(`✓ 成功: ${successCount}`);
  console.log(`✗ 失敗: ${failCount}`);
  console.log(`總計: ${symbols.length}`);
}

// 執行
main().catch(console.error);
