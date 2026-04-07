import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAdminAccess } from "@/lib/admin";
import { getPusherServer } from "@/lib/pusher-server";
import { readJsonObject, sanitizeText } from "@/lib/validation";

function clientIdFromChannel(channelName: string) {
  if (!channelName.startsWith("private-client-")) return null;
  const clientId = channelName.replace("private-client-", "").trim();
  return clientId || null;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pusher = getPusherServer();
  if (!pusher) return NextResponse.json({ error: "Realtime is not configured" }, { status: 503 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const socketId = sanitizeText(body.socket_id, { maxLength: 120 });
  const channelName = sanitizeText(body.channel_name, { maxLength: 200 });
  if (!socketId || !channelName) {
    return NextResponse.json({ error: "Missing socket/channel" }, { status: 400 });
  }

  const requestedClientId = clientIdFromChannel(channelName);
  if (!requestedClientId) return NextResponse.json({ error: "Invalid channel" }, { status: 400 });

  const access = await getAdminAccess();
  if (!access.isAdmin && requestedClientId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const authResponse = pusher.authorizeChannel(socketId, channelName);
  return NextResponse.json(authResponse);
}
