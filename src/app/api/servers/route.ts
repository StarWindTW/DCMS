import { getServerSession } from "next-auth";
import { authOptions } from "../auth/options";

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as any;
    console.log('Session in servers API:', session);
    
    if (!session?.accessToken) {
      console.error('No access token in session');
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const botApiUrl = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001';
    const resp = await fetch(`${botApiUrl}/api/servers`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    const data = await resp.json();

    return new Response(JSON.stringify(data), { status: resp.status, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Server proxy error (servers):', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
