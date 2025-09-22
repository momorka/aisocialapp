import React, { useState, useEffect, useRef } from 'react';

const Chat = ({ socket, user }) => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [onlineUsers, setOnlineUsers] = useState([]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket || !user) return;

        // Join chat with username
        socket.emit('join_chat', user.username || user.email);

        // Listen for messages
        socket.on('receive_message', (data) => {
            setMessages(prevMessages => [...prevMessages, data]);
        });

        // Listen for user join/leave events
        socket.on('user_joined', (username) => {
            setMessages(prevMessages => [...prevMessages, {
                username: 'System',
                message: `${username} joined the chat`,
                timestamp: new Date(),
                isSystem: true
            }]);
        });

        socket.on('user_left', (username) => {
            setMessages(prevMessages => [...prevMessages, {
                username: 'System',
                message: `${username} left the chat`,
                timestamp: new Date(),
                isSystem: true
            }]);
        });

        return () => {
            socket.off('receive_message');
            socket.off('user_joined');
            socket.off('user_left');
        };
    }, [socket, user]);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim() || !socket) return;

        socket.emit('send_message', { message: message.trim() });
        setMessage('');
    };

    if (!socket || !user) {
        return <div className="loading">Connecting to chat...</div>;
    }

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h3>Global Chat</h3>
                <p>Welcome, {user.username || user.email}!</p>
            </div>

            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="system-message">
                        Welcome to the global chat! Start a conversation...
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={msg.isSystem ? "system-message" : "message"}
                        >
                            {!msg.isSystem && (
                                <>
                                    <div className="message-username">
                                        {msg.username}
                                    </div>
                                    <div className="message-content">
                                        {msg.message}
                                    </div>
                                    <div className="message-timestamp">
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </div>
                                </>
                            )}
                            {msg.isSystem && (
                                <div>{msg.message}</div>
                            )}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="chat-input">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    maxLength={500}
                />
                <button type="submit" disabled={!message.trim()}>
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;