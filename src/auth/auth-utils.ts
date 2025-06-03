import { RequestHandler } from "express";
import { exit } from "process";
import jwt, { JsonWebTokenError } from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  console.log("JWT_SECRET not found");
  exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email?: string;
        name?: string;
      };
    }
  }
}

// Auth Middleware
// If expired, re-verify the token
// attach user to req
const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("authHeader", authHeader);
    if (!authHeader) {
      res.status(401).json({ error: "Access token required" });
      return;
    }
    if (!authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Access token required" });
      return;
    }

    const token = authHeader?.split(" ")[1];
    console.log("token", token);

    if (token === null || token === undefined || token === "null") {
      console.log("No token provided");
      res.status(401).json({ error: "Access token required" });
      return;
    }

    const decoded = verifyToken(token) as any;

    req.user = {
      userId: decoded.user.userId,
      email: decoded.user.email,
      name: decoded.user.name,
    };

    next();
  } catch (err: any) {
    if (err instanceof JsonWebTokenError) {
      console.log(err);
      res.status(400).json({ error: err });
      return;
    }
    res.status(500).json({ error: err });
    return;
  }
};

const generateToken = (user: {
  userId: string;
  email: string;
  name: string;
}) => {
  return jwt.sign({ user }, JWT_SECRET, { expiresIn: "7d" });
};

const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};

const validateSignup: RequestHandler = (req, res, next) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: "Email, password, and name are required" });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Invalid email format" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  next();
};

export { generateToken, verifyToken, validateSignup, authenticate };
