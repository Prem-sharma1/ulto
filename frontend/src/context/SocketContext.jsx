import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        if (user) {
            const newSocket = io('http://localhost:5000');
            setSocket(newSocket);

            newSocket.on('connect', () => {
                // Once connected, join personal room
                newSocket.emit('join', user._id);
                // If driver, automatically toggle online
                if (user.role === 'driver') {
                    newSocket.emit('driver_online');
                }
            });

            return () => {
                newSocket.close();
            };
        } else {
            // Unauthenticated => clear socket
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
