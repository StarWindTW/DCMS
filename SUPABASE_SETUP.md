# Supabase 數據庫設置指南

## 步驟 1: 創建 Supabase 項目

1. 前往 [Supabase](https://supabase.com)
2. 點擊 "Start your project"
3. 使用 GitHub 登入（或其他方式）
4. 點擊 "New Project"
5. 填寫項目信息：
   - **Name**: `crypto-signals-dashboard` （或你喜歡的名字）
   - **Database Password**: 設置一個強密碼（記住它！）
   - **Region**: 選擇 `Northeast Asia (Tokyo)` 或最接近你的區域
   - **Pricing Plan**: 選擇 **Free** （每月免費額度）
6. 點擊 "Create new project" 並等待 1-2 分鐘

## 步驟 2: 獲取 API 密鑰

1. 項目創建完成後，點擊左側欄的 **⚙️ Settings**
2. 點擊 **API**
3. 你會看到兩個重要的值：
   - **Project URL**: 類似 `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public**: 一長串的密鑰

4. 複製這兩個值到 `.env.local` 文件：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_key
```

## 步驟 3: 創建數據表

1. 點擊左側欄的 **🗄️ SQL Editor**
2. 點擊 **+ New query**
3. 複製 `supabase-setup.sql` 文件的全部內容
4. 貼到 SQL 編輯器中
5. 點擊 **Run** 或按 `Ctrl+Enter`
6. 看到 "Success. No rows returned" 就代表成功了！

## 步驟 4: 驗證數據表

1. 點擊左側欄的 **🗂️ Table Editor**
2. 你應該會看到 `signal_history` 表
3. 點擊表名，查看結構：
   - `id` (text, primary key)
   - `timestamp` (bigint)
   - `coin_symbol` (text)
   - `coin_name` (text)
   - `position_type` (text)
   - `entry_price` (text)
   - `take_profit` (text)
   - `stop_loss` (text)
   - `risk_reward_ratio` (text)
   - `sender` (text)
   - `channel_id` (text)
   - `created_at` (timestamp)

## 步驟 5: 測試連接

1. 重啟你的開發服務器：
   ```bash
   npm run dev
   ```

2. 登入應用並發送一條交易信號

3. 回到 Supabase → **Table Editor** → `signal_history`

4. 你應該會看到新添加的記錄！

## 步驟 6: 查看數據（可選）

在 Supabase 的 SQL Editor 中運行查詢：

```sql
-- 查看所有記錄
SELECT * FROM signal_history ORDER BY timestamp DESC;

-- 查看統計
SELECT 
  position_type, 
  COUNT(*) as total_signals 
FROM signal_history 
GROUP BY position_type;

-- 查看最近 10 筆
SELECT 
  coin_symbol, 
  position_type, 
  entry_price, 
  sender,
  created_at 
FROM signal_history 
ORDER BY timestamp DESC 
LIMIT 10;
```

## 常見問題

### Q: 看不到數據？
- 檢查 `.env.local` 中的 URL 和 Key 是否正確
- 確認已重啟開發服務器
- 打開瀏覽器控制台查看錯誤訊息

### Q: RLS (Row Level Security) 是什麼？
- 這是 Supabase 的安全功能
- 我們已經設置為允許公開讀寫
- 如果需要更嚴格的權限控制，可以修改 SQL 中的 Policy

### Q: 免費額度夠用嗎？
Supabase 免費計劃包含：
- ✅ 500 MB 數據庫存儲（夠存儲數十萬條記錄）
- ✅ 2 GB 文件存儲
- ✅ 5 GB 帶寬/月
- ✅ 50,000 月活躍用戶
- ✅ 無限 API 請求

對於個人或小團隊使用完全足夠！

## 數據遷移（從 localStorage）

如果你之前使用 localStorage 存儲了數據，可以這樣遷移：

1. 打開瀏覽器控制台（F12）
2. 運行以下代碼：

```javascript
// 獲取 localStorage 數據
const oldData = JSON.parse(localStorage.getItem('signalHistory') || '[]');

// 批量上傳到 Supabase
oldData.forEach(async (signal) => {
  await fetch('/api/signal-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signal)
  });
});

console.log('遷移完成！');
```

## 部署到生產環境

當你準備部署到 Vercel 時：

1. 在 Vercel 項目設置中添加環境變量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. 重新部署應用

3. 完成！你的數據庫會自動工作

---

有問題嗎？檢查 [Supabase 文檔](https://supabase.com/docs) 或詢問我！
