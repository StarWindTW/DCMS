import { NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';

// GET: 獲取每個伺服器的統計數據
export async function GET() {
  try {
    console.log('📊 Fetching server statistics...');

    // 使用 SQL 聚合查詢
    const { data, error } = await supabase
      .from(TABLES.SIGNAL_HISTORY)
      .select('server_id, timestamp')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 按伺服器分組統計
    const serverMap = new Map<string, { count: number; lastTime: number }>();
    
    data.forEach(record => {
      const serverId = record.server_id;
      if (!serverId) return;

      const existing = serverMap.get(serverId);
      if (existing) {
        existing.count++;
        existing.lastTime = Math.max(existing.lastTime, record.timestamp);
      } else {
        serverMap.set(serverId, {
          count: 1,
          lastTime: record.timestamp,
        });
      }
    });

    // 轉換為陣列
    const stats = Array.from(serverMap.entries()).map(([serverId, data]) => ({
      serverId,
      totalSignals: data.count,
      lastSignalTime: data.lastTime,
    }));

    // 按信號數量排序
    stats.sort((a, b) => b.totalSignals - a.totalSignals);

    console.log(`✅ Retrieved stats for ${stats.length} servers`);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('❌ Fetch server stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch server statistics' },
      { status: 500 }
    );
  }
}
