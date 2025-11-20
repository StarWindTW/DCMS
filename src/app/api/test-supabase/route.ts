import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🧪 Testing Supabase connection...');
    
    // 測試連接
    const { data, error } = await supabase
      .from('signal_history')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
      }, { status: 500 });
    }

    console.log('✅ Supabase connection successful!');
    
    // 獲取總記錄數
    const { count } = await supabase
      .from('signal_history')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful!',
      totalRecords: count || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
