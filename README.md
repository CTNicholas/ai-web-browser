# AI Web Browser

A React Electron application featuring a tabbed web browser interface with authentication backend.

## Features

- 🌐 **Tabbed Browser**: Create, switch, and close browser tabs
- ⚡ **Hot Module Replacement**: Real-time React component updates during development
- 🎨 **Tailwind CSS**: Modern, responsive styling
- 🔐 **Authentication Server**: Node.js backend with JWT authentication
- ⚛️ **TypeScript**: Full TypeScript support for type safety
- 🖥️ **Electron**: Native desktop application

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Desktop**: Electron with BrowserView for tab content
- **Backend**: Node.js, Express, JWT authentication, bcryptjs
- **Build**: Vite for React bundling, Electron Builder for distribution

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development environment:
   ```bash
   npm run dev
   ```

   This command starts:
   - Node.js authentication server on port 3001
   - React development server with HMR on port 3000
   - Electron desktop application

### Available Scripts

- `npm run dev` - Start full development environment
- `npm run server` - Start Node.js server only
- `npm run react-dev` - Start React development server only
- `npm run electron-dev` - Start Electron app only
- `npm run react-build` - Build React app for production
- `npm run build` - Build complete application
- `npm run dist` - Create distributable packages

## Liveblocks Integration

The application includes **Liveblocks v3.2.1** for real-time collaborative features:

### Features
- ✅ **LiveblocksProvider** with authentication endpoint
- ✅ **RoomProvider** for collaborative sessions  
- ✅ **Liveblocks React UI** components and default styles
- 🔗 Authentication endpoint at `http://localhost:3001/liveblocks-auth`

### Authentication API
```bash
curl -X POST http://localhost:3001/liveblocks-auth \
  -H "Content-Type: application/json"
```

The endpoint automatically generates anonymous users with random avatars and provides full room access. In production, implement proper user authentication and granular permissions.

### Environment Setup
Add your Liveblocks secret key to `.env`:
```
LIVEBLOCKS_SECRET_KEY=sk_dev_your-actual-liveblocks-secret-key
```

## Browser Features

- **Tab Management**: Create new tabs, switch between them, close tabs
- **Navigation**: Address bar with URL navigation and search
- **Web Content**: Each tab renders web content via Electron BrowserView
- **Responsive UI**: Tailwind CSS provides modern, responsive design

## Development

The application uses:
- **HMR**: React components update in real-time during development
- **TypeScript**: Strong typing throughout the application
- **ESLint**: Code quality and consistency
- **Auto-restart**: Server restarts automatically on changes

## Configuration

Environment variables (`.env`):
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001
```

## Project Structure

```
├── public/           # Electron main process
├── server/           # Node.js authentication server
├── src/              # React application
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   └── types.ts      # TypeScript type definitions
├── build/            # Built React app
└── dist/            # Electron distribution packages
```

## Demo Credentials

Default user for testing:
- Email: `demo@example.com`
- Password: `password`