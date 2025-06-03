require("dotenv").config();

import { v4 as uuidv4 } from "uuid";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, InferInsertModel } from "drizzle-orm";
import express, { Request, Response } from "express";
import { exit } from "process";

import { chargingStations } from "./schema";
import authRouter from "./auth/auth";
import { authenticate } from "./auth/auth-utils";
import cors from "cors";

const port = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());

export type ChargingStation = InferInsertModel<typeof chargingStations>;

if (!process.env.DATABASE_URL) {
  console.log("DATABASE URL not found");
  exit(1);
}

export const db = drizzle(process.env.DATABASE_URL);
if (!db) {
  console.log("Database connection failed");
  exit(1);
}
app.use(authRouter);

app.post(
  "/api/charging-stations",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { name, latitude, longitude, status, powerOutput, connectorType } =
        req.body as ChargingStation;

      const result = await db
        .insert(chargingStations)
        .values({
          id: uuidv4(),
          connectorType,
          latitude,
          longitude,
          name,
          powerOutput,
          status,
        })
        .returning({
          id: chargingStations.id,
          name: chargingStations.name,
          latitude: chargingStations.latitude,
          longitude: chargingStations.longitude,
          status: chargingStations.status,
          powerOutput: chargingStations.powerOutput,
          connectorType: chargingStations.connectorType,
        });
      res
        .status(201)
        .json({ message: "Charging station inserted", data: result[0] });
      console.log("Charging station inserted");
      return;
    } catch (err) {
      res.status(400).json({ error: err });
    }
  }
);

app.patch(
  "/api/charging-stations/:id",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, latitude, longitude, status, powerOutput, connectorType } =
        req.body as ChargingStation;
      const result = await db
        .update(chargingStations)
        .set({
          name,
          latitude,
          longitude,
          status,
          powerOutput,
          connectorType,
        })
        .where(eq(chargingStations.id, id))
        .returning({
          id: chargingStations.id,
          name: chargingStations.name,
          latitude: chargingStations.latitude,
          longitude: chargingStations.longitude,
          status: chargingStations.status,
          powerOutput: chargingStations.powerOutput,
          connectorType: chargingStations.connectorType,
        });
      if (result.length === 0) {
        res.status(404).json({ error: "Charging station not found" });
        return;
      }
      res.status(200).json({
        message: "Charging station updated successfully",
        data: result[0],
      });
      return;
    } catch (err) {
      res.status(500).json({ error: err });
      return;
    }
  }
);

app.get("/api/charging-stations", authenticate, async (req, res) => {
  try {
    const result = await db.select().from(chargingStations);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ err });
    return;
  }
});

// will delete from db
// can also use soft delete, by keep one field in the table like 'isDeleted' boolean
app.delete("/api/charging-stations/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db
      .delete(chargingStations)
      .where(eq(chargingStations.id, id));

    res.status(200).json({ message: "Charging station deleted successfully" });
    return;
  } catch (err) {
    res.status(500).json({ err });
    return;
  }
});

app.listen(port, () => {
  console.log("Server running on port: ", port);
});
