# Design Patterns in ulto

This document analyzes the architectural and design patterns used in the **ulto** codebase. Understanding these patterns is key to understanding how modern full-stack applications are built.

---

## 1. Architectural Patterns

### MVC (Model-View-Controller)
The backend follows the MVC pattern to separate concerns.
- **Model**: `backend/models/Ride.js` and `User.js`. These define the data schema.
- **View**: The React Frontend fetches and displays data.
- **Controller**: `backend/controllers/rideController.js`. Contains the business logic (e.g., accepting a ride).
- **Benefit**: Decouples logic from the user interface, making it easier to test and modify.

### Client-Server Architecture
The project is built as two separate entities communicating over HTTP and WebSockets.
- **Benefit**: Allows the frontend to be deployed to a CDN (like Vercel) and the backend to a cloud server (like Render).

---

## 2. Real-Time Patterns

### Observer / Pub-Sub (Socket.io)
The most critical pattern for a ride-sharing app.
- **Implementation**:
  - **Subscribe**: Drivers "join" a room called `"drivers"` in `backend/socketHandler.js`.
  - **Publish**: The server "emits" a message to that room in `backend/controllers/rideController.js`.
- **Snippet**: `ioInstance.to('drivers').emit('new_ride_request', rideData);`

### Singleton Pattern
Used for the Socket connection and Database connection.
- **Implementation**: We ensure only one instance of the Socket connection exists globally via `SocketProvider` in `frontend/src/context/SocketContext.jsx`.
- **Benefit**: Prevents memory leaks and multiple redundant connections.

---

## 3. Frontend Patterns

### Provider Pattern (React Context)
Used to share the Socket connection across the entire component tree without "prop drilling" (passing props through many layers).
- **Snippet**: `<SocketContext.Provider value={socket}>` in `SocketContext.jsx`.

### Unidirectional Data Flow (Flux/Redux)
Data in **ulto** flows in one direction:
1. **User Action** (Click "Find Ride").
2. **Dispatch** an action to the Store.
3. **Store** updates.
4. **UI** re-renders based on the new store state.
- **Benefit**: Makes the state of the app highly predictable.

### Strategy Pattern (Adaptive UI)
The `Dashboard.jsx` component uses a strategy to change its rendering based on screen size.
- **Code**: Conditional rendering and animation values based on `window.innerWidth < 768`.
- **Benefit**: Provides a native-app feel on mobile (Bottom Sheet) while remaining a powerful desktop tool.

---

## 4. Security & Logic Patterns

### Middleware Pattern (Express)
In `backend/middleware/authMiddleware.js`, we use the middleware pattern to intercept requests.
- **Logic**: All `rideRoutes` go through the `protect` function first.
- **Benefit**: Centralizes security logic. You only write the "Check for Token" code once.

### Stateless Authentication (JWT)
Instead of storing user sessions on the server, we use **JSON Web Tokens**.
- **Pattern**: The server signs a token and gives it to the user. The server doesn't "remember" the user; it just validates the token on every request.
- **Benefit**: Allows the backend to scale horizontally across multiple servers easily.

---

## 5. UI/UX Patterns

### Glassmorphism
A modern UI pattern using background blurs and translucent colors.
- **Implementation**: `glass` and `glass-input` classes in `index.css`.
- **Benefit**: Creates a high-end, futuristic aesthetic.

### Skeleton / Loading State Pattern
Uses `isLoading` flags from Redux to show "Processing..." text on buttons.
- **Benefit**: Provides immediate visual feedback to the user while data is traveling.
