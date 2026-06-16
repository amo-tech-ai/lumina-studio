const { MetadataStorage } = require("@medusajs/framework/mikro-orm/core")

MetadataStorage.clear()

// Medusa integration tests use DB_HOST/DB_USERNAME/DB_PASSWORD, not DATABASE_URL.
if (process.env.DATABASE_URL && !process.env.DB_USERNAME) {
  const url = new URL(process.env.DATABASE_URL)
  process.env.DB_HOST = process.env.DB_HOST ?? url.hostname
  process.env.DB_PORT = process.env.DB_PORT ?? (url.port || "5432")
  process.env.DB_USERNAME = url.username || "postgres"
  process.env.DB_PASSWORD = url.password ?? ""
}
