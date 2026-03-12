import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { Server } from "socket.io";
import type { Plugin } from "vite";

function socketIoPlugin(): Plugin {
  return {
    name: "socket-io",
    configureServer(server) {
      if (!server.httpServer) return;

      const io = new Server(server.httpServer, {
        cors: { origin: "*" },
      });

      let serverEventState: any = null;
      let serverAuthState: any = null;

      io.on("connection", (socket) => {
        // Send current state to newly connected client
        if (serverEventState) {
          socket.emit("sync-event-state", serverEventState);
        }
        if (serverAuthState) {
          socket.emit("sync-auth-state", serverAuthState);
        }

        // When a client updates the state, store and broadcast it
        socket.on("update-event-state", (newState) => {
          serverEventState = newState;
          socket.broadcast.emit("sync-event-state", newState);
        });

        socket.on("update-auth-state", (newState) => {
          serverAuthState = newState;
          socket.broadcast.emit("sync-auth-state", newState);
        });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    socketIoPlugin()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
