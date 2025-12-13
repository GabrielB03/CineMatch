import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import StarRating from '../components/StarRating';
import { fetchWithAuth, removeToken, getToken } from '../utils/authApi';
import { CircularProgress, Button, Box, Pagination, Snackbar, Alert, Typography } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'https://cinematch-api-mhxk.onrender.com';
const MOVIES_PER_PAGE = 30;

const RecommendationPage = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentEndpoint, setCurrentEndpoint] = useState('');
    const [currentFetcher, setCurrentFetcher] = useState(() => fetch);
    const [pageTitle, setPageTitle] = useState('');

    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const contentTypeFromUrl = location.pathname.includes('/tv_shows') ? 'tv_show' : 'movie';
    const pageFromUrl = parseInt(queryParams.get('page')) || 1;
    const genreFromUrl = queryParams.get('genre');
    const isSearchPage = location.pathname.includes('/search');
    
    useEffect(() => {
        setIsAuthenticated(!!getToken());
    }, [location]);

    const executeFetch = useCallback(async (endpoint, fetcher, currentPage) => {
        const fullEndpoint = `${API_URL}${endpoint}?page=${currentPage}&limit=${MOVIES_PER_PAGE}`;
        
        const response = await fetcher(fullEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            let errorMessage = response.statusText;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                console.error("Não foi possível ler o corpo do erro como JSON:", e);
            }
            throw new Error(`${response.status}: ${errorMessage}`);
        }

        const data = await response.json();
        const contentKey = contentTypeFromUrl === 'movie' ? 'movies' : 'tv_shows';

        setTotalCount(data.total_count || 0);
        setTotalPages(Math.ceil((data.total_count || 0) / MOVIES_PER_PAGE));
        
        return data[contentKey] || [];
    }, [contentTypeFromUrl]);

    const loadInitialConfig = useCallback(() => {
        setLoading(true);
        setError(null);

        let endpoint = '';
        let fetcher = fetch;
        let title = '';
        let isPersonalizedAttempt = false;

        const token = getToken();
        const contentPrefix = contentTypeFromUrl === 'movie' ? '' : '/tv_shows';
        const isMovie = contentTypeFromUrl === 'movie';

        if (genreFromUrl) {
            endpoint = `${contentPrefix}/genre/${genreFromUrl}`;
            title = `Melhores ${isMovie ? 'Filmes' : 'Séries'} de ${genreFromUrl}`;
        } else if (isSearchPage) {
            const query = queryParams.get('query');
            endpoint = `${contentPrefix}/search?query=${query}`;
            title = `Resultados da Busca por "${query}"`;
        } else if (token) {
            endpoint = `/recommendations${contentPrefix}`; 
            fetcher = fetchWithAuth;
            title = `Suas Recomendações Personalizadas de ${isMovie ? 'Filmes' : 'Séries'}`;
            isPersonalizedAttempt = true;
        } else {
            endpoint = `/recommendations${contentPrefix}/popular`;
            title = `${isMovie ? 'Filmes' : 'Séries'} Populares para Avaliação`;
        }

        setCurrentEndpoint(endpoint);
        setCurrentFetcher(() => fetcher);
        setPageTitle(title);

        return { endpoint, fetcher, title, isPersonalizedAttempt, contentPrefix, isMovie };
    }, [contentTypeFromUrl, genreFromUrl, isSearchPage, queryParams]);
    
    const fetchData = useCallback(async (endpoint, fetcher, page, isPersonalizedAttempt, contentPrefix, isMovie) => {
        setLoading(true);
        setError(null);
        
        try {
            const initialMovies = await executeFetch(endpoint, fetcher, page);

            if (initialMovies.length > 0) {
                setMovies(initialMovies);
                return;
            }
            
            if (isPersonalizedAttempt) {
                throw new Error("422_FALLBACK_NEEDED: Nenhuma recomendação personalizada encontrada ou Token não autorizado.");
            }
            
            setError("Nenhuma recomendação encontrada. Tente com outro tipo ou gênero.");

        } catch (err) {
            if (isPersonalizedAttempt && (err.message.includes("422") || err.message.includes("422_FALLBACK_NEEDED") || err.message.includes("401"))) {
                
                const friendlyMessage = `Você precisa avaliar mais ${isMovie ? 'filmes' : 'séries'} para receber sugestões personalizadas. Exibindo populares para começar.`;
                
                if (err.message.includes("401")) {
                    removeToken();
                    navigate('/login');
                    setError("Sessão expirada. Faça login novamente.");
                    setLoading(false);
                    return;
                }
                
                setError(friendlyMessage);
                
                setCurrentEndpoint(`/recommendations${contentPrefix}/popular`);
                setCurrentFetcher(() => fetch);
                setPageTitle(`${isMovie ? 'Filmes' : 'Séries'} Populares para Avaliação`);
                
                try {
                    const fallbackMovies = await executeFetch(`/recommendations${contentPrefix}/popular`, fetch, page);
                    if (fallbackMovies.length > 0) {
                        setMovies(fallbackMovies);
                    } else {
                        setError("Não foi possível carregar nenhuma recomendação. Tente novamente mais tarde.");
                    }
                } catch (fallbackError) {
                    setError("Falha ao carregar lista de conteúdo genérica. " + fallbackError.message);
                }
                
            } else {
                setError("Erro ao carregar recomendações: " + err.message);
            }
        } finally {
            setLoading(false);
        }
    }, [executeFetch, navigate]);

    useEffect(() => {
        const { endpoint, fetcher, isPersonalizedAttempt, contentPrefix, isMovie } = loadInitialConfig();
        fetchData(endpoint, fetcher, pageFromUrl, isPersonalizedAttempt, contentPrefix, isMovie);
        setPage(pageFromUrl);
    }, [location.search, location.pathname, pageFromUrl, loadInitialConfig, fetchData]);

    const handlePageChange = (event, value) => {
        navigate(`${location.pathname}?${genreFromUrl ? `genre=${genreFromUrl}&` : ''}${isSearchPage ? `query=${queryParams.get('query')}&` : ''}page=${value}`);
    };

    const handleRating = useCallback(async (tmdbId, rating) => {
        const endpoint = contentTypeFromUrl === 'movie' ? `/ratings/movie/${tmdbId}` : `/ratings/tv_show/${tmdbId}`;
        try {
            const response = await fetchWithAuth(endpoint, {
                method: 'POST',
                body: JSON.stringify({ rating }),
            });

            if (response.ok) {
                setSnackbarMessage("Avaliação registrada com sucesso!");
                setSnackbarOpen(true);
            } else {
                throw new Error('Falha ao registrar avaliação.');
            }
        } catch (error) {
            console.error("Erro ao avaliar:", error);
            setSnackbarMessage("Erro ao registrar avaliação: " + error.message);
            setSnackbarOpen(true);
        }
    }, [contentTypeFromUrl]);

    const handleAddToWishlist = useCallback(async (tmdbId) => {
        const endpoint = `/user/watchlist/${contentTypeFromUrl === 'movie' ? 'movie' : 'tv_show'}/${tmdbId}`;
        try {
            const response = await fetchWithAuth(endpoint, {
                method: 'POST',
            });

            if (response.ok) {
                setSnackbarMessage("Item adicionado à sua Wishlist!");
                setSnackbarOpen(true);
            } else {
                throw new Error('Falha ao adicionar à Wishlist.');
            }
        } catch (error) {
            console.error("Erro ao adicionar à wishlist:", error);
            setSnackbarMessage("Erro ao adicionar à Wishlist: " + error.message);
            setSnackbarOpen(true);
        }
    }, [contentTypeFromUrl]);

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbarOpen(false);
    };

    const pageTitleToDisplay = isSearchPage ? pageTitle : `${pageTitle} (Página ${pageFromUrl})`;

    return (
        <Layout headerTitle={pageTitleToDisplay}>
            <Box sx={{ my: 3 }}>
                <Typography variant="h4" component="h1" align="center" gutterBottom>
                    {pageTitleToDisplay}
                </Typography>
                
                {isAuthenticated && !isSearchPage && !genreFromUrl && (
                    <Typography variant="body1" align="center" color="textSecondary" sx={{ mb: 2 }}>
                        Exibindo {movies.length} de {totalCount} {contentTypeFromUrl === 'movie' ? 'filmes' : 'séries'} recomendados.
                    </Typography>
                )}
            </Box>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
                {!loading && !error && movies.map((movie) => {
                    const releaseDate = movie.release_date || movie.first_air_date;
                    const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
                    const posterUrl = movie.poster_path 
                        ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` 
                        : 'https://via.placeholder.com/500x750.png?text=Sem+Poster';
                    
                    const title = movie.title || movie.name;

                    return (
                        <div key={movie.tmdb_id} style={{ width: 200, border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                            <img 
                                src={posterUrl} 
                                alt={title} 
                                style={{ width: '100%', height: 300, objectFit: 'cover' }} 
                            />
                            <div style={{ padding: '10px' }}>
                                <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'bold' }}>
                                    {title}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {year}
                                </Typography>
                                <StarRating 
                                    initialRating={movie.user_rating || 0}
                                    onRate={(rating) => handleRating(movie.tmdb_id, rating)}
                                    size="medium"
                                    contentType={contentTypeFromUrl}
                                />
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
                    page={pageFromUrl}
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
};

export default RecommendationPage;