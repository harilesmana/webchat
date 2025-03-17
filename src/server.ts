import { Elysia } from "elysia";
import { renderView } from "./utils/render";
import { serve } from "bun";

const app = new Elysia();
const clients = new Set<WebSocket>();

// ➜ Middleware: Menyimpan user session dari cookie
app.use(async ({ request, next }) => {
    const cookies = request.headers.get("cookie");
    const session = cookies?.split("; ").find((c) => c.startsWith("session="));
    request.user = session ? session.split("=")[1] : null;
    return next();
});

// ➜ Routing halaman utama
app.get("/", ({ request }) => {
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
app.get("/logout", () => {
    return new Response(null, {
        status: 302,
        headers: {
            "Set-Cookie": "session=; Path=/; HttpOnly; Max-Age=0",
            Location: "/login",
        },
    });
});

// ➜ WebSocket Server dengan Bun
const server = serve({
    port: 3000,

    websocket: {
        open(ws) {
            console.log("✅ Client connected!");
            clients.add(ws);
        },
        message(ws, message) {
            console.log("📩 Received:", message);
            try {
                const data = JSON.parse(message);
                const username = ws.data?.user || "Anonymous";
                const formattedMessage = `${username}: ${data.message}`;

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
            const success = server.upgrade(req, { data: { user: req.headers.get("cookie")?.split("=")[1] || "Guest" } });
            return success ? undefined : new Response("WebSocket Upgrade Failed", { status: 400 });
        }

        // Jika bukan WebSocket, lanjutkan ke Elysia
        return app.handle(req);
    },
});

// 🔥 Perbaikan: Jalankan Elysia dengan `app.listen()`
app.listen(3000);

console.log("✅ Server is running on http://localhost:3000");