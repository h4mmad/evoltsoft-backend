import express, { Request, Response } from "express";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { db } from "..";
import { generateToken } from "./auth-utils";

const authRouter = express.Router();

authRouter.post("/api/auth/sign-up", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Check is user already in db
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser.length > 0) {
      res.status(400).json({ error: "User already exists with this email" });
      return;
    }

    // hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // If user does not exist, create the user
    const userToCreate = await db
      .insert(users)
      .values({
        email: email,
        name: name,
        id: userId,
        password: hashedPassword,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    // const token = generateToken({
    //   email: userToCreate[0].email,
    //   name: userToCreate[0].name,
    //   userId: userToCreate[0].id,
    // });

    const user = userToCreate[0];

    res.status(201).json({ message: "Sign up successful", user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

authRouter.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password: reqPassword } = req.body;
    if (!email || !reqPassword) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // find user by email
    const userArray = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (userArray.length == 0) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const { password: dbPassword, ...user } = userArray[0];

    const isPasswordValid = await bcrypt.compare(reqPassword, dbPassword);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500);
  }
});

export default authRouter;
