import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

const PostDetail = ({ user }) => {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [commentLoading, setCommentLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/posts/${id}`);
                if (!response.ok) {
                    throw new Error('Failed to load post');
                }
                const data = await response.json();
                setPost(data);
            } catch (error) {
                setError('Failed to load post');
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [id]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        setCommentLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/posts/${id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: comment })
            });

            if (!response.ok) {
                throw new Error('Failed to add comment');
            }

            setSuccess('Comment added successfully!');
            setComment('');

            // Refresh post to get updated comments
            const postResponse = await fetch(`${API_BASE_URL}/posts/${id}`);
            if (postResponse.ok) {
                const updatedPost = await postResponse.json();
                setPost(updatedPost);
            }
        } catch (error) {
            setError('Failed to add comment');
        } finally {
            setCommentLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading post...</div>;
    }

    if (!post) {
        return <div className="error">Post not found</div>;
    }

    return (
        <div>
            <div className="post-detail">
                <h2>{post.topic}</h2>
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
                    {post.content}
                </div>
            </div>

            <div className="comments-section">
                <h3>Comments ({post.comments ? post.comments.length : 0})</h3>

                {post.comments && post.comments.length > 0 ? (
                    post.comments.map(comment => (
                        <div key={comment.id} className="comment">
                            <div className="comment-meta">
                                <Link to={`/users/${comment.user_id}`}>
                                    {comment.username || comment.email}
                                </Link> • {new Date(comment.created_at).toLocaleDateString()}
                            </div>
                            <div className="comment-content">
                                {comment.content}
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No comments yet. Be the first to comment!</p>
                )}

                {user ? (
                    <div className="comment-form">
                        <h4>Add a Comment</h4>
                        {error && <div className="error">{error}</div>}
                        {success && <div className="success">{success}</div>}

                        <form onSubmit={handleCommentSubmit}>
                            <div className="form-group">
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write your comment here..."
                    rows="4"
                    required
                />
                            </div>
                            <button type="submit" className="btn" disabled={commentLoading}>
                                {commentLoading ? 'Adding Comment...' : 'Add Comment'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="comment-form">
                        <p>
                            <Link to="/login">Login</Link> to leave a comment.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostDetail;