import app from "../server";

// Configure maximum execution duration (in seconds) for Vercel Serverless Functions
export const maxDuration = 60;

// Export Express app directly as default export for native Vercel serverless handling
export default app;




