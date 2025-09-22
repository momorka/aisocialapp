import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

const Home = () => {
    const [posts, setPosts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch posts
                const postsResponse = await fetch(`${API_BASE_URL}/posts`);
                if (!postsResponse.ok) {
                    throw new Error('Failed to fetch posts');
                }
                const postsData = await postsResponse.json();

                // Fetch users
                const usersResponse = await fetch(`${API_BASE_URL}/users`);
                if (!usersResponse.ok) {
                    throw new Error('Failed to fetch users');
                }
                const usersData = await usersResponse.json();

                setPosts(postsData);
                setUsers(usersData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div>
            <div className="home-header">
                <h2>Welcome to SocialApp</h2>
                <p>Connect, share, and discover amazing content!</p>
            </div>

            <div className="home-sections">
                <div className="posts-section">
                    <h3>Recent Posts</h3>
                    {posts.length === 0 ? (
                        <p>No posts yet. Be the first to create one!</p>
                    ) : (
                        posts.map(post => (
                            <div key={post.id} className="post-card">
                                <h4>
                                    <Link to={`/posts/${post.id}`}>{post.topic}</Link>
                                </h4>
                                <div className="post-meta">
                                    By <Link to={`/users/${post.user_id}`}>
                                    {post.username || post.email}
                                </Link> • {new Date(post.created_at).toLocaleDateString()}
                                    <span className={`mood-badge mood-${post.mood}`}>
                    {post.mood}
                  </span>
                                </div>
                                {post.image_url && (
                                    <img
                                        src={post.image_url}
                                        alt={post.topic}
                                        className="post-image"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                )}
                                <div className="post-content">
                                    {post.content.length > 200
                                        ? `${post.content.substring(0, 200)}...`
                                        : post.content
                                    }
                                </div>
                                <Link to={`/posts/${post.id}`} className="btn">
                                    Read More
                                </Link>
                            </div>
                        ))
                    )}
                </div>

                <div className="users-section">
                    <h3>Community Members</h3>
                    {users.map(user => (
                        <div key={user.id} className="user-card">
                            <h4>
                                <Link to={`/users/${user.id}`}>
                                    {user.username || user.email}
                                </Link>
                            </h4>
                            <p>Member since {new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;