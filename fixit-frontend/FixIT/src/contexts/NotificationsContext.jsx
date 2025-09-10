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

    const handleHelpRequest = (payload) => {
      console.debug('[socket] help:request received', payload);
      pushNotification({
        type: 'help:request',
        title: 'Help Requested',
        message: `${payload?.from?.name || 'A user'} is asking for help`,
        data: payload,
      });
    };

    const handleHelpResponse = (payload) => {
      console.debug('[socket] help:response received', payload);
      pushNotification({
        type: 'help:response',
        title: payload?.accepted ? 'Help Accepted' : 'Help Declined',
        message: `${payload?.from?.name || 'User'} ${payload?.accepted ? 'accepted' : 'declined'} your help request`,
        data: payload,
      });
      // mark matching help:request as responded
      setNotifications((prev) => prev.map((n) => {
        if (n.type === 'help:request' && n?.data?.from?.id === payload?.from?.id && n?.data?.issueId === payload?.issueId) {
          return { ...n, meta: { ...(n.meta || {}), status: payload?.accepted ? 'accepted' : 'declined' }, read: true };
        }
        return n;
      }));
    };

    socket.on('issue:assigned', handleAssigned);
    socket.on('message:received', handleMessage);
    socket.on('help:offer', handleHelpOffer);
    socket.on('help:request', handleHelpRequest);
    socket.on('help:response', handleHelpResponse);

    return () => {
      socket.off('issue:assigned', handleAssigned);
      socket.off('message:received', handleMessage);
      socket.off('help:offer', handleHelpOffer);
      socket.off('help:request', handleHelpRequest);
      socket.off('help:response', handleHelpResponse);
    };
  }, [socket]);

  const pushNotification = (n) => {
    setNotifications((prev) => [{ id: crypto.randomUUID(), read: false, createdAt: new Date(), ...n }, ...prev]);
    setUnread((u) => u + 1);
  };

  // Helper to emit respond via socket from UI components that consume this context
  const respondToHelp = (toUserId, issueId, accepted, note) => {
    if (!socket) return;
    socket.emit('help:respond', { toUserId, issueId, accepted, note });
    // optimistic UI update on the pending request if present
    setNotifications((prev) => prev.map((n) => {
      if (n.type === 'help:request' && n?.data?.from?.id === toUserId && n?.data?.issueId === issueId) {
        return { ...n, meta: { ...(n.meta || {}), status: accepted ? 'accepted' : 'declined' }, read: true };
      }
      return n;
    }));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  const value = useMemo(() => ({ notifications, unread, pushNotification, markAllRead, respondToHelp }), [notifications, unread]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = () => useContext(NotificationsContext);


