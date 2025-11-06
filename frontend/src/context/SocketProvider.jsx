import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const token = localStorage.getItem('token');
  useEffect(() => {
    if (!token) return;
    const s = io(import.meta.env.VITE_API_BASE || 'http://localhost:4000', {
      auth: { token },
    });
    setSocket(s);
    return () => { s.disconnect(); };
  }, [token]);
  const value = useMemo(() => ({ socket }), [socket]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}


