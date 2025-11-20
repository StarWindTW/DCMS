import { NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/options";

// GET: 獲取歷史記錄
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const serverId = searchParams.get('serverId');

    console.log(`📖 Fetching signal history for user ${session.user.id} (limit: ${limit}, serverId: ${serverId || 'all'})`);

    let query = supabase
      .from(TABLES.SIGNAL_HISTORY)
      .select('*')
      .eq('user_id', session.user.id);

    // 如果有指定 serverId，則只查詢該伺服器的記錄
    if (serverId) {
      query = query.eq('server_id', serverId);
    }

    const { data, error } = await query
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 轉換 snake_case 到 camelCase
    const result = (data || []).map(record => ({
      id: record.id,
      timestamp: record.timestamp,
      coinSymbol: record.coin_symbol,
      coinName: record.coin_name,
      positionType: record.position_type,
      entryPrice: record.entry_price,
      takeProfit: record.take_profit,
      stopLoss: record.stop_loss,
      riskRewardRatio: record.risk_reward_ratio,
      sender: record.sender,
      serverId: record.server_id,
      channelId: record.channel_id,
      threadId: record.thread_id,
      userId: record.user_id,
    }));

    console.log(`✅ Retrieved ${result.length} records from Supabase`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Get signal history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signal history' },
      { status: 500 }
    );
  }
}

// POST: 添加新記錄
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📝 Attempting to save signal to Supabase:', body);

    // 轉換 camelCase 到 snake_case
    const dbRecord = {
      id: body.id,
      timestamp: body.timestamp,
      coin_symbol: body.coinSymbol,
      coin_name: body.coinName,
      position_type: body.positionType,
      entry_price: body.entryPrice,
      take_profit: body.takeProfit,
      stop_loss: body.stopLoss,
      risk_reward_ratio: body.riskRewardRatio,
      sender: body.sender,
      server_id: body.serverId,
      channel_id: body.channelId,
      thread_id: body.threadId,
      user_id: session.user.id,
    };

    console.log('📝 Converted to snake_case:', dbRecord);

    const { data, error } = await supabase
      .from(TABLES.SIGNAL_HISTORY)
      .insert([dbRecord])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 轉換回 camelCase 返回給前端
    const result = {
      id: data.id,
      timestamp: data.timestamp,
      coinSymbol: data.coin_symbol,
      coinName: data.coin_name,
      positionType: data.position_type,
      entryPrice: data.entry_price,
      takeProfit: data.take_profit,
      stopLoss: data.stop_loss,
      riskRewardRatio: data.risk_reward_ratio,
      sender: data.sender,
      serverId: data.server_id,
      channelId: data.channel_id,
      threadId: data.thread_id,
      userId: data.user_id,
    };

    console.log('✅ Signal saved successfully:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Create signal history error:', error);
    return NextResponse.json(
      { error: 'Failed to create signal record' },
      { status: 500 }
    );
  }
}

// DELETE: 刪除記錄
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const { error } = await supabase
      .from(TABLES.SIGNAL_HISTORY)
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete signal history error:', error);
    return NextResponse.json(
      { error: 'Failed to delete signal record' },
      { status: 500 }
    );
  }
}
