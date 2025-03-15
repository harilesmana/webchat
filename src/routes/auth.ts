import { Elysia } from "elysia";
import { db } from "../db/db";
import { users } from "../db/schema";
import { renderView } from "../utils/render";

const auth = new Elysia();

// ➜ Menampilkan halaman register
auth.get("/register", async () => {
    return new Response(await renderView("register"), {
        headers: { "Content-Type": "text/html" },
    });
});

// ➜ Proses Register
auth.post("/register", async ({ body, set }) => {
    const { username, password } = body;

    // Cek apakah username sudah ada
    const existingUser = await db
        .select()
        .from(users)
        .where({ username })
        .limit(1)
        .then(rows => rows[0]);

    if (existingUser) {
        return new Response(await renderView("register", { error: "Username sudah digunakan!" }), {
            headers: { "Content-Type": "text/html" },
        });
    }

    // Simpan pengguna baru tanpa hashing
    await db.insert(users).values({ username, password }).execute();

    // Redirect ke login setelah register
    set.status = 302;
    set.headers["Location"] = "/login";
    return;
});

// ➜ Menampilkan halaman login
auth.get("/login", async () => {
    return new Response(await renderView("login"), {
        headers: { "Content-Type": "text/html" },
    });
});

// ➜ Proses Login
auth.post("/login", async ({ body, set }) => {
    const { username, password } = body;

    // Cek pengguna di database
    const user = await db
        .select()
        .from(users)
        .where({ username })
        .limit(1)
        .then(rows => rows[0]);

    if (!user || user.password !== password) {
        return new Response(await renderView("login", { error: "Username atau password salah!" }), {
            headers: { "Content-Type": "text/html" },
        });
    }

    // Set session cookie
    set.headers["Set-Cookie"] = `session=${username}; Path=/; HttpOnly; Max-Age=86400`;

    // Redirect ke home
    set.status = 302;
    set.headers["Location"] = "/home";
    return;
});

// ➜ Menampilkan halaman home (hanya jika sudah login)
auth.get("/home", async ({ request }) => {
    const cookie = request.headers.get("Cookie");
    const session = cookie?.split("session=")[1]?.split(";")[0];

    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    return new Response(await renderView("home", { username: session }), {
        headers: { "Content-Type": "text/html" },
    });
});

// ➜ Logout (menghapus session)
auth.get("/logout", async ({ set }) => {
    set.headers["Set-Cookie"] = "session=; Path=/; HttpOnly; Max-Age=0";

    // Redirect ke login
    set.status = 302;
    set.headers["Location"] = "/login";
    return;
});

// **Pastikan ini ada agar bisa diekspor ke `server.ts`**
export default auth;