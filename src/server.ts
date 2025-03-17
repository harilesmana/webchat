import { Elysia } from "elysia";
import authRoutes from "./routes/auth";
import { renderView } from "./utils/render";
import { serve } from "bun";

const app = new Elysia();
const clients = new Set<WebSocket>();

// ➜ Server HTTP & WebSocket dalam satu `serve({})`
const server = serve({
    port: 3000,

    // 🔌 Konfigurasi WebSocket dengan `websocket` object
    websocket: {
        open(ws) {
            console.log("✅ Client connected!");
            clients.add(ws);
        },
      message(ws, message) {
    console.log("📩 Received message:", message);
    
    try {
        const data = JSON.parse(message);
        const formattedMessage = `${data.username}: ${data.message}`;

        for (const client of clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(formattedMessage);
            }
        }
    } catch (error) {
        console.error("❌ Error parsing message:", error);
    }
},
        close(ws) {
            console.log("🔌 Client disconnected!");
            clients.delete(ws);
        },
    },

    fetch(req, server) {
        const url = new URL(req.url);

        // 🔄 Upgrade WebSocket pada endpoint `/ws`
        if (url.pathname === "/ws") {
            console.log("🔌 Incoming WebSocket connection...");
            const success = server.upgrade(req);
            return success ? undefined : new Response("WebSocket Upgrade Failed", { status: 400 });
        }

        return app.handle(req);
    },
});

// ➜ Middleware untuk membaca cookie session
app.use(async ({ request, next }) => {
    const cookies = request.headers.get("cookie");
    const session = cookies?.split("; ").find((c) => c.startsWith("session="));
    request.user = session ? session.split("=")[1] : null;
    return next();
});

// ➜ Redirect dari "/" ke halaman login atau home
app.get("/", async ({ request }) => {
    return new Response(null, {
        status: 302,
        headers: { Location: request.user ? "/home" : "/login" },
    });
});

// ➜ Halaman login
app.get("/login", async () => {
    return new Response(await renderView("login"), {
        headers: { "Content-Type": "text/html" },
    });
});

// ➜ Halaman register
app.get("/register", async () => {
    return new Response(await renderView("register"), {
        headers: { "Content-Type": "text/html" },
    });
});

// ➜ Halaman home (hanya bisa diakses jika login)
app.get("/home", async ({ request }) => {
    if (!request.user) {
        return new Response(null, { status: 302, headers: { Location: "/login" } });
    }
    return new Response(await renderView("home", { username: request.user }), {
        headers: { "Content-Type": "text/html" },
    });
});

// ➜ Logout (hapus session)
app.get("/logout", async () => {
    return new Response(null, {
        status: 302,
        headers: {
            "Set-Cookie": "session=; Path=/; HttpOnly; Max-Age=0",
            Location: "/login",
        },
    });
});

// Gunakan rute autentikasi
app.use(authRoutes);

console.log("✅ Server is running on http://localhost:3000");