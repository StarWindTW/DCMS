# 快速部署腳本

# 這個腳本會幫助你快速部署到 Vercel

Write-Host "🚀 開始部署到 Vercel..." -ForegroundColor Green
Write-Host ""

# 檢查是否安裝了 Vercel CLI
Write-Host "📦 檢查 Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ 未安裝 Vercel CLI" -ForegroundColor Red
    Write-Host "正在安裝 Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
    Write-Host "✅ Vercel CLI 安裝完成" -ForegroundColor Green
    Write-Host ""
}

# 檢查是否登入
Write-Host "🔐 檢查 Vercel 登入狀態..." -ForegroundColor Yellow
$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "需要登入 Vercel..." -ForegroundColor Yellow
    vercel login
    Write-Host ""
}

# 構建項目
Write-Host "🔨 構建項目..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 構建失敗，請檢查錯誤信息" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 構建成功" -ForegroundColor Green
Write-Host ""

# 部署到 Vercel
Write-Host "🚀 部署到 Vercel（生產環境）..." -ForegroundColor Yellow
vercel --prod

Write-Host ""
Write-Host "🎉 部署完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📝 後續步驟：" -ForegroundColor Yellow
Write-Host "1. 複製 Vercel 提供的 URL（例如：https://dashboard-xxxx.vercel.app）"
Write-Host "2. 在 Vercel Dashboard 設置環境變量："
Write-Host "   - NEXTAUTH_URL=https://your-app.vercel.app"
Write-Host "   - NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app"
Write-Host "3. 在 Discord Developer Portal 更新 OAuth 回調 URL："
Write-Host "   - https://your-app.vercel.app/api/auth/callback/discord"
Write-Host "4. 重新部署以應用環境變量"
Write-Host ""
Write-Host "📖 詳細說明請查看 VERCEL_DEPLOYMENT.md" -ForegroundColor Cyan
