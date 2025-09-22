import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ user, logout }) => {
    return (
        <div className="navbar">
            <div className="navbar-content">
                <h1>
                    <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
                        SocialApp
                    </Link>
                </h1>
                <nav>
                    <Link to="/">Home</Link>
                    {user ? (
                        <>
                            <Link to="/profile">Profile</Link>
                            <Link to="/create">Create Post</Link>
                            <Link to="/chat">Chat</Link>
                            <span>Welcome, {user.username || user.email}!</span>
                            <button onClick={logout}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">Login</Link>
                            <Link to="/register">Register</Link>
                        </>
                    )}
                </nav>
            </div>
        </div>
    );
};

export default Navbar;