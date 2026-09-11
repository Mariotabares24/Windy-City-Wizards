declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    SNAPSHOTS: R2Bucket;
    ANTHROPIC_API_KEY?: string;
  }
}
