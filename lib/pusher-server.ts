import Pusher from "pusher";

let server: Pusher | null = null;

export function getPusherServer() {
  if (server) return server;

  const appId = process.env.PUSHER_APP_ID?.trim();
  const key = process.env.PUSHER_KEY?.trim();
  const secret = process.env.PUSHER_SECRET?.trim();
  const cluster = process.env.PUSHER_CLUSTER?.trim();

  if (!appId || !key || !secret || !cluster) return null;

  server = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return server;
}
