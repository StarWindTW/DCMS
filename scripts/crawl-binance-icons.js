/**
 * 爬取幣安網站上的加密貨幣圖標
 * 使用方法: node scripts/crawl-binance-icons.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ICONS_DIR = path.join(process.cwd(), 'public', 'icons');
const BINANCE_FUTURES_API = 'https://fapi.binance.com/fapi/v1/exchangeInfo';

// 幣安圖標 CDN 路徑（從幣安網站分析得出）
const BINANCE_ICON_SOURCES = [
  // 幣安官方 CDN - 主要來源
  (symbol) => `https://bin.bnbstatic.com/static/images/icons/cryptoCurrency/${symbol}.png`,
  // 備用 CDN 1
  (symbol) => `https://bin.bnbstatic.com/image/admin_mgs_image_upload/20201110/${symbol}.png`,
  // 備用 CDN 2 - SVG 格式
  (symbol) => `https://s2.coinmarketcap.com/static/img/coins/64x64/${getCoinMarketCapId(symbol)}.png`,
];

// 一些常見幣種的 CoinMarketCap ID 映射
const COINMARKETCAP_IDS = {
  'BTC': '1',
  'ETH': '1027',
  'USDT': '825',
  'BNB': '1839',
  'SOL': '5426',
  'XRP': '52',
  'USDC': '3408',
  'ADA': '2010',
  'DOGE': '74',
  'TRX': '1958',
  'DOT': '6636',
  'MATIC': '3890',
  'LTC': '2',
  'SHIB': '5994',
  'AVAX': '5805',
  'UNI': '7083',
  'LINK': '1975',
  'ATOM': '3794',
  'XMR': '328',
  'ETC': '1321',
};

function getCoinMarketCapId(symbol) {
  return COINMARKETCAP_IDS[symbol] || '';
}

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
    https.get(url, (response) => {
      // 處理重定向
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        console.log(`  → 重定向到: ${redirectUrl}`);
        return downloadFile(redirectUrl, dest).then(resolve);
      }

      if (response.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          // 檢查文件大小，如果太小可能是錯誤頁面
          const stats = fs.statSync(dest);
          if (stats.size < 100) {
            fs.unlinkSync(dest);
            resolve(false);
          } else {
            resolve(true);
          }
        });
        file.on('error', () => {
          file.close();
          if (fs.existsSync(dest)) {
            fs.unlinkSync(dest);
          }
          resolve(false);
        });
      } else {
        console.log(`  ✗ HTTP ${response.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.log(`  ✗ 網絡錯誤: ${err.message}`);
      resolve(false);
    });
  });
}

// 嘗試從幣安爬取圖標
async function crawlBinanceIcon(symbol) {
  const symbolUpper = symbol.toUpperCase();
  const symbolLower = symbol.toLowerCase();
  
  // 檢查是否已存在
  const existingPng = path.join(ICONS_DIR, `${symbolUpper}.png`);
  const existingSvg = path.join(ICONS_DIR, `${symbolUpper}.svg`);
  
  if (fs.existsSync(existingPng) || fs.existsSync(existingSvg)) {
    console.log(`⊙ ${symbolUpper}: 已存在`);
    return true;
  }

  console.log(`🔍 ${symbolUpper}: 開始爬取...`);

  // 嘗試各種可能的 URL 格式
  const urlVariants = [
    // 幣安官方 CDN - 大寫
    `https://bin.bnbstatic.com/static/images/icons/cryptoCurrency/${symbolUpper}.png`,
    // 幣安官方 CDN - 小寫
    `https://bin.bnbstatic.com/static/images/icons/cryptoCurrency/${symbolLower}.png`,
    // 備用 CDN 1 - 大寫
    `https://bin.bnbstatic.com/image/admin_mgs_image_upload/20201110/${symbolUpper}.png`,
    // 備用 CDN 1 - 小寫
    `https://bin.bnbstatic.com/image/admin_mgs_image_upload/20201110/${symbolLower}.png`,
    // 幣安官方 SVG
    `https://bin.bnbstatic.com/static/images/icons/cryptoCurrency/${symbolUpper}.svg`,
    `https://bin.bnbstatic.com/static/images/icons/cryptoCurrency/${symbolLower}.svg`,
    // CoinMarketCap (作為最後備用)
    getCoinMarketCapId(symbolUpper) ? `https://s2.coinmarketcap.com/static/img/coins/64x64/${getCoinMarketCapId(symbolUpper)}.png` : null,
    // GitHub Binance Icons
    `https://raw.githubusercontent.com/VadimMalykhin/binance-icons/master/crypto/${symbolLower}.svg`,
    // CoinCap
    `https://assets.coincap.io/assets/icons/${symbolLower}@2x.png`,
  ].filter(Boolean);

  for (const url of urlVariants) {
    const ext = url.endsWith('.svg') ? 'svg' : 'png';
    const dest = path.join(ICONS_DIR, `${symbolUpper}.${ext}`);
    
    console.log(`  ⟳ 嘗試: ${url}`);
    const success = await downloadFile(url, dest);
    
    if (success) {
      console.log(`  ✓ 成功下載 (${ext.toUpperCase()})`);
      return true;
    }
    
    // 每次請求之間稍微延遲
    await delay(100);
  }

  console.log(`  ✗ 所有來源都失敗`);
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
      .map(s => s.baseAsset);
    
    // 去重並排序
    return [...new Set(symbols)].sort();
  } catch (error) {
    console.error('獲取交易對列表失敗:', error);
    return [];
  }
}

// 延遲函數
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主函數
async function main() {
  console.log('🚀 開始爬取幣安加密貨幣圖標...\n');
  
  // 確保目錄存在
  ensureDirectoryExists(ICONS_DIR);
  
  // 獲取所有交易對
  console.log('📋 正在獲取交易對列表...');
  const symbols = await getAllSymbols();
  console.log(`✓ 找到 ${symbols.length} 個交易對\n`);
  
  // 下載圖標
  let successCount = 0;
  let failCount = 0;
  const failedSymbols = [];
  
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    const success = await crawlBinanceIcon(symbol);
    
    if (success) {
      successCount++;
    } else {
      failCount++;
      failedSymbols.push(symbol);
    }
    
    // 顯示進度
    if ((i + 1) % 10 === 0) {
      console.log(`\n📊 進度: ${i + 1}/${symbols.length} (成功: ${successCount}, 失敗: ${failCount})\n`);
      // 每 10 個延遲 2 秒，避免被封 IP
      await delay(2000);
    } else {
      // 每個請求之間延遲 500ms
      await delay(500);
    }
  }
  
  console.log('\n🎉 爬取完成！');
  console.log('='.repeat(50));
  console.log(`✓ 成功: ${successCount}`);
  console.log(`✗ 失敗: ${failCount}`);
  console.log(`📊 總計: ${symbols.length}`);
  console.log(`📈 成功率: ${((successCount / symbols.length) * 100).toFixed(2)}%`);
  
  if (failedSymbols.length > 0) {
    console.log('\n失敗的幣種:');
    console.log(failedSymbols.join(', '));
  }
  
  console.log('\n💾 圖標已保存到:', ICONS_DIR);
}

// 執行
main().catch(console.error);
