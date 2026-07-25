import { Server, type Socket } from "socket.io";
import type { IncomingMessage, ServerResponse } from "http";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env, corsOrigins } from "../config/env.ts";
import type { JwtPayload } from "../modules/auth/auth.types.ts";
import { initChatHandlers } from "./chat.socket.ts";
import { initVoiceHandlers } from "./voice.socket.ts";
import { initNotificationsHandlers } from "./notifications.socket.ts";

export interface SocketUser {
  id: string;
  username: string;
  email: string;
  role: Role;
}

export type AuthSocket = Socket & { data: { user: SocketUser } };

function jwtAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): void {
  const raw = socket.handshake.auth?.token as string | undefined;
  if (!raw) {
    next(new Error("AUTH_REQUIRED"));
    return;
  }

  // Accept both "Bearer <token>" and bare token
  const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    if (!decoded.sub) {
      next(new Error("AUTH_INVALID"));
      return;
    }
    (socket as AuthSocket).data.user = {
      id: decoded.sub,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch {
    next(new Error("AUTH_INVALID"));
  }
}

export function initializeSocket(
  httpServer: HttpServer<typeof IncomingMessage, typeof ServerResponse>,
): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  });

  // /chat namespace — real-time message sending + voice recording
  const chatNS = io.of("/chat");
  chatNS.use(jwtAuthMiddleware);
  initChatHandlers(chatNS);
  initVoiceHandlers(chatNS);

  // /notifications namespace — server-push only (no client events)
  const notifNS = io.of("/notifications");
  notifNS.use(jwtAuthMiddleware);
  initNotificationsHandlers(notifNS);

  return io;
}
