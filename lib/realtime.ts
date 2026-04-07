import { getPusherServer } from "@/lib/pusher-server";

export function getClientChannelName(clientId: string) {
  return `private-client-${clientId}`;
}

export async function triggerClientEvent<TPayload extends Record<string, unknown>>(
  clientId: string,
  eventName: string,
  payload: TPayload
) {
  const pusher = getPusherServer();
  if (!pusher) return;
  await pusher.trigger(getClientChannelName(clientId), eventName, payload);
}
