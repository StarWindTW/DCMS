# 圖標 API 設置說明

## 功能說明

已創建一個圖標 API 端點，可以通過 HTTP 請求訪問本地圖標文件。

## API 端點

```
GET /api/icons/[symbol]
```

### 參數
- `symbol`: 加密貨幣符號（如 BTC、ETH）

### 示例
```
http://localhost:3000/api/icons/BTC
http://localhost:3000/api/icons/ETH
```

## 工作原理

1. **本地圖標優先**: API 會先在 `public/icons/` 目錄中查找圖標
2. **支持多格式**: 自動嘗試 PNG、SVG、JPG、JPEG 格式
3. **性能優化**: 設置了永久緩存（Cache-Control: public, max-age=31536000）
4. **錯誤處理**: 找不到圖標時返回 404

## 使用方式

### 在 Discord Embed 中使用

```typescript
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const coinIcon = `${baseUrl}/api/icons/${coinSymbol.toUpperCase()}`;

const embed = {
  author: {
    name: `${coinSymbol}-做多`,
    icon_url: coinIcon,
  },
  // ... 其他字段
};
```

### 在瀏覽器中測試

直接訪問：
- http://localhost:3000/api/icons/BTC
- http://localhost:3000/api/icons/ETH

## 部署到生產環境

### 1. 修改環境變量

在生產環境的 `.env.production` 或 Vercel 環境變量中設置：

```bash
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### 2. Vercel 部署

Vercel 會自動提供公開訪問的 URL，無需額外配置。

```bash
# 部署到 Vercel
vercel --prod
```

部署後，圖標 API 會變成：
```
https://your-domain.vercel.app/api/icons/BTC
```

### 3. 其他平台部署

- **Netlify**: 類似 Vercel，自動提供公開 URL
- **AWS/Azure/GCP**: 需要配置域名和 HTTPS
- **Docker**: 需要開放端口並配置反向代理

## 圖標管理

### 添加新圖標

1. 下載圖標（使用爬蟲腳本）：
   ```bash
   cd E:\React\超級爬蟲
   python download_all_icons.py
   ```

2. 複製到 dashboard：
   ```bash
   xcopy /s /y all_binance_icons\* ..\dashboard\public\icons\
   ```

### 圖標格式要求

- **推薦**: PNG（透明背景）
- **尺寸**: 64x64 或更大
- **命名**: 使用大寫符號（如 BTC.png、ETH.png）

## 當前配置

- **開發環境**: `http://localhost:3000/api/icons/[symbol]`
- **生產環境**: 需要設置 `NEXT_PUBLIC_BASE_URL`

## 測試

啟動 dashboard 後，在瀏覽器訪問：
```
http://localhost:3000/api/icons/BTC
```

應該會看到 BTC 的圖標（如果存在）。

## 注意事項

1. **Discord 需要公開 URL**: localhost 在 Discord 中無法訪問，需要部署到公開服務器
2. **圖標大小**: 建議圖標文件不超過 1MB
3. **緩存**: API 設置了永久緩存，更新圖標後可能需要清除瀏覽器緩存
4. **404 處理**: 找不到圖標時會返回 404，Discord 會顯示默認圖標

## 下一步

如果要在本地開發時讓 Discord 也能訪問圖標，可以使用：

1. **ngrok** - 創建臨時公開 URL
   ```bash
   npx ngrok http 3000
   ```

2. **localtunnel** - 另一個臨時隧道工具
   ```bash
   npx localtunnel --port 3000
   ```

然後將臨時 URL 設置到 `.env.local` 的 `NEXT_PUBLIC_BASE_URL`。
