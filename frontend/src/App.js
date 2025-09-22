import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import './App.css';

import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import PostDetail from './components/PostDetail';
import UserDetail from './components/UserDetail';
import Profile from './components/Profile';
import CreatePost from './components/CreatePost';
import Chat from './components/Chat';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
          .then(response => {
            if (!response.ok) {
              throw new Error('Token verification failed');
            }
            return response.json();
          })
          .then(data => {
            setUser(data);
          })
          .catch(error => {
            console.error('Token verification failed:', error);
            localStorage.removeItem('token');
          })
          .finally(() => {
            setLoading(false);
          });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
      <Router>
        <div className="App">
          <Navbar user={user} logout={logout} />
          <div className="container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                  path="/login"
                  element={user ? <Navigate to="/" /> : <Login login={login} />}
              />
              <Route
                  path="/register"
                  element={user ? <Navigate to="/" /> : <Register login={login} />}
              />
              <Route path="/posts/:id" element={<PostDetail user={user} />} />
              <Route path="/users/:id" element={<UserDetail user={user} socket={socket} />} />
              <Route
                  path="/profile"
                  element={user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />}
              />
              <Route
                  path="/create"
                  element={user ? <CreatePost /> : <Navigate to="/login" />}
              />
              <Route
                  path="/chat"
                  element={user ? <Chat socket={socket} user={user} /> : <Navigate to="/login" />}
              />
            </Routes>
          </div>
        </div>
      </Router>
  );
}

export default App;