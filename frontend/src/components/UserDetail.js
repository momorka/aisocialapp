import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

const UserDetail = ({ user, socket }) => {
    const { id } = useParams();
    const [profileUser, setProfileUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pokeLoading, setPokeLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/users/${id}`);
                if (!response.ok) {
                    throw new Error('Failed to load user profile');
                }
                const data = await response.json();
                setProfileUser(data);
            } catch (error) {
                setError('Failed to load user profile');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id]);

    useEffect(() => {
        if (socket) {
            const handlePoke = (data) => {
                if (user && data.toUserId == user.id && data.fromUserId == id) {
                    setSuccess('You just got poked by this user!');
                    setTimeout(() => setSuccess(''), 3000);
                }
            };

            socket.on('poke', handlePoke);

            return () => {
                socket.off('poke', handlePoke);
            };
        }
    }, [socket, user, id]);

    const handlePoke = async () => {
        if (!user) return;

        setPokeLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/users/${id}/poke`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send poke');
            }

            setSuccess('Poke sent successfully!');
        } catch (error) {
            setError(error.message);
        } finally {
            setPokeLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading user profile...</div>;
    }

    if (!profileUser) {
        return <div className="error">User not found</div>;
    }

    const canPoke = user && user.id !== parseInt(id);

    return (
        <div className="user-detail">
            <h2>{profileUser.username || 'Anonymous User'}</h2>
            <p><strong>Email:</strong> {profileUser.email}</p>
            <p><strong>Member since:</strong> {new Date(profileUser.created_at).toLocaleDateString()}</p>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            {canPoke && (
                <div className="poke-button">
                    <button
                        onClick={handlePoke}
                        className="btn"
                        disabled={pokeLoading}
                    >
                        {pokeLoading ? 'Poking...' : 'Poke User 👋'}
                    </button>
                </div>
            )}

            {!user && (
                <p style={{ marginTop: '2rem' }}>
                    <a href="/login">Login</a> to interact with this user.
                </p>
            )}
        </div>
    );
};

export default UserDetail;