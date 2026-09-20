import app from "../server";

// Configure maximum execution duration (in seconds) for Vercel Serverless Functions (e.g., Gemini extraction)
export const maxDuration = 60;

export default function handler(req: any, res: any) {
  try {
    const rawUrl = req.url || "/";
    const host = req.headers?.host || "localhost";
    const parsed = new URL(rawUrl, `http://${host}`);

    // Check if path is provided via query parameter (__path, path, or all) from Vercel rewrites
    const queryPath =
      parsed.searchParams.get("__path") ||
      parsed.searchParams.get("path") ||
      parsed.searchParams.get("all") ||
      (req.query && (req.query.__path || req.query.path || req.query.all));

    if (queryPath) {
      const cleanSubPath = String(queryPath).replace(/^\/+/, "");
      parsed.searchParams.delete("__path");
      parsed.searchParams.delete("path");
      parsed.searchParams.delete("all");
      if (req.query) {
        delete req.query.__path;
        delete req.query.path;
        delete req.query.all;
      }

      const remainingSearch = parsed.searchParams.toString();
      req.url = cleanSubPath ? `/api/${cleanSubPath}${remainingSearch ? `?${remainingSearch}` : ""}` : "/api";
    } else {
      // Check if originalUrl or custom headers hold the client's actual requested path
      const matched =
        req.headers?.["x-matched-path"] ||
        req.headers?.["x-forwarded-url"] ||
        req.originalUrl;

      if (matched && typeof matched === "string" && matched.startsWith("/api/")) {
        req.url = matched;
      } else if (req.url && !req.url.startsWith("/api")) {
        req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
      }
    }

    req.originalUrl = req.url;
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel API handler error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: err?.message || "Internal serverless error" }));
  }
}



