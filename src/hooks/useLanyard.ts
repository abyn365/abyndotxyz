import { useEffect, useState } from "react";
import { DISCORD_ID } from "../lib/discord";
import { LanyardPresence } from "../@types/discord-status.type";

const LANYARD_SOCKET = "wss://api.lanyard.rest/socket";

export function useLanyard(userId: string = DISCORD_ID) {
  const [presence, setPresence] = useState<LanyardPresence | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let heartbeat: NodeJS.Timeout | null = null;
    let fallbackPoll: NodeJS.Timeout | null = null;

    const fetchStatus = async () => {
      try {
        const statusRes = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
        const { success, data } = await statusRes.json();
        if (success) {
          setPresence(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch activity data:", error);
        setLoading(false);
      }
    };

    const connect = () => {
      try {
        socket = new WebSocket(LANYARD_SOCKET);

        socket.addEventListener("message", (event) => {
          try {
            const payload = JSON.parse(event.data);

            if (payload.op === 1) {
              const heartbeatInterval = payload.d?.heartbeat_interval ?? 30000;
              heartbeat = setInterval(() => {
                if (socket?.readyState === WebSocket.OPEN) {
                  socket.send(JSON.stringify({ op: 3 }));
                }
              }, heartbeatInterval);

              socket.send(
                JSON.stringify({ op: 2, d: { subscribe_to_id: userId } })
              );
              return;
            }

            if (
              payload.op === 0 &&
              ["INIT_STATE", "PRESENCE_UPDATE"].includes(payload.t)
            ) {
              setPresence(payload.d);
              setLoading(false);
            }
          } catch (e) {
            console.error("Failed to parse Lanyard WS message:", e);
          }
        });

        socket.addEventListener("error", (e) => {
          console.error("Lanyard socket error:", e);
          fetchStatus();
        });

        socket.addEventListener("close", () => {
          if (heartbeat) clearInterval(heartbeat);
          // Set up poll as fallback
          fallbackPoll = setInterval(fetchStatus, 10000);
        });
      } catch (error) {
        console.error("Failed to connect to Lanyard websocket:", error);
        fetchStatus();
        fallbackPoll = setInterval(fetchStatus, 10000);
      }
    };

    connect();

    return () => {
      if (heartbeat) clearInterval(heartbeat);
      if (fallbackPoll) clearInterval(fallbackPoll);
      socket?.close();
    };
  }, [userId]);

  return { presence, loading };
}
