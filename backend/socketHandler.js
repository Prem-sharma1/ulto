// Socket Event Handlers
const setupSocketInteractions = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected to Socket:', socket.id);

    // Join a personal room based on UserId for direct messages
    socket.on('join', (userId) => {
       socket.join(userId);
       console.log(`User ${userId} joined their personal room`);
    });

    // Rider requests a ride
    socket.on('request_ride', (rideData) => {
       console.log('Ride requested via Socket:', rideData);
       // Broadcast loosely to all drivers (in a real app, use geospatial radius)
       // Assuming drivers join a 'drivers' room upon connecting
       io.to('drivers').emit('new_ride_request', rideData);
    });

    // Driver accepts a ride
    socket.on('accept_ride', (data) => {
       const { rideId, driverId, riderId } = data;
       console.log(`Driver ${driverId} accepted ride ${rideId}`);
       // Notify the specific rider
       io.to(riderId).emit('ride_accepted', { rideId, driverId });
    });

    // Share Live Location
    socket.on('update_location', (data) => {
       const { userId, targetId, location } = data;
       // TargetId could be the rider waiting for the driver, or vice versa
       if (targetId) {
           io.to(targetId).emit('location_update', { userId, location });
       }
    });

    // Driver toggle availability
    socket.on('driver_online', () => {
       socket.join('drivers');
       console.log('Driver is online and joined drivers room');
    });

    socket.on('driver_offline', () => {
       socket.leave('drivers');
    });

    socket.on('disconnect', () => {
       console.log('User disconnected from Socket:', socket.id);
    });
  });
};

module.exports = { setupSocketInteractions };
