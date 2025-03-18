import { Elysia } from "elysia";
import authRoutes from "./routes/auth";
import { renderView } from "./utils/render";
import { serve } from "bun";
const app = new Elysia();
const messages: { id: string; username: string; message: string }[] = [];
const clients = new Set<WebSocket>();
// ➜ Server HTTP & WebSocket dalam satu serve({})
const server = serve({
port: 3000,
websocket: {
open(ws) {
console.log("✅ Client connected!");
clients.add(ws);
ws.send(JSON.stringify({ action: "load", messages }));
},
message(ws, message) {
console.log("📩 Received:", message);
try {
const data = JSON.parse(message);
if (data.action === "edit") {
// Pastikan hanya pengirim asli yang bisa edit
const msgIndex = messages.findIndex((msg) => msg.id === data.id && msg.username === data.username);
if (msgIndex !== -1) {
messages[msgIndex].message = data.message;
broadcast({ action: "edit", id: data.id, message: data.message });
}
} else if (data.action === "delete") {
// Pastikan hanya pengirim asli yang bisa hapus
const msgIndex = messages.findIndex((msg) => msg.id === data.id && msg.username === data.username);
if (msgIndex !== -1) {
messages.splice(msgIndex, 1);
broadcast({ action: "delete", id: data.id });
}
} else {
messages.push(data);
broadcast(data);
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
if (url.pathname === "/ws") {
return server.upgrade(req) ? undefined : new Response("WebSocket Upgrade Failed", { status: 400 });
}
return app.handle(req);
},
});
// Fungsi broadcast ke semua client
function broadcast(data: any) {
for (const client of clients) {
if (client.readyState === WebSocket.OPEN) {
client.send(JSON.stringify(data));
}
}
}
// ➜ Middleware untuk membaca cookie session
app.use(async ({ request, next }) => {
const cookies = request.headers.get("cookie");
const session = cookies?.split("; ").find((c) => c.startsWith("session="));
request.user = session ? session.split("=")[1] : null;
return next();
});
// ➜ Redirect dari "/" ke halaman login atau home
app.get("/", async () => {
    return new Response(await renderView("index"), {
    headers: { "Content-Type": "text/html" },
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

