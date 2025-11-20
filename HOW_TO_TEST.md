# 如何檢查數據是否成功上傳到 Supabase

## 方法 1: 使用測試 API（最快）

1. **打開瀏覽器**，訪問：
   ```
   http://localhost:3000/api/test-supabase
   ```

2. **查看結果**：
   - 如果成功，你會看到：
     ```json
     {
       "success": true,
       "message": "Supabase connection successful!",
       "totalRecords": 0,
       "timestamp": "2025-11-03..."
     }
     ```
   - 如果失敗，會顯示錯誤信息

## 方法 2: 查看瀏覽器控制台日誌

1. **打開應用**：http://localhost:3000

2. **打開開發者工具**：
   - 按 `F12` 或 右鍵 → 檢查

3. **切到 Console 標籤**

4. **發送一條交易信號**

5. **查看日誌**：
   - 你會看到：
     ```
     📤 Sending signal to database: {...}
     ```
   - 如果成功：
     ```
     ✅ Signal saved successfully! {...}
     ```
   - 如果失敗：
     ```
     ❌ Failed to save signal: 500 {...}
     ```

## 方法 3: 在 Supabase 控制台查看

1. **登入 Supabase**：https://app.supabase.com

2. **選擇你的項目**：crypto-signals-dashboard

3. **點擊左側 Table Editor**

4. **選擇 signal_history 表**

5. **查看數據**：
   - 如果有數據，會顯示所有記錄
   - 如果是空的，說明還沒有數據上傳

## 方法 4: 使用 SQL 查詢

在 Supabase SQL Editor 中執行：

```sql
-- 查看所有記錄
SELECT * FROM signal_history ORDER BY timestamp DESC;

-- 查看記錄數量
SELECT COUNT(*) as total FROM signal_history;

-- 查看最新一筆
SELECT * FROM signal_history ORDER BY timestamp DESC LIMIT 1;
```

## 常見問題排查

### 問題 1: 看不到測試 API 結果
**原因**：數據表可能還沒創建

**解決**：
1. 打開 Supabase SQL Editor
2. 執行 `supabase-setup.sql` 文件內容
3. 重新測試

### 問題 2: 控制台顯示 404 或 500 錯誤
**原因**：API 路由或環境變量問題

**檢查**：
1. `.env.local` 中的 URL 和 Key 是否正確
2. 重啟開發服務器（Ctrl+C 後重新 `npm run dev`）

### 問題 3: 數據表不存在錯誤
**錯誤信息**：`relation "signal_history" does not exist`

**解決**：
1. 確認已在 Supabase 執行 SQL 創建表
2. 表名必須是 `signal_history`（全小寫，下劃線）

### 問題 4: 權限錯誤
**錯誤信息**：`Row level security policy violation`

**解決**：
確認 SQL 中的 RLS 策略已正確設置：
```sql
ALTER TABLE signal_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert access"
  ON signal_history
  FOR INSERT
  WITH CHECK (true);
```

## 快速驗證流程

1. ✅ **測試連接**：訪問 http://localhost:3000/api/test-supabase
2. ✅ **發送信號**：在應用中發送一條交易信號
3. ✅ **查看控制台**：確認日誌顯示 "✅ Signal saved successfully!"
4. ✅ **檢查 Supabase**：在 Table Editor 中查看數據
5. ✅ **刷新頁面**：確認歷史記錄列表顯示新數據

如果以上所有步驟都成功，說明數據已正確上傳！
