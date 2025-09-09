import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const tokenRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    tokenRef.current = token;
    if (!token) return;

    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket']
    });

    setSocket(s);

    return () => {
      try { s.disconnect(); } catch (_) {}
      setSocket(null);
    };
  }, []);

  const value = useMemo(() => ({ socket }), [socket]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);


