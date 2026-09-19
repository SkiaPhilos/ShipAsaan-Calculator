import app from "../server";

// Configure maximum execution duration (in seconds) for Vercel Serverless Functions (e.g., Gemini extraction)
export const maxDuration = 60;

export default function handler(req: any, res: any) {
  // 1. If Vercel passed the path via query parameter (__path or all)
  if (req.query?.__path) {
    const subPath = String(req.query.__path).replace(/^\/+/, "");
    delete req.query.__path;
    req.url = subPath ? `/api/${subPath}` : "/api";
  } else if (req.query?.all) {
    const parts = Array.isArray(req.query.all) ? req.query.all.join("/") : String(req.query.all);
    delete req.query.all;
    req.url = `/api/${parts.replace(/^\/+/, "")}`;
  } else {
    // In Vercel serverless functions, rewrites can change req.url to "/api" or "/api/index".
    // req.originalUrl or the x-matched-path / x-forwarded-url headers preserve the client's actual path.
    const rawUrl =
      req.originalUrl ||
      req.headers?.["x-matched-path"] ||
      req.headers?.["x-forwarded-url"] ||
      req.url ||
      "/";

    // If Vercel rewrote the URL to /api or /api/index, restore the client-requested path
    if (req.url === "/api" || req.url === "/api/index" || req.url === "/api/") {
      if (rawUrl && rawUrl !== "/api" && rawUrl !== "/api/index") {
        req.url = rawUrl;
      }
    }

    // Ensure leading /api prefix is present for Express route matching
    if (req.url && !req.url.startsWith("/api")) {
      req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
    }
  }

  return app(req, res);
}


