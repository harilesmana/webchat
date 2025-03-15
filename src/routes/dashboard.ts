import { Elysia } from "@elysiajs/elysia";

export const dashboardRoutes = new Elysia()
  .get("/dashboard", async ({ cookie, render }) => {
    const sessionId = cookie.get("auth_session");
    if (!sessionId) return new Response(null, { status: 302, headers: { Location: "/login" } });

    return render("dashboard.ejs", { username: "User" });
  });