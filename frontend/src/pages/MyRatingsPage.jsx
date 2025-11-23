import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Container, Typography, Grid, Card, CardContent, CardMedia, Rating, TextField, Button, Box, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import { getToken } from '../utils/authApi';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:5000/api';

const MyRatingsPage = () => {
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editStates, setEditStates] = useState({});

    useEffect(() => {
        fetchRatings();
    }, []);

    const fetchRatings = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/ratings/user/ratings`, {
                withCredentials: true,
            });
            setRatings(response.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("Falha ao carregar suas avaliações.");
            setLoading(false);
        }
    };

    const handleRatingChange = (ratingId, newScore) => {
        setRatings(prevRatings => 
            prevRatings.map(r => 
                r.id === ratingId ? { ...r, rating: newScore } : r
            )
        );
    };

    const handleCommentChange = (ratingId, newComment) => {
        setRatings(prevRatings => 
            prevRatings.map(r => 
                r.id === ratingId ? { ...r, comment: newComment } : r
            )
        );
    };

    const toggleEditMode = (ratingId, currentRating, currentComment) => {
        setEditStates(prev => ({
            ...prev,
            [ratingId]: { 
                isEditing: !prev[ratingId]?.isEditing, 
                originalRating: currentRating,
                originalComment: currentComment
            }
        }));
    };

    const handleSave = async (ratingId, newRating, newComment) => {
        try {
            const token = getToken();
            await axios.put(`${API_URL}/ratings/ratings/${ratingId}`, {
                rating: newRating,
                comment: newComment || null,
            }, {
                withCredentials: true,
            });
            toggleEditMode(ratingId); 
        } catch (err) {
            console.error("Erro ao salvar avaliação:", err);
            setError("Erro ao salvar a avaliação. Tente novamente.");
            setRatings(prevRatings => 
                prevRatings.map(r => 
                    r.id === ratingId ? 
                    { 
                        ...r, 
                        rating: editStates[ratingId].originalRating, 
                        comment: editStates[ratingId].originalComment 
                    } : r
                )
            );
        }
    };

    const handleCancel = (ratingId) => {
        const original = editStates[ratingId];
        setRatings(prevRatings => 
            prevRatings.map(r => 
                r.id === ratingId ? 
                { 
                    ...r, 
                    rating: original.originalRating, 
                    comment: original.originalComment 
                } : r
            )
        );
        toggleEditMode(ratingId);
    };

    if (loading) {
        return <Layout headerTitle="Minhas Avaliações"><Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box></Layout>;
    }

    return (
        <Layout headerTitle="Minhas Avaliações">
            <Container maxWidth="lg">
                <Typography variant="h4" gutterBottom>Seus Filmes Avaliados</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                {ratings.length === 0 ? (
                    <Typography variant="body1">Você ainda não avaliou nenhum filme. Comece a explorar!</Typography>
                ) : (
                    <Grid container spacing={4}>
                        {ratings.map((item) => {
                            const movie = item.movie;
                            const isEditing = editStates[item.id]?.isEditing;
                            
                            const rawRating = item.rating; 
                            const convertedRating = rawRating / 2; 

                            const currentRating = isEditing ? rawRating : convertedRating;
                            const currentComment = item.comment;

                            return (
                                <Grid item key={item.id} xs={12} sm={6} md={4}>
                                    <Card sx={{ display: 'flex', height: '100%' }}>
                                        <CardMedia
                                            component="img"
                                            sx={{ width: 100, flexShrink: 0 }}
                                            image={movie.poster_path || 'placeholder.png'}
                                            alt={movie.title}
                                        />
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" component="div" gutterBottom>
                                                {movie.title}
                                            </Typography>

                                            <Typography variant="subtitle2" color="text.secondary">
                                                Sua Nota (1-5):
                                            </Typography>
                                            {isEditing ? (
                                                <Rating
                                                    name={`rating-${item.id}`}
                                                    value={rawRating / 2} 
                                                    max={5} 
                                                    onChange={(event, newValue) => {
                                                        if (newValue !== null) handleRatingChange(item.id, newValue);
                                                    }}
                                                    sx={{ mb: 1 }}
                                                />
                                            ) : (
                                                <Box display="flex" alignItems="center" mb={1}>
                                                    <Rating name="read-only" value={convertedRating} max={5} readOnly />
                                                    <Typography variant="body2" sx={{ ml: 1 }}>
                                                        ({convertedRating}/5)
                                                    </Typography>
                                                </Box>
                                            )}
                                            
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Comentário:
                                            </Typography>
                                            {isEditing ? (
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    value={currentComment || ''}
                                                    onChange={(e) => handleCommentChange(item.id, e.target.value)}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ mb: 2 }}
                                                />
                                            ) : (
                                                <Typography variant="body2" sx={{ mb: 2 }}>
                                                    {currentComment || "Sem comentário."}
                                                </Typography>
                                            )}

                                            {isEditing ? (
                                                <Box>
                                                    <Button 
                                                        variant="contained" 
                                                        color="primary" 
                                                        size="small"
                                                        onClick={() => handleSave(item.id, currentRating, currentComment)}
                                                        sx={{ mr: 1 }}
                                                    >
                                                        Salvar
                                                    </Button>
                                                    <Button 
                                                        variant="outlined" 
                                                        size="small"
                                                        onClick={() => handleCancel(item.id)}
                                                    >
                                                        Cancelar
                                                    </Button>
                                                </Box>
                                            ) : (
                                                <Button 
                                                    variant="outlined" 
                                                    size="small"
                                                    onClick={() => toggleEditMode(item.id, rawRating, currentComment)}
                                                >
                                                    Editar
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </Container>
        </Layout>
    );
}

export default MyRatingsPage;