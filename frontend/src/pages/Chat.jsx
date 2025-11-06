import { useEffect, useMemo, useState } from 'react';
import { useSocket } from '../context/SocketProvider';
import { api } from '../api/client';

export default function Chat() {
  const { socket } = useSocket();
  const me = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const [friends, setFriends] = useState([]);
  const [current, setCurrent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [typingMap, setTypingMap] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [messageStatus, setMessageStatus] = useState({});

  useEffect(() => {
    api.get('/friends/list').then(({ data }) => setFriends(data.friends || []));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onPrivateMessage = ({ message }) => {
      if (current && (message.sender === current._id || message.sender?._id === current._id)) {
        setMessages((m) => [...m, message]);
        // Mark as delivered if it's not from current user
        if (message.sender !== me.id && message.sender?._id !== me.id) {
          socket.emit('message:delivered', { messageId: message._id });
        }
      }
    };
    const onTyping = ({ userId, isTyping }) => {
      setTypingMap((m) => ({ ...m, [userId]: isTyping }));
    };
    const onPresence = ({ userId, status }) => {
      setOnlineUsers((m) => ({ ...m, [userId]: status === 'online' }));
    };
    const onMessageUpdate = ({ id, status }) => {
      setMessageStatus((m) => ({ ...m, [id]: status }));
    };
    const onMessageAck = ({ clientId, message }) => {
      setMessageStatus((m) => ({ ...m, [message._id]: message.status }));
    };
    socket.on('private:message', onPrivateMessage);
    socket.on('typing', onTyping);
    socket.on('presence:update', onPresence);
    socket.on('message:update', onMessageUpdate);
    socket.on('message:ack', onMessageAck);
    return () => {
      socket.off('private:message', onPrivateMessage);
      socket.off('typing', onTyping);
      socket.off('presence:update', onPresence);
      socket.off('message:update', onMessageUpdate);
      socket.off('message:ack', onMessageAck);
    };
  }, [socket, current]);

  useEffect(() => {
    if (!current) return;
    api.get(`/messages/private/${current._id}`).then(({ data }) => {
      setMessages(data.messages || []);
      // Initialize message status from loaded messages
      const statusMap = {};
      data.messages?.forEach(msg => {
        statusMap[msg._id] = msg.status;
        // Mark messages from current user as seen when viewing chat
        if (msg.sender === me.id || msg.sender?._id === me.id) {
          if (msg.status !== 'seen' && socket) {
            socket.emit('message:seen', { messageId: msg._id });
          }
        }
      });
      setMessageStatus(statusMap);
    });
  }, [current, socket, me.id]);

  useEffect(() => {
    if (!socket || !current) return;
    if (typing) {
      socket.emit('typing', { toUserId: current._id, isTyping: true });
      const t = setTimeout(() => setTyping(false), 1500);
      return () => clearTimeout(t);
    } else {
      socket.emit('typing', { toUserId: current._id, isTyping: false });
    }
  }, [socket, typing, current]);

  const send = () => {
    if (!text.trim() || !socket || !current) return;
    const clientId = `${Date.now()}`;
    socket.emit('private:message', { toUserId: current._id, content: text, clientId });
    setText('');
  };

  const getStatusIcon = (messageId) => {
    const status = messageStatus[messageId] || 'sent';
    switch (status) {
      case 'sent':
        return <span className="text-gray-400">✓</span>;
      case 'delivered':
        return <span className="text-gray-400">✓✓</span>;
      case 'seen':
        return <span className="text-blue-500">✓✓</span>;
      default:
        return <span className="text-gray-400">✓</span>;
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 border-r p-3 overflow-y-auto">
        <div className="font-semibold mb-2">Friends</div>
        {friends.map(f => (
          <div key={f._id} className={`p-2 rounded cursor-pointer ${current?._id===f._id? 'bg-gray-200':''}`} onClick={()=>setCurrent(f)}>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                  {f.name?.charAt(0)?.toUpperCase()}
                </div>
                {onlineUsers[f._id] && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
              </div>
              <div className="flex-1">
                <div className="font-medium">{f.name}</div>
                <div className="text-xs text-gray-500">{onlineUsers[f._id] ? 'Online' : 'Offline'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="border-b p-3 flex items-center gap-3">
          {current && (
            <div className="relative">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-lg font-medium">
                {current.name?.charAt(0)?.toUpperCase()}
              </div>
              {onlineUsers[current._id] && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
            </div>
          )}
          <div>
            <div className="font-semibold">{current? current.name : 'Select a friend'}</div>
            {current && <div className="text-sm text-gray-500">{onlineUsers[current._id] ? 'Online' : 'Offline'}</div>}
          </div>
        </div>
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {messages.map(m => (
            <div key={m._id} className={`max-w-[70%] p-2 rounded ${m.sender===me.id || m.sender?._id===me.id? 'bg-blue-100 ml-auto':'bg-gray-100'}`}>
              <div className="flex items-end justify-between gap-2">
                <span>{m.content}</span>
                {m.sender === me.id || m.sender?._id === me.id ? (
                  <div className="flex items-center text-xs">
                    {getStatusIcon(m._id)}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {current && typingMap[current._id] && (
            <div className="max-w-[70%] p-2 rounded bg-gray-100">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <span className="text-sm text-gray-500 ml-2">typing...</span>
              </div>
            </div>
          )}
        </div>
        <div className="p-3 flex gap-2">
          <input value={text} onChange={(e)=>{ setText(e.target.value); setTyping(true); }} className="flex-1 border rounded p-2" placeholder="Type a message" />
          <button onClick={send} className="bg-blue-600 text-white px-4 rounded">Send</button>
        </div>
      </div>
    </div>
  );
}


