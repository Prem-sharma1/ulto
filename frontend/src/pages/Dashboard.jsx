import { useState, useEffect, useRef } from 'react';
import { MapPin, LogOut, Navigation, CheckCircle, Car, Clock, Route } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, reset } from '../store/authSlice';
import { requestRide, setActiveRide } from '../store/rideSlice';
import { useSocket } from '../context/SocketContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix basic leaflet icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom colored marker icons
const createColorIcon = (color) => new L.DivIcon({
  html: `<div style="
    width:28px;height:28px;border-radius:50%;background:${color};
    border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);
    display:flex;align-items:center;justify-content:center;
  "><div style="width:8px;height:8px;border-radius:50%;background:white;"></div></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  className: '',
});

const riderIcon = createColorIcon('#6366f1');   // purple-blue for rider
const driverIcon = createColorIcon('#10b981');  // green for driver
const pickupIcon = createColorIcon('#3b82f6');  // blue for pickup
const dropoffIcon = createColorIcon('#f59e0b'); // amber for dropoff

// Haversine distance in km
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// Component to recenter map dynamically
const RecenterMap = ({ markers }) => {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map(m => m.position));
      map.fitBounds(bounds, { padding: [60, 60] });
    } else if (markers.length === 1) {
      map.setView(markers[0].position, 15);
    }
  }, [markers, map]);
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const socket = useSocket();
  const { user } = useSelector((state) => state.auth);
  const { isLoading, activeRide } = useSelector((state) => state.ride);
  const role = user ? user.role : 'rider';

  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [markers, setMarkers] = useState([]);
  const [status, setStatus] = useState('');
  const [liveReqs, setLiveReqs] = useState([]);

  // Live tracking state
  const [rideAccepted, setRideAccepted] = useState(false);
  const [acceptedRideData, setAcceptedRideData] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [otherLocation, setOtherLocation] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [etaMin, setEtaMin] = useState(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // ---- DRIVER: Listen for ride requests ----
  useEffect(() => {
    if (socket && role === 'driver') {
      socket.emit('driver_online');

      const fetchPending = async () => {
        try {
          const res = await fetch('http://localhost:5000/api/rides/pending', {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          const data = await res.json();
          if (res.ok && Array.isArray(data) && data.length > 0) {
            setLiveReqs(data);
          }
        } catch (e) {
          console.error('Failed to fetch pending rides:', e);
        }
      };
      fetchPending();

      socket.on('new_ride_request', (rideData) => {
        console.log('Driver received new ride request:', rideData);
        setLiveReqs(prev => {
          if (prev.find(r => String(r._id) === String(rideData._id))) return prev;
          return [...prev, rideData];
        });
      });
      return () => socket.off('new_ride_request');
    }
  }, [socket, role]);

  // ---- RIDER: Listen for ride_accepted ----
  useEffect(() => {
    if (socket && role === 'rider') {
      socket.on('ride_accepted', (data) => {
        console.log('Ride accepted by driver:', data);
        setRideAccepted(true);
        setAcceptedRideData(data);
        setStatus('Driver is on the way! 🚗');
      });
      return () => socket.off('ride_accepted');
    }
  }, [socket, role]);

  // ---- BOTH: Listen for other user's location updates ----
  useEffect(() => {
    if (socket && rideAccepted) {
      socket.on('location_update', (data) => {
        const loc = data.location;
        setOtherLocation([loc.lat, loc.lng]);
      });
      return () => socket.off('location_update');
    }
  }, [socket, rideAccepted]);

  // ---- BOTH: Start sharing own location after ride accepted ----
  useEffect(() => {
    if (rideAccepted && acceptedRideData && socket) {
      // Determine who we're tracking
      const targetId = role === 'rider' ? acceptedRideData.driverId : acceptedRideData.riderId;

      if (navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setMyLocation([loc.lat, loc.lng]);
            socket.emit('update_location', {
              userId: user._id,
              targetId: targetId,
              location: loc,
            });
          },
          (err) => console.error('Geolocation error:', err),
          { enableHighAccuracy: true, maximumAge: 3000 }
        );
        watchIdRef.current = id;
      }

      return () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
      };
    }
  }, [rideAccepted, acceptedRideData, socket]);

  // ---- Calculate distance & ETA when both locations are known ----
  useEffect(() => {
    if (myLocation && otherLocation) {
      const dist = getDistanceKm(myLocation[0], myLocation[1], otherLocation[0], otherLocation[1]);
      setDistanceKm(dist);
      // Rough ETA: assume 25 km/h average speed in city
      setEtaMin(Math.max(1, Math.round((dist / 25) * 60)));

      // Update map markers to show both
      const meLabel = role === 'rider' ? 'You (Rider)' : 'You (Driver)';
      const otherLabel = role === 'rider' ? 'Your Driver' : 'Passenger';
      setMarkers([
        { position: myLocation, popup: meLabel, icon: role === 'rider' ? riderIcon : driverIcon },
        { position: otherLocation, popup: otherLabel, icon: role === 'rider' ? driverIcon : riderIcon },
      ]);
    }
  }, [myLocation, otherLocation]);

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/');
  };

  const geocode = async (address) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), address };
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleAcceptRide = async (req) => {
    try {
      const token = user.token;
      const res = await fetch(`http://localhost:5000/api/rides/${req._id}/accept`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        // Notify the rider via socket
        if (socket) {
          socket.emit('accept_ride', {
            rideId: req._id,
            driverId: user._id,
            riderId: req.riderId,
          });
        }
        // Show pickup on map
        setMarkers([
          { position: [req.pickupLocation.lat, req.pickupLocation.lng], popup: `Pickup: ${req.pickupLocation.address}`, icon: pickupIcon },
          ...(req.dropLocation?.lat ? [{ position: [req.dropLocation.lat, req.dropLocation.lng], popup: `Dropoff: ${req.dropLocation.address}`, icon: dropoffIcon }] : [])
        ]);
        setLiveReqs(prev => prev.filter(r => String(r._id) !== String(req._id)));
        setRideAccepted(true);
        setAcceptedRideData({ rideId: req._id, driverId: user._id, riderId: req.riderId });
        setStatus('Ride accepted! Head to pickup.');
      } else {
        alert(data.message || 'Could not accept ride');
      }
    } catch (err) {
      alert('Error accepting ride: ' + err.message);
    }
  };

  const getLiveLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setStatus("Acquiring GPS signal...");
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setMarkers([{ position: [latitude, longitude], popup: "My Location" }]);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        if (data && data.display_name) {
           setPickup(data.display_name);
           setStatus("");
        } else {
           setPickup(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      } catch(err) {
        setPickup(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    }, (error) => {
      alert("Unable to retrieve your location: " + error.message);
      setStatus("");
    });
  };

  const handleFindRide = async () => {
    if (!pickup || !dropoff) return alert("Please enter both locations");
    setStatus("Geocoding locations...");
    
    const pickupData = await geocode(pickup);
    const dropoffData = await geocode(dropoff);
    
    if (!pickupData || !dropoffData) {
       setStatus("Location not found. Try more specific addresses.");
       return;
    }

    setMarkers([
      { position: [pickupData.lat, pickupData.lng], popup: `Pickup: ${pickupData.address}`, icon: pickupIcon },
      { position: [dropoffData.lat, dropoffData.lng], popup: `Dropoff: ${dropoffData.address}`, icon: dropoffIcon }
    ]);

    setStatus("Requesting ride...");
    const distKm = getDistanceKm(pickupData.lat, pickupData.lng, dropoffData.lat, dropoffData.lng);
    const fareEstimate = Math.max(25, Math.round(distKm * 12)); // ₹12 per km, minimum ₹25
    
    const ridePayload = {
      pickupLocation: pickupData,
      dropLocation: dropoffData,
      fare: fareEstimate
    };

    dispatch(requestRide(ridePayload))
      .unwrap()
      .then(() => {
         setStatus('Waiting for driver to accept...');
      })
      .catch((err) => {
         setStatus('Failed: ' + err);
      });
  };

  const defaultCenter = [28.6139, 77.2090]; 

  // Build the tracking info panel (shown to both rider and driver after acceptance)
  const TrackingPanel = () => (
    <div className="bg-dark-800 p-5 rounded-2xl border border-accent-500/30 shadow-lg relative overflow-hidden mt-4">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-500 to-primary-500 animate-pulse"></div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-accent-500/20 rounded-full flex items-center justify-center">
          <Car className="text-accent-500" size={20}/>
        </div>
        <div>
          <h4 className="font-bold text-white">{role === 'rider' ? 'Driver En Route' : 'Heading to Pickup'}</h4>
          <p className="text-xs text-gray-400">Live tracking active</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-dark-700/50 p-3 rounded-xl border border-white/5 text-center">
          <Route size={16} className="text-primary-400 mx-auto mb-1"/>
          <p className="text-lg font-bold text-white">{distanceKm !== null ? distanceKm.toFixed(1) : '--'} km</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Distance</p>
        </div>
        <div className="bg-dark-700/50 p-3 rounded-xl border border-white/5 text-center">
          <Clock size={16} className="text-accent-400 mx-auto mb-1"/>
          <p className="text-lg font-bold text-white">{etaMin !== null ? etaMin : '--'} min</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">ETA</p>
        </div>
      </div>

      {/* Pulsing live indicator */}
      <div className="flex items-center gap-2 mt-2">
        <div className="relative w-3 h-3">
          <div className="absolute inset-0 bg-accent-500 rounded-full animate-ping opacity-50"></div>
          <div className="relative w-3 h-3 bg-accent-500 rounded-full"></div>
        </div>
        <span className="text-xs text-gray-300">Live location shared</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col md:flex-row">
      <aside className="w-full md:w-80 glass flex flex-col md:h-screen sticky top-0 z-20 shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div className="text-xl font-black tracking-tighter">
            RIDE<span className={role === 'rider' ? 'text-primary-500' : 'text-accent-500'}>X</span>
          </div>
          <button onClick={onLogout} className="text-gray-400 hover:text-white transition-colors">
            <LogOut size={20}/>
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center text-xl font-bold border border-white/10">
               {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="font-bold tracking-wide">{user?.name || 'Guest User'}</h3>
              <p className="text-sm text-gray-400">{role === 'rider' ? 'Rider Account' : 'Driver Account'}</p>
            </div>
          </div>

          {role === 'rider' ? (
            <>
             <div className="bg-dark-800 p-5 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-transparent"></div>
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <MapPin className="text-primary-500 w-4" /> Request a Ride
                </h4>
                
                <div className="space-y-4 relative z-10">
                  <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-gray-600 border-l border-dashed border-gray-500"></div>
                  <div className="flex gap-3 items-center">
                    <div className="w-6 h-6 rounded-full bg-dark-900 border border-primary-500 flex items-center justify-center relative z-10 shadow shadow-primary-500/20">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    </div>
                    <div className="flex-1 flex gap-2">
                       <input type="text" value={pickup} onChange={e=>setPickup(e.target.value)} className="glass-input w-full p-2.5 text-sm font-medium" placeholder="Pickup location, e.g. New Delhi" />
                       <button onClick={getLiveLocation} title="Use my location" className="bg-primary-600/20 hover:bg-primary-600/40 text-primary-500 p-2.5 rounded-lg border border-primary-500/30 transition-colors flex-shrink-0">
                          <Navigation size={18} />
                       </button>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="w-6 h-6 rounded-full bg-dark-900 border border-accent-500 flex items-center justify-center relative z-10 shadow shadow-accent-500/20">
                       <MapPin size={12} className="text-accent-500"/>
                    </div>
                    <input type="text" value={dropoff} onChange={e=>setDropoff(e.target.value)} className="glass-input w-full p-2.5 text-sm font-medium" placeholder="Where to?" />
                  </div>
                </div>

                {status && <p className="text-sm text-accent-500 mt-4 font-semibold text-center">{status}</p>}

                <button onClick={handleFindRide} disabled={isLoading || activeRide || rideAccepted} className="primary-btn w-full mt-6 py-3 font-bold tracking-wide relative overflow-hidden group">
                  <span className="relative z-10">
                    {isLoading ? 'Processing...' : rideAccepted ? '🚗 Driver Matched!' : activeRide ? 'Waiting for Driver...' : 'Find Ride'}
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
             </div>

             {/* Show tracking panel when ride is accepted */}
             {rideAccepted && <TrackingPanel />}
            </>
          ) : (
            <div>
              {!rideAccepted ? (
                <>
                  <div className="bg-dark-800 p-6 rounded-xl border border-white/5 mb-6 text-center">
                    <div className="w-20 h-20 bg-accent-500/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                      <div className="absolute inset-2 border-2 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-accent-500 font-bold block text-lg relative z-10">ON</span>
                    </div>
                    <h4 className="font-bold text-lg mb-1">Searching Area</h4>
                    <p className="text-sm text-gray-400">Listening for passenger requests...</p>
                  </div>

                  {liveReqs.length > 0 && (
                    <div className="space-y-4">
                       <h4 className="font-bold text-white mb-2">Incoming Requests</h4>
                       {liveReqs.map((req, i) => (
                          <div key={req._id || i} className="bg-dark-700/50 p-4 border border-white/10 rounded-lg shadow-lg">
                            <div className="flex items-center gap-2 mb-2">
                               <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></div>
                               <p className="text-sm font-bold text-accent-500">New Request</p>
                            </div>
                            <p className="text-xs text-gray-300 mb-1"><span className="font-semibold text-white">From:</span> {req.pickupLocation?.address || 'Unknown'}</p>
                            <p className="text-xs text-gray-300 mb-3"><span className="font-semibold text-white">To:</span> {req.dropLocation?.address || 'Unknown'}</p>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                               <span className="font-bold text-lg text-primary-400">₹{req.fare}</span>
                               <button onClick={() => handleAcceptRide(req)} className="flex items-center gap-1.5 bg-accent-600 hover:bg-accent-500 text-white px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 shadow-lg shadow-accent-500/20 hover:shadow-accent-500/40">
                                  <CheckCircle size={14}/> Accept
                               </button>
                            </div>
                          </div>
                       ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-dark-800 p-5 rounded-2xl border border-accent-500/30 shadow-lg text-center mb-4">
                    <CheckCircle className="text-accent-500 mx-auto mb-2" size={32}/>
                    <h4 className="font-bold text-lg text-white">Ride Accepted!</h4>
                    <p className="text-sm text-gray-400 mt-1">Navigate to the passenger</p>
                  </div>
                  <TrackingPanel />
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 relative h-[50vh] md:h-screen w-full bg-dark-800 z-10">
        <MapContainer 
           center={markers.length > 0 ? markers[0].position : defaultCenter} 
           zoom={13} 
           style={{ height: '100%', width: '100%', zIndex: 10 }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          {markers.map((marker, idx) => (
            <Marker key={idx} position={marker.position} icon={marker.icon || new L.Icon.Default()}>
              <Popup className="text-dark-900 font-bold">{marker.popup}</Popup>
            </Marker>
          ))}
          {/* Draw a line between rider and driver when both locations are known */}
          {myLocation && otherLocation && (
            <Polyline
              positions={[myLocation, otherLocation]}
              pathOptions={{ color: '#6366f1', weight: 3, dashArray: '10, 8', opacity: 0.8 }}
            />
          )}
          <RecenterMap markers={markers} />
        </MapContainer>

        {/* Floating distance badge on the map */}
        {rideAccepted && distanceKm !== null && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-dark-900/90 backdrop-blur-lg border border-white/10 rounded-full px-6 py-3 flex items-center gap-4 shadow-2xl">
            <div className="flex items-center gap-2">
              <Route size={16} className="text-primary-400"/>
              <span className="font-bold text-white">{distanceKm.toFixed(1)} km</span>
            </div>
            <div className="w-px h-6 bg-white/10"></div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-accent-400"/>
              <span className="font-bold text-white">{etaMin} min</span>
            </div>
            <div className="w-px h-6 bg-white/10"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-300">LIVE</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
