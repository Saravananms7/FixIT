import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSocket } from './SocketContext';

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!socket) return;

    const handleAssigned = (payload) => {
      pushNotification({
        type: 'issue:assigned',
        title: 'New Issue Assigned',
        message: `You were assigned to an issue`,
        data: payload,
      });
    };

    const handleMessage = (payload) => {
      pushNotification({
        type: 'message:received',
        title: `New message from ${payload?.sender?.name || 'user'}`,
        message: payload?.message || 'You have a new message',
        data: payload,
      });
    };

    const handleHelpOffer = (payload) => {
      pushNotification({
        type: 'help:offer',
        title: 'Offer to Help',
        message: `${payload?.from?.name || 'A user'} wants to help on your issue`,
        data: payload,
      });
    };

    socket.on('issue:assigned', handleAssigned);
    socket.on('message:received', handleMessage);
    socket.on('help:offer', handleHelpOffer);

    return () => {
      socket.off('issue:assigned', handleAssigned);
      socket.off('message:received', handleMessage);
      socket.off('help:offer', handleHelpOffer);
    };
  }, [socket]);

  const pushNotification = (n) => {
    setNotifications((prev) => [{ id: crypto.randomUUID(), read: false, createdAt: new Date(), ...n }, ...prev]);
    setUnread((u) => u + 1);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  const value = useMemo(() => ({ notifications, unread, pushNotification, markAllRead }), [notifications, unread]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = () => useContext(NotificationsContext);


