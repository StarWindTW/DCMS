# 加密貨幣圖標同步系統

這個系統會自動從多個來源下載所有幣安永續合約的加密貨幣圖標，並存儲到本地 `public/icons` 目錄。

## 🎯 功能特點

- ✅ 自動從幣安獲取所有 USDT 永續合約交易對
- ✅ 多來源圖標下載（Binance CDN → GitHub → CoinCap）
- ✅ 智能去重和緩存
- ✅ 支持 PNG 和 SVG 格式
- ✅ 可通過 API 或腳本執行

## 📁 文件結構

```
dashboard/
├── public/
│   └── icons/          # 下載的圖標存儲位置
│       ├── BTC.png
│       ├── ETH.svg
│       └── ...
├── scripts/
│   └── sync-icons.ts   # 獨立執行腳本
└── src/
    └── app/
        └── api/
            └── admin/
                └── sync-icons/
                    └── route.ts  # API 端點
```

## 🚀 使用方法

### 方法 1: 使用腳本（推薦首次同步）

```bash
# 執行圖標同步腳本
npx ts-node scripts/sync-icons.ts
```

這會：
1. 從幣安獲取所有交易對
2. 下載每個幣種的圖標（優先嘗試 Binance CDN）
3. 跳過已存在的圖標
4. 顯示詳細的下載進度

### 方法 2: 使用 API（適合定期更新）

#### 同步圖標（POST）

```bash
# 增量同步（只下載新增的）
curl -X POST http://localhost:3000/api/admin/sync-icons \
  -H "Content-Type: application/json" \
  -d '{}'

# 強制全量同步（清空後重新下載）
curl -X POST http://localhost:3000/api/admin/sync-icons \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

回應示例：
```json
{
  "message": "圖標同步完成",
  "total": 245,
  "success": 15,
  "cached": 230,
  "failed": 0,
  "failedSymbols": []
}
```

#### 查看同步狀態（GET）

```bash
curl http://localhost:3000/api/admin/sync-icons
```

回應示例：
```json
{
  "totalSymbols": 245,
  "cachedIcons": 245,
  "coverage": "100.00%",
  "icons": ["BTC.png", "ETH.svg", ...]
}
```

## ⚙️ 圖標來源優先順序

系統會按以下順序嘗試下載圖標：

1. **Binance CDN** (PNG)
   - `https://bin.bnbstatic.com/image/admin_mgs_image_upload/20201110/{SYMBOL}.png`
   - 最官方，速度快

2. **Binance Icons GitHub** (SVG)
   - `https://raw.githubusercontent.com/VadimMalykhin/binance-icons/master/crypto/{symbol}.svg`
   - 向量圖，質量好

3. **CoinCap** (PNG)
   - `https://assets.coincap.io/assets/icons/{symbol}@2x.png`
   - 覆蓋範圍廣

## 🔄 前端使用

前端組件 `ForumMessageForm.tsx` 已配置為優先使用本地圖標：

```tsx
<Image
  src={`/icons/${symbol}.png`}
  onError={(e) => {
    // 自動 fallback 到其他來源
    if (img.src.includes('/icons/') && img.src.endsWith('.png')) {
      img.src = `/icons/${symbol}.svg`;
    } else if (img.src.includes('/icons/')) {
      img.src = `https://bin.bnbstatic.com/image/...`;
    }
    // ... 更多 fallback
  }}
/>
```

## 📅 定期更新

### 手動更新
每週或每月手動執行一次：
```bash
npx ts-node scripts/sync-icons.ts
```

### 自動更新（可選）

#### Windows 任務計劃程式

1. 創建 `sync-icons.bat`:
```batch
@echo off
cd /d E:\React\dashboard
call npx ts-node scripts/sync-icons.ts
```

2. 打開「任務計劃程式」
3. 創建基本任務
4. 設定觸發器：每天凌晨 2:00
5. 操作：啟動程式 → 選擇 `sync-icons.bat`

#### Linux Cron Job

```bash
# 編輯 crontab
crontab -e

# 添加每天凌晨 2:00 執行
0 2 * * * cd /path/to/dashboard && npx ts-node scripts/sync-icons.ts >> /var/log/icon-sync.log 2>&1
```

#### GitHub Actions（推薦）

創建 `.github/workflows/sync-icons.yml`:

```yaml
name: Sync Crypto Icons

on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨 2:00 UTC
  workflow_dispatch:     # 允許手動觸發

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Sync icons
        run: npx ts-node scripts/sync-icons.ts
      
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add public/icons/*
          git commit -m "chore: sync crypto icons" || echo "No changes"
          git push
```

## 🛠️ 故障排除

### 某些圖標下載失敗

這是正常的，系統會嘗試多個來源。查看失敗列表：
```bash
# 查看哪些圖標缺失
curl http://localhost:3000/api/admin/sync-icons
```

### 圖標顯示不出來

1. 檢查文件是否存在：`public/icons/{SYMBOL}.png` 或 `.svg`
2. 確認大小寫匹配（應該全部大寫，如 `BTC.png`）
3. 查看瀏覽器控制台的網絡請求

### 重新下載所有圖標

```bash
# 刪除現有圖標
rm -rf public/icons/*

# 重新下載
npx ts-node scripts/sync-icons.ts
```

## 📊 統計信息

- **平均圖標大小**: ~5-20KB (PNG), ~2-10KB (SVG)
- **總計大小**: 約 2-5MB（245 個幣種）
- **下載時間**: 約 2-5 分鐘（首次）
- **緩存命中率**: 95%+（日常更新）

## 🔐 安全建議

如果在生產環境使用 API 端點，建議添加身份驗證：

```typescript
// src/app/api/admin/sync-icons/route.ts
export async function POST(request: Request) {
  // 檢查管理員權限
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ... 原有邏輯
}
```

## 📝 注意事項

- 首次同步需要較長時間（2-5 分鐘）
- 建議在低峰時段執行（凌晨）
- 圖標文件會被 Git 追蹤（已在 public/ 目錄）
- 如果 repo 太大，可考慮添加到 `.gitignore`：
  ```
  public/icons/*.png
  public/icons/*.svg
  ```

## 🎉 完成！

現在你的應用會優先使用本地圖標，大大提高加載速度和穩定性！
