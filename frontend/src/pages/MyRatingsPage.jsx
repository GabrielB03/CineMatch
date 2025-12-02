import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Container, Typography, Grid, Card, CardContent, CardMedia, Rating, TextField, Button, Box, CircularProgress, Alert, Tabs, Tab } from '@mui/material';
import axios from 'axios';
import { fetchWithAuth, removeToken } from '../utils/authApi';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'https://localhost:5000/api';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const MyRatingsPage = () => {
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editStates, setEditStates] = useState({});
    const [tabValue, setTabValue] = useState(0); 
    const navigate = useNavigate();

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
        const rawScore = newScore * 2; 
        
        setRatings(prevRatings => 
            prevRatings.map(r => 
                r.id === ratingId ? { ...r, rating: rawScore } : r
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

    const handleSave = async (ratingId) => {
        const ratingItem = ratings.find(r => r.id === ratingId);
        if (!ratingItem) return;

        try {
            await fetchWithAuth(`ratings/ratings/${ratingId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    rating: ratingItem.rating, 
                    comment: ratingItem.comment || null, 
                }),
            });
            
            const { originalRating, originalComment, ...rest } = editStates[ratingId] || {};
            setEditStates(prev => ({
                ...prev,
                [ratingId]: { ...rest, isEditing: false }
            }));
        } catch (err) {
            console.error("Erro ao salvar avaliação:", err);
            
            if (err.message && err.message.includes("401")) { 
                removeToken();
                navigate('/login');
                setError("Sessão expirada. Faça login novamente.");
                return; 
            }

            setError("Erro ao salvar a avaliação. Tente novamente.");
            
            const original = editStates[ratingId];
            if (original) {
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
            }
            setEditStates(prev => ({
                ...prev,
                [ratingId]: { ...prev[ratingId], isEditing: false }
            }));
        }
    };

    const handleCancel = (ratingId) => {
        const original = editStates[ratingId];
        if (original) {
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
        }
        setEditStates(prev => ({
            ...prev,
            [ratingId]: { ...prev[ratingId], isEditing: false }
        }));
    };

    const handleDelete = async (ratingId) => {
        if (!window.confirm("Tem certeza que deseja remover esta avaliação?")) return;

        try {
            await fetchWithAuth(`ratings/ratings/${ratingId}`, {
                method: 'DELETE',
            });
            
            setRatings(prevRatings => prevRatings.filter(r => r.id !== ratingId));
            setError("Avaliação removida com sucesso!");

        } catch (err) {
             console.error("Erro ao deletar avaliação:", err);
             setError("Erro ao remover a avaliação. Tente novamente.");
        }
    };

    const filteredRatings = ratings.filter(item => 
        tabValue === 0 ? item.content_type === 'movie' : item.content_type === 'tv'
    );
    
    const contentTitle = tabValue === 0 ? "Filmes Avaliados" : "Séries Avaliadas";

    if (loading) {
        return <Layout headerTitle="Minhas Avaliações"><Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box></Layout>;
    }

    return (
        <Layout headerTitle="Minhas Avaliações">
            <Container maxWidth="lg">
                <Typography variant="h4" gutterBottom>Gerenciar Suas Notas</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
                    <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} aria-label="content type tabs">
                        <Tab label={`Filmes (${ratings.filter(r => r.content_type === 'movie').length})`} />
                        <Tab label={`Séries (${ratings.filter(r => r.content_type === 'tv').length})`} />
                    </Tabs>
                </Box>
                
                <Typography variant="h5" gutterBottom>{contentTitle}</Typography>
                
                {filteredRatings.length === 0 ? (
                    <Typography variant="body1">Você ainda não avaliou {contentTitle.toLowerCase()}.</Typography>
                ) : (
                    <Grid container spacing={4}>
                        {filteredRatings.map((item) => {
                            const content = item.content;
                            const isEditing = editStates[item.id]?.isEditing;
                            
                            const rawRating = item.rating; 
                            const convertedRating = rawRating / 2; 
                            const currentComment = item.comment;

                            return (
                                <Grid item key={item.id} xs={12} sm={6} md={4}>
                                    <Card sx={{ display: 'flex', height: '100%' }}>
                                        <CardMedia
                                            component="img"
                                            sx={{ width: 100, flexShrink: 0 }}
                                            image={content.poster_path || 'placeholder.png'}
                                            alt={content.title}
                                        />
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" component="div" gutterBottom>
                                                {content.title}
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
                                                    label="Seu Comentário"
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
                                                        onClick={() => handleSave(item.id)}
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
                                                <Box display="flex" justifyContent="space-between">
                                                    <Button 
                                                        variant="outlined" 
                                                        size="small"
                                                        onClick={() => toggleEditMode(item.id, rawRating, currentComment)}
                                                    >
                                                        Editar
                                                    </Button>
                                                    <Button 
                                                        variant="text" 
                                                        color="error"
                                                        size="small"
                                                        startIcon={<DeleteIcon />}
                                                        onClick={() => handleDelete(item.id)}
                                                    >
                                                        Remover
                                                    </Button>
                                                </Box>
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