'use client';
import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";

export default function TeamsPage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [chats, setChats] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedChat, setSelectedChat] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!session) return;
    fetch('/api/teams/chats')
      .then(res => res.json())
      .then(data => setChats(data.value || []));
  }, [session]);

  useEffect(() => {
    if (!selectedChat) return;
    fetch(`/api/teams/messages?chatId=${selectedChat.id}`)
      .then(res => res.json())
      .then(data => setMessages(data.value || []));
  }, [selectedChat]);

  const sendMessage = async () => {
    if (!newMessage || !selectedChat) return;
    await fetch('/api/teams/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: selectedChat.id, content: newMessage }),
    });
    setNewMessage('');
    // refresh messages
    fetch(`/api/teams/messages?chatId=${selectedChat.id}`)
      .then(res => res.json())
      .then(data => setMessages(data.value || []));
  };

  if (!session) return <button onClick={() => signIn('microsoft')}>Connexion Microsoft</button>;

  return (
    <div className="flex gap-4 p-4">
      <div className="w-1/4 border-r">
        <h3>Chats</h3>
        <ul>
          {chats.map(chat => (
            <li key={chat.id} onClick={() => setSelectedChat(chat)} style={{ cursor: 'pointer', marginBottom: 4 }}>
              {chat.topic || chat.id}
            </li>
          ))}
        </ul>
        <button onClick={() => signOut()}>Déconnexion</button>
      </div>
      <div className="w-3/4">
        <h3>Messages</h3>
        <div style={{ maxHeight: 400, overflowY: 'scroll', border: '1px solid gray', padding: 8 }}>
          {messages.map(msg => (
            <div key={msg.id}>
              <strong>{msg.from?.user?.displayName || 'Inconnu'}:</strong> {msg.body?.content}
            </div>
          ))}
        </div>
        {selectedChat && (
          <div className="mt-2 flex gap-2">
            <input value={newMessage} onChange={e => setNewMessage(e.target.value)} className="border p-1 flex-1" />
            <button onClick={sendMessage} className="bg-blue-600 text-white px-2">Envoyer</button>
          </div>
        )}
      </div>
    </div>
  );
}

