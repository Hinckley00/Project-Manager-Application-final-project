## Project Manager App – Realtime Tasks, Comments, and Assets

Modern task management with a clean, tabbed UI, realtime comments, emoji reactions, image assets, and secure cookie-based auth.

### Features
- **Tabbed Task View**
  - **Task Detail**: priority, status, created date, due date, description, assets, team members, links, subtasks
  - **Activities/Timeline**: chat-like feed with realtime comments and reactions
- **Realtime Collaboration**
  - Socket.IO rooms per task (targeted broadcasts)
  - Live updates for new/edit/delete comments and emoji reactions
  - Optional @mentions notify mentioned users in realtime
- **Emoji Reactions**
  - Click to pick from curated emoji list
  - Each user has at most one reaction per comment (clicking a new emoji replaces the previous one)
- **Assets & Media**
  - Client-side validation and base64 conversion for images
  - Consistent asset shape: `{ name, link }` (used for `alt` and `src`)
- **Auth & API**
  - HTTP-only cookie JWT auth
  - RTK Query with `credentials: "include"` and Vite proxy for clean API calls
  - Robust error handling and auto-redirect on 401

### Tech Stack
- **Frontend**: React 18, Redux Toolkit Query, Vite, Tailwind-like utility classes, `socket.io-client`
- **Backend**: Node.js, Express, Socket.IO, Mongoose/MongoDB
- **Auth**: HTTP-only cookies (JWT)
- **Tooling**: Vite, Nodemon, Morgan, CORS

### Repository Structure (high level)
```
client/
  src/pages/TaskDetails.jsx        # Tabbed UI, realtime comments & reactions
  src/redux/slices/apiSlice.js     # RTK Query base (cookies + proxy)
  src/components/...               # UI components
server/
  server.js                        # Express + Socket.IO, room wiring
  controllers/commentController.js # CRUD + reactions (replace behavior)
  models/comment.js                # Comment + reaction schemas
  routes/commentRoutes.js          # /api/comment endpoints (protected)
  utils/connectDB.js               # MongoDB connection
```

### Prerequisites
- Node.js 18+
- MongoDB running locally or a connection string

### Environment Variables
Create `server/.env`:
```ini
PORT=8800
MONGODB_URI=mongodb://localhost:27017/taskmanager
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-strong-secret
```

Optional `client/.env` (only if you use it elsewhere):
```ini
VITE_APP_BASE_URL=http://localhost:8800
```

### Install & Run
Frontend:
```bash
cd client
npm install
npm run dev
```

Backend:
```bash
cd server
npm install
npm run dev
```

Default URLs:
- Frontend: `http://localhost:3000`
- Backend API & Socket.IO: `http://localhost:8800`

### How It Works (TaskDetails)
- The page connects to Socket.IO and joins `task-${taskId}`.
- Tabs switch between:
  - `Task Detail` (information cards, assets, subtasks)
  - `Activities/Timeline` (messages, reactions, input box)
- Comments are fetched via `/api/comment/task/:taskId` and updated in realtime.
- Reactions: backend replaces a user’s existing reaction on a comment; frontend mirrors this locally and over sockets.

### Key API Endpoints (protected)
- Comments
  - `GET /api/comment/task/:taskId`
  - `POST /api/comment` `{ taskId, content, mentions?, parentComment? }`
  - `PUT /api/comment/:commentId` `{ content, mentions? }`
  - `DELETE /api/comment/:commentId`
  - `POST /api/comment/:commentId/reactions` `{ emoji }`
  - `DELETE /api/comment/:commentId/reactions/:reactionId`
- Tasks
  - `GET /api/task/:id`

### Troubleshooting
- **Port 8800 in use**: change `PORT` in `server/.env` or kill the process holding the port.
- **MongoDB not connecting**: verify `MONGODB_URI`, ensure Mongo is running, and that `connectDB()` is called in `server.js`.
- **401 Unauthorized**: ensure cookies are sent. RTK Query is configured with `credentials: "include"` and the client uses the Vite proxy.
- **`process is not defined` in client**: don’t use `process.env.*` directly in the browser; prefer `import.meta.env` or constants.

### Customization Tips
- Update the `EMOJIS` array in `TaskDetails.jsx` to change the available reactions.
- Adjust spacing/appearance with utility classes (`space-y-*`, `p-*`, `bg-*`, `border-*`).
- Swap the default tab by setting `activeTab` initial value to `'activity'` or `'details'`.

### Security Notes
- JWT is stored in HTTP-only cookies; no token in JS-accessible storage.
- CORS and credentials are configured on both client and server.

### License
This project is provided as-is for educational and internal use. Add your preferred license here.


