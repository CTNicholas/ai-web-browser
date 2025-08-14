import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Liveblocks } from "@liveblocks/node";

dotenv.config({ path: ".env" });

const app = express();
const PORT = 3002;

if (!process.env.LIVEBLOCKS_SECRET_KEY) {
  console.error("Error: LIVEBLOCKS_SECRET_KEY environment variable is required");
  process.exit(1);
}

// Initialize Liveblocks
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY,
});

app.use(cors());
app.use(express.json());

// Liveblocks authentication endpoint
app.post("/liveblocks-auth", async (req, res) => {
  try {
    // Get the current user from the request (in a real app, this would come from session/JWT)
    const user = {
      id: `user-${Date.now()}`,
      info: {
        name: "Anonymous User",
        avatar: `https://liveblocks.io/avatars/avatar-${Math.floor(Math.random() * 10)}.png`,
        color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      },
    };

    // Create a session for the user
    const session = liveblocks.prepareSession(user.id, {
      userInfo: user.info,
    });

    // Give the user access to any room (in production, implement proper permissions)
    session.allow("*", session.FULL_ACCESS);

    // Authorize and return the response
    const { status, body } = await session.authorize();

    return res.status(status).end(body);
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
