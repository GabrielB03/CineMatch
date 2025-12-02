import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { Container, Typography, Grid, Card, CardContent, CardMedia, Rating, Box, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import { getToken } from '../utils/authApi';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'https://localhost:5000/api';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const UserProfilePage = () => {
    const { userId } = useParams();
    const [profile, setProfile] = useState(null);
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            if (!getToken()) {
                setError("Você precisa estar logado para ver perfis.");
                setLoading(false);
                return;
            }

            try {
                const ratingsResponse = await axios.get(`${API_URL}/ratings/user/${userId}`, {
                    withCredentials: true,
                });
                setRatings(ratingsResponse.data);

                const userResponse = await axios.get(`${API_URL}/users/${userId}`, {
                    withCredentials: true,
                });
                setProfile(userResponse.data);

                setLoading(false);
            } catch (err) {
                console.error("Erro ao buscar perfil/avaliações:", err);
                setError("Falha ao carregar o perfil do usuário ou suas avaliações.");
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    const username = profile ? profile.username : 'Usuário Desconhecido';

    if (loading) {
        return <Layout headerTitle="Perfil de Usuário"><CircularProgress sx={{ display: 'block', margin: '40px auto' }} /></Layout>;
    }

    if (error) {
        return <Layout headerTitle="Perfil de Usuário"><Alert severity="error" sx={{ mt: 2 }}>{error}</Alert></Layout>;
    }

    return (
        <Layout headerTitle={`Perfil: ${username}`}>
            <Container maxWidth="lg">
                <Typography variant="h4" gutterBottom>
                    Avaliações de {username}
                </Typography>

                {ratings.length === 0 ? (
                    <Typography variant="body1">Este usuário ainda não avaliou nenhum filme.</Typography>
                ) : (
                    <Grid container spacing={4}>
                        {ratings.map((item) => {
                            const movie = item.movie;
                            const rawRating = item.rating;
                            const convertedRating = rawRating / 2;
                            const currentComment = item.comment;

                            return (
                                <Grid key={item.id} xs={12} sm={6} md={4}>
                                    <Card sx={{ display: 'flex', height: '100%' }}>
                                        <CardMedia
                                            component="img"
                                            sx={{ width: 100, flexShrink: 0 }}
                                            image={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}` || 'placeholder.png'}
                                            alt={movie.title}
                                        />
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" component="div" gutterBottom>
                                                {movie.title}
                                            </Typography>

                                            <Typography variant="subtitle2" color="text.secondary">
                                                Nota (1-5):
                                            </Typography>
                                            <Box display="flex" alignItems="center" mb={1}>
                                                <Rating name="read-only" value={convertedRating} max={5} readOnly />
                                                <Typography variant="body2" sx={{ ml: 1 }}>
                                                    ({convertedRating}/5)
                                                </Typography>
                                            </Box>

                                            <Typography variant="subtitle2" color="text.secondary">
                                                Comentário:
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 2 }}>
                                                {currentComment || "Sem comentário."}
                                            </Typography>
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

export default UserProfilePage;