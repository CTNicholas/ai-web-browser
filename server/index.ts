import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Liveblocks } from '@liveblocks/node';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Initialize Liveblocks
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || 'sk_dev_your-liveblocks-secret-key-here',
});

app.use(cors());
app.use(express.json());

// Mock user database (replace with real database in production)
const users = [
  {
    id: 1,
    email: 'demo@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
  },
];

interface User {
  id: number;
  email: string;
  password: string;
}

interface AuthRequest extends express.Request {
  user?: User;
}

// Middleware to verify JWT token
const authenticateToken = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Liveblocks authentication endpoint
app.post('/liveblocks-auth', async (req, res) => {
  try {
    // Get the current user from the request (in a real app, this would come from session/JWT)
    const user = {
      id: `user-${Date.now()}`,
      info: {
        name: 'Anonymous User',
        avatar: `https://liveblocks.io/avatars/avatar-${Math.floor(Math.random() * 30)}.png`,
        color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      },
    };

    // Create a session for the user
    const session = liveblocks.prepareSession(user.id, {
      userInfo: user.info,
    });

    // Give the user access to any room (in production, implement proper permissions)
    session.allow('*', session.FULL_ACCESS);

    // Authorize and return the response
    const { status, body } = await session.authorize();

    return res.status(status).end(body);
  } catch (error) {
    console.error('Liveblocks auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
