# ulto - Technical Project Documentation

This document provides a comprehensive breakdown of the entire **ulto** codebase, explaining the architecture, data flow, and file-by-file logic.

---

## 🏗️ 1. Architecture Overview
**ulto** is a real-time, full-stack monorepo application.
- **Backend**: Node.js/Express with MongoDB for storage and Socket.io for real-time signaling.
- **Frontend**: React (Vite), Redux Toolkit (State Management), React-Leaflet (Maps), and Framer Motion (Animations).

### The Real-Time "Loop"
1. **Rider** sends a request via API.
2. **Server** saves the ride and broadcasts a Socket event to all **Drivers**.
3. **Driver** accepts via API, and the server notifies the **Rider** via a targeted Socket event.
4. **Both** start watching their GPS and relaying coordinates through the Server to each other's maps.

---

## 🛠️ 2. Backend Breakdown (`backend/`)

### `server.js`
- **Purpose**: Main entry point.
- **Logic**: 
  - Initializes Express and an HTTP server.
  - Connects to **MongoDB Atlas**.
  - Injects the `io` (Socket) instance into the `rideController` so the server can "shout" new ride requests automatically.

### `socketHandler.js`
- **Purpose**: Manages WebSocket connections.
- **Key Events**:
  - `join`: Maps a socket to a specific `userId` room for private notifications.
  - `driver_online`: Adds a driver to the `"drivers"` room to receive broadcasts.
  - `update_location`: The "Relay" - takes coordinates from one user and sends them to the `targetId`.

### `controllers/rideController.js`
- **`requestRide`**: Saves the ride to DB and immediately uses `io.to('drivers').emit` to push the notification to drivers.
- **`acceptRide`**: Updates status to `accepted` and links the `driverId`.
- **`getPendingRides`**: Allows drivers to see any waiting passengers that were requested *before* the driver logged in.

### `models/Ride.js`
- Stores `riderId`, `driverId`, `fare`, `status`, and location objects.
- **Location objects** contain both the string address and the `lat`/`lng` numbers for mapping.

---

## 🎨 3. Frontend Breakdown (`frontend/`)

### `src/store/` (Redux)
- **`authSlice.js`**: Handles Login/Register async thunks. Stores the `user` object and `token`.
- **`rideSlice.js`**: Tracks the `activeRide`. If a ride is persistent in the DB, this slice keeps the UI synced.

### `src/context/SocketContext.jsx`
- Creates a single Socket connection when the user logs in.
- Automatically handles room joining (`join` and `driver_online`) so the developer doesn't have to worry about it in every component.

### `src/pages/Dashboard.jsx` (The Core)
This is the most complex component in the project.
- **Role Detection**: Renders different sidebars for Riders (Search) vs Drivers (Incoming List).
- **Geocoding**: Uses the Nominatim API to turn text addresses into coordinates.
- **Bottom Sheet (Mobile)**: Uses `framer-motion` to animate the search panel on small screens. When on mobile, `isSheetOpen` toggles the panel height while the map fills the background.
- **Live Tracker**:
  - `navigator.geolocation.watchPosition`: Constantly checks the phone's GPS.
  - `setMarkers`: Updates markers for both "You" and "Other Person".
  - **Polyline**: Draws the dotted line connecting the two on the map.
  - **Distance/ETA**: Uses the Haversine formula to calculate real-time distance and estimated arrival time.

---

## 📱 4. Responsiveness Logic
The app uses a "Mobile-Primary" design:
- **Desktop**: A standard sidebar on the left (`md:w-80`).
- **Mobile**: A semi-transparent overlay at the bottom.
- **Fluid UI**: All font sizes and paddings use Tailwind's responsive modifiers (`text-4xl md:text-8xl`) to ensure a premium feel on all screen sizes.

---

## 🚀 5. Deployment Notes (Vercel)
Since the repo is a monorepo, Vercel must be configured to use the **Root Directory: `frontend`**.
This ensures that Vercel finds the correct `package.json` and `vite` build commands.

---

## 📈 6. Data Flow Summary
1. **User Action** -> **API Call** -> **DB Update**
2. **DB Update** -> **Socket Broadcast** -> **Remote UI Update**
3. **GPS Change** -> **Socket Relay** -> **Live Map Update**
