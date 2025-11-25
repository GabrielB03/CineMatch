import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import StarRating from '../components/StarRating';
import { fetchWithAuth, getToken } from '../utils/authApi';
import { FormControl, InputLabel, Select, MenuItem, Button, Box, CircularProgress, Alert, Pagination, Typography, Snackbar } from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

const API_BASE_URL = 'https://localhost:5000/api';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const MOVIES_PER_PAGE = 30;

const GenreSelectionPage = () => {
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [movies, setMovies] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    
    const pageFromUrl = parseInt(new URLSearchParams(location.search).get('page')) || 1;
    const [currentPage, setCurrentPage] = useState(pageFromUrl);
    const showMovieCatalog = location.pathname === '/catalog';

    const loadCatalog = useCallback(async (pageToLoad) => {
        setLoading(true);
        setError(null);
        setCurrentPage(pageToLoad);

        try {
            const res = await fetch(`${API_BASE_URL}/movies/catalog?page=${pageToLoad}&limit=${MOVIES_PER_PAGE}&sort=alphabetical`);

            if (!res.ok) {
                throw new Error(`Erro ${res.status}: Não foi possível carregar o catálogo de filmes.`);
            }

            const data = await res.json();
            
            if (data.movies && Array.isArray(data.movies)) {
                setMovies(data.movies);
                
                const count = data.total_count || 0;
                setTotalCount(count);
                setTotalPages(Math.ceil(count / MOVIES_PER_PAGE) || 1);
            } else {
                throw new Error("Formato de dados de filmes inválido.");
            }
        } catch (err) {
            console.error("Erro ao carregar catálogo:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!showMovieCatalog) {
            const fetchGenres = async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/genres`);

                    if (!res.ok) {
                        throw new Error(`Erro ${res.status}: Não foi possível carregar os gêneros.`);
                    }

                    const data = await res.json();

                    if (data.genres && Array.isArray(data.genres)) {
                        setGenres(data.genres);
                    } else {
                        throw new Error("Formato de dados de gêneros inválido.");
                    }
                } catch (err) {
                    console.error("Erro ao carregar gêneros:", err);
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };

            fetchGenres();
        } else {
            loadCatalog(pageFromUrl);
        }
    }, [showMovieCatalog, pageFromUrl, loadCatalog]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (selectedGenre) {
            navigate(`/recommendations?genre=${selectedGenre}&page=1`);
        } else {
            setError("Por favor, selecione um gênero.");
        }
    };
    
    const handlePageChange = (event, value) => {
        navigate(`${location.pathname}?page=${value}`);
    };
    
    const handleAddToWishlist = async (tmdbId) => {
        if (!getToken()) {
            setSnackbarMessage("Faça login para adicionar filmes à sua Wishlist.");
            setSnackbarOpen(true);
            return;
        }
        try {
            const response = await fetchWithAuth(`user/watchlist/add/${tmdbId}`, {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Falha ao adicionar à Wishlist.");
            }

            setSnackbarMessage("Adicionado à Wishlist com sucesso!");
            setSnackbarOpen(true);
        } catch (err) {
            setSnackbarMessage(err.message);
            setSnackbarOpen(true);
        }
    };
    
    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };


    if (loading) {
        return (
            <Layout headerTitle={showMovieCatalog ? "Catálogo Completo de Filmes (A-Z)" : "Escolha seu Gênero Favorito"}>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                    <p style={{marginLeft: 10}}>Carregando lista...</p>
                </Box>
            </Layout>
        );
    }

    if (error && !showMovieCatalog && genres.length === 0) {
        return (
            <Layout headerTitle="Escolha seu Gênero Favorito">
                <Alert severity="error" sx={{ my: 2, maxWidth: 600, mx: 'auto' }}>
                    Erro ao carregar gêneros: {error}
                </Alert>
            </Layout>
        );
    }
    
    if (showMovieCatalog) {
        return (
            <Layout headerTitle="Catálogo Completo de Filmes (A-Z)">
                {error && (
                    <div className="alert-message" style={{ margin: '15px 0' }}>
                        <p>⚠️ {error}</p>
                    </div>
                )}
                
                <Typography variant="h4" component="h2" sx={{ mb: 3 }}>Todos os Filmes ({totalCount} itens)</Typography>
                
                <div className="card-grid" id="catalogList">
                    {movies.map((movie) => {
                        const showRating = !!getToken();
                        return (
                            <div className="movie-card" key={movie.tmdb_id}>
                                <img 
                                    src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`} 
                                    alt={`Poster do filme ${movie.title}`} 
                                    className="movie-poster"
                                />
                                <h3>{movie.title}</h3>
                                <p className="plot">{movie.overview || "Nenhuma descrição disponível."}</p>
                                
                                <div className="rating-area">
                                    {showRating && (
                                        <StarRating 
                                            tmdbId={movie.tmdb_id} 
                                            initialRating={movie.user_rating || 0} 
                                        />
                                    )}
                                    <Button 
                                        variant="contained" 
                                        color="secondary" 
                                        size="small"
                                        startIcon={<FavoriteBorderIcon />}
                                        onClick={() => handleAddToWishlist(movie.tmdb_id)}
                                        sx={{ mt: 1 }}
                                    >
                                        Wishlist
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                <Box sx={{ textAlign: 'center', my: 4 }}>
                    <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={handlePageChange}
                        color="primary"
                        disabled={loading}
                        size="large"
                    />
                </Box>
                
                <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
                    <Alert onClose={handleSnackbarClose} severity="info" sx={{ width: '100%' }}>
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </Layout>
        );
    }


    return (
        <Layout headerTitle="Escolha seu Gênero Favorito">
            <main>
                <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, margin: '20px auto', display: 'flex', flexDirection: 'column', gap: 3 }}>

                    <FormControl fullWidth variant="outlined">
                        <InputLabel id="genre-select-label">Gênero</InputLabel>
                        <Select
                            labelId="genre-select-label"
                            id="genreSelect"
                            value={selectedGenre}
                            label="Gênero"
                            onChange={(e) => {
                                setSelectedGenre(e.target.value);
                                setError(null);
                            }}
                        >
                            <MenuItem value="">
                                <em>-- Escolha um gênero --</em>
                            </MenuItem>

                            {genres.map(genre => (
                                <MenuItem key={genre.id} value={genre.id}>
                                    {genre.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {error && selectedGenre === '' && (
                        <Alert severity="warning">Por favor, selecione um gênero.</Alert>
                    )}

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<MovieIcon />}
                    >
                        Ver Recomendações
                    </Button>
                    
                    <Button
                        variant="outlined"
                        color="primary"
                        size="large"
                        onClick={() => navigate('/catalog?page=1')}
                    >
                        Ver Catálogo Completo (A-Z)
                    </Button>
                    
                </Box>
            </main>
        </Layout>
    );
};

export default GenreSelectionPage;