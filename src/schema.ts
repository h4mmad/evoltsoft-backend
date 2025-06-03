import {
  pgTable,
  text,
  numeric,
  uuid,
  pgEnum,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["active", "inactive"]);

export const chargingStations = pgTable("charging_stations", {
  id: uuid("id").notNull().primaryKey(),
  name: text("name").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: numeric("longitude", { precision: 11, scale: 8 }).notNull(),
  status: statusEnum("status").notNull(),
  powerOutput: numeric("power_output_kW").notNull(),
  connectorType: text("connector_type").notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    password: text("password").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("email_unique_idx").on(table.email)]
);
