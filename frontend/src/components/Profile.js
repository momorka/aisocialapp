import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

const Profile = ({ user, setUser }) => {
    const [newUsername, setNewUsername] = useState('');
    const [pokes, setPokes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchPokes = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE_URL}/profile/pokes`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch pokes');
                }

                const data = await response.json();
                setPokes(data);
            } catch (error) {
                console.error('Failed to fetch pokes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPokes();
    }, []);

    const handleUsernameUpdate = async (e) => {
        e.preventDefault();
        if (!newUsername.trim()) return;

        setUpdateLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/profile/username`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username: newUsername.trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update username');
            }

            setUser({ ...user, username: newUsername.trim() });
            setNewUsername('');
            setSuccess('Username updated successfully!');
        } catch (error) {
            setError(error.message);
        } finally {
            setUpdateLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading profile...</div>;
    }

    return (
        <div className="profile-container">
            <div className="profile-info">
                <h3>Profile Information</h3>

                <div className="info-item">
                    <label>Email:</label>
                    <span>{user.email}</span>
                </div>

                <div className="info-item">
                    <label>Username:</label>
                    <span>{user.username || 'Not set'}</span>
                </div>

                <div className="edit-username">
                    <h4>Update Username</h4>
                    {error && <div className="error">{error}</div>}
                    {success && <div className="success">{success}</div>}

                    <form onSubmit={handleUsernameUpdate}>
                        <div className="form-group">
                            <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                placeholder="Enter new username"
                                required
                            />
                        </div>
                        <button type="submit" className="btn" disabled={updateLoading}>
                            {updateLoading ? 'Updating...' : 'Update Username'}
                        </button>
                    </form>
                </div>
            </div>

            <div className="profile-pokes">
                <h3>Pokes History ({pokes.length})</h3>

                {pokes.length === 0 ? (
                    <p>No one has poked you yet!</p>
                ) : (
                    pokes.map(poke => (
                        <div key={poke.id} className="poke-item">
                            <strong>{poke.username || poke.email}</strong> poked you
                            <div className="poke-meta">
                                {new Date(poke.created_at).toLocaleString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Profile;