# Vercel 部署指南

## 📋 部署前準備

### 1. 確保所有環境變量都設置好

需要在 Vercel 上設置以下環境變量：

```bash
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=fedd75711f05d0ec367f21f78e9e56a4
DISCORD_CLIENT_ID=1433292219246313554
DISCORD_CLIENT_SECRET=IboGdA_U_lnlIL3Sk3MeeDh6T-pI511S
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://bfgcnhivroevrbnjotvs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZ2NuaGl2cm9ldnJibmpvdHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODA0ODMsImV4cCI6MjA3Nzc1NjQ4M30.-mHpDm6a0ub0ZtRkQZZCFJZ6igusjD9CP6oeJOgnYmk
```

### 2. 更新 Discord OAuth 回調 URL

部署後需要在 Discord Developer Portal 更新 OAuth2 Redirect URLs：
- https://your-app.vercel.app/api/auth/callback/discord

## 🚀 部署步驟

### 方法 1: 使用 Vercel CLI（推薦）

#### 1. 安裝 Vercel CLI

```bash
npm install -g vercel
```

#### 2. 登入 Vercel

```bash
vercel login
```

#### 3. 部署到 Vercel

在 dashboard 目錄下執行：

```bash
cd E:\React\dashboard
vercel
```

第一次部署會詢問幾個問題：
- Set up and deploy "dashboard"? **Y**
- Which scope do you want to deploy to? **選擇你的賬號**
- Link to existing project? **N**
- What's your project's name? **dashboard** (或自定義)
- In which directory is your code located? **./** (當前目錄)

#### 4. 部署到生產環境

```bash
vercel --prod
```

### 方法 2: 使用 Vercel 網站部署

#### 1. 推送到 Git

首先將代碼推送到 GitHub/GitLab/Bitbucket：

```bash
cd E:\React\dashboard
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GIT_REPOSITORY_URL
git push -u origin main
```

#### 2. 連接 Vercel

1. 訪問 https://vercel.com
2. 點擊 "Add New Project"
3. 選擇你的 Git 倉庫
4. 導入項目

#### 3. 配置項目

Vercel 會自動檢測到 Next.js 項目，使用默認配置即可。

#### 4. 設置環境變量

在 Vercel 項目設置中：
1. 進入 "Settings" → "Environment Variables"
2. 添加所有環境變量（見上面列表）
3. 記得將 `NEXTAUTH_URL` 和 `NEXT_PUBLIC_BASE_URL` 改為你的 Vercel URL

#### 5. 部署

點擊 "Deploy" 按鈕。

## 📝 部署後配置

### 1. 獲取部署 URL

部署完成後，Vercel 會提供一個 URL，例如：
```
https://dashboard-xxxx.vercel.app
```

### 2. 更新環境變量

在 Vercel 項目設置中更新：

```bash
NEXTAUTH_URL=https://dashboard-xxxx.vercel.app
NEXT_PUBLIC_BASE_URL=https://dashboard-xxxx.vercel.app
```

更新後需要重新部署。

### 3. 更新 Discord OAuth 設置

1. 訪問 https://discord.com/developers/applications
2. 選擇你的應用
3. 進入 "OAuth2" → "Redirects"
4. 添加：`https://dashboard-xxxx.vercel.app/api/auth/callback/discord`
5. 保存

### 4. 測試圖標 API

訪問：
```
https://dashboard-xxxx.vercel.app/api/icons/BTC
```

應該能看到 BTC 圖標。

## 🔄 更新部署

### CLI 方式

```bash
cd E:\React\dashboard
git add .
git commit -m "Update"
vercel --prod
```

### Git 方式

如果連接了 Git：
```bash
git add .
git commit -m "Update"
git push
```

Vercel 會自動檢測並重新部署。

## 📊 監控和日誌

### 查看部署狀態

```bash
vercel ls
```

### 查看日誌

```bash
vercel logs
```

### Vercel Dashboard

訪問 https://vercel.com/dashboard 查看：
- 部署歷史
- 實時日誌
- 性能分析
- 錯誤追蹤

## ⚠️ 常見問題

### 1. 環境變量未生效

- 確保在 Vercel 設置中正確添加了所有變量
- 更新環境變量後需要重新部署

### 2. Discord OAuth 錯誤

- 檢查 Discord 應用的 Redirect URL 是否正確
- 確保 `NEXTAUTH_URL` 環境變量正確

### 3. 圖標 API 404

- 確保 `public/icons/` 目錄中有圖標文件
- Vercel 會自動包含 `public` 目錄

### 4. 構建失敗

檢查本地是否能成功構建：
```bash
npm run build
```

如果本地成功但 Vercel 失敗，檢查：
- Node.js 版本兼容性
- 依賴項是否完整

## 🌐 自定義域名（可選）

### 1. 在 Vercel 添加域名

1. 進入項目設置 → "Domains"
2. 添加你的域名
3. 按照指示更新 DNS 記錄

### 2. 更新環境變量

將所有 URL 改為自定義域名：
```bash
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### 3. 更新 Discord OAuth

在 Discord Developer Portal 更新回調 URL：
```
https://yourdomain.com/api/auth/callback/discord
```

## 🔐 安全建議

1. **不要提交 `.env.local` 到 Git**（已在 .gitignore 中）
2. **定期更新 `NEXTAUTH_SECRET`**
3. **使用環境變量而非硬編碼敏感信息**
4. **啟用 Vercel 的 HTTPS**（默認啟用）

## 📱 與 Discord Bot 通信

部署後，Discord Bot 仍在本地運行（`localhost:3001`）。你需要：

### 選項 1: 也部署 Bot 到服務器

將 Bot 部署到 VPS 或 Heroku，然後更新 dashboard 的 API 調用 URL。

### 選項 2: 使用 ngrok 暴露本地 Bot

```bash
npx ngrok http 3001
```

然後更新 dashboard 中的 Bot API URL。

### 選項 3: 將 Bot 整合到 Next.js API Routes

將 Bot 邏輯移到 Next.js API routes，統一部署。

## 🎉 完成

部署成功後：
- Dashboard: `https://dashboard-xxxx.vercel.app`
- 圖標 API: `https://dashboard-xxxx.vercel.app/api/icons/[symbol]`
- Discord 可以訪問圖標了！

## 📞 需要幫助？

- Vercel 文檔: https://vercel.com/docs
- Next.js 部署: https://nextjs.org/docs/deployment
- Discord OAuth: https://discord.com/developers/docs/topics/oauth2
