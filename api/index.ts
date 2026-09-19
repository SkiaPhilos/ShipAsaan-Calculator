import app from "../server";

export default function handler(req: any, res: any) {
  // Normalize req.url so Express routes matching /api/* are always matched
  if (req.url && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  return app(req, res);
}
