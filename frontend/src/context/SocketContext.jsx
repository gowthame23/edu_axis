import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getSocketBaseUrl } from '../config/runtime';

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Connect to the socket server
      const newSocket = io(getSocketBaseUrl(), {
        query: { userId: user.id },
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      // Cleanup on component unmount
      return () => {
        newSocket.off('connect');
        newSocket.off('disconnect');
        newSocket.close();
      };
    } else {
      // If there is no user, disconnect any existing socket
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
