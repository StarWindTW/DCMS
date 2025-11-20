import { getServerSession } from "next-auth";
import { authOptions } from "../auth/options";

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    console.log('Session in send-forum-message API:', session);
    
    if (!session?.accessToken) {
      console.error('No access token in session');
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await req.json();

    const botApiUrl = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001';
    const resp = await fetch(`${botApiUrl}/api/send-forum-message`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    return new Response(JSON.stringify(data), { status: resp.status, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Server proxy error (send-forum-message):', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
