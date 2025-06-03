// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./schema.ts",
  dbCredentials: {
    url: "postgresql://postgres.cmtcwubnobgtrnrnbagj:D0w4j9dgA8bG8281@aws-0-ap-south-1.pooler.supabase.com:6543/postgres",
  },
});
