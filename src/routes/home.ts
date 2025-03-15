import { Elysia } from "@elysiajs/elysia";

export const homeRoutes = new Elysia()
  .get("/", async ({ cookie, render }) => {
    const sessionId = cookie.get("auth_session");
    if (sessionId) return new Response(null, { status: 302, headers: { Location: "/dashboard" } });
    return render("index.ejs");
  });