# ulto - Premium Uber Clone

A full-stack, real-time ride-sharing application built with React, Node.js, Socket.io, and MongoDB. 

## Features

- **Real-time Tracking**: Live location sharing between Rider and Driver.
- **Smart Dispatch**: Interactive map with automated ride requests.
- **Role-based Dashboards**: Custom interfaces for Riders and Drivers.
- **Auth System**: Secure JWT-based authentication.
- **Premium UI**: Modern dark-mode aesthetic with Glassmorphism and animations.

## Tech Stack

- **Frontend**: React, Redux Toolkit, Tailwind CSS v4, Framer Motion, Leaflet.
- **Backend**: Node.js, Express, Socket.io, Mongoose.
- **Database**: MongoDB Atlas.

## Getting Started

### Prerequisites

- Node.js installed.
- MongoDB Atlas account.

### Installation

1. Clone the repository.
2. Setup environment variables:
   - Create `backend/.env` with:
     ```
     PORT=5000
     MONGO_URI=your_mongodb_uri
     JWT_SECRET=your_jwt_secret
     ```
3. Install dependencies:
   ```bash
   # In root directory
   cd backend && npm install
   cd ../frontend && npm install
   ```
4. Run the application:
   ```bash
   # Backend (from backend directory)
   npm run dev
   ```
   ```bash
   # Frontend (from frontend directory)
   npm run dev
   ```

## License

MIT
