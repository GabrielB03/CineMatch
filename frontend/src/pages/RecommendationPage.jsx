import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import StarRating from '../components/StarRating';
import { fetchWithAuth, removeToken, getToken } from '../utils/authApi';
import { CircularProgress, Button, Box, Pagination, Snackbar, Alert } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const API_BASE_URL = 'https://localhost:5000/api';
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
    const navigate = useNavigate();
    const location = useLocation();
    
    const queryParams = new URLSearchParams(location.search);
    const genreId = queryParams.get('genre');
    const pageFromUrl = parseInt(queryParams.get('page')) || 1;

    const [pageTitle, setPageTitle] = useState("Recomendações");
    const [currentFetcher, setCurrentFetcher] = useState(null);
    const [currentEndpoint, setCurrentEndpoint] = useState(null);
    
    const executeFetch = useCallback(async (endpoint, fetcher, currentPage) => {
        let response;
        const isAuthCall = fetcher === fetchWithAuth;
        const pageParam = `page=${currentPage}&limit=${MOVIES_PER_PAGE}`;
        const finalEndpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${pageParam}`;
        
        if (isAuthCall) {
            response = await fetcher(finalEndpoint);
        } else {
            response = await fetch(API_BASE_URL + finalEndpoint, {
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
            });
        }
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: Falha na requisição da API.`);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const textError = await response.text();
            console.error("Resposta não é JSON:", textError);
            throw new Error(`Resposta inválida do servidor. Tipo de conteúdo: ${contentType}`);
        }
        
        const data = await response.json();

        const results = data.recommendations || data.movies;

        if (response.ok && Array.isArray(results)) {
            const newMovies = results.map(m => m.movie ? m.movie : m);
            
            const count = data.total_count || newMovies.length;
            setTotalCount(count);
            setTotalPages(Math.ceil(count / MOVIES_PER_PAGE) || 1);
            
            return newMovies;
        } else {
            return [];
        }
    }, []);
    
    const loadMovies = useCallback(async (currentPage) => {
        const fetcher = currentFetcher;
        const endpoint = currentEndpoint;
        
        if (!endpoint || !fetcher) return;

        setLoading(true);
        setError(null);
        setPage(currentPage);

        try {
            const newMovies = await executeFetch(endpoint, fetcher, currentPage);
            setMovies(newMovies);
            
        } catch (err) {
            console.error("Erro ao carregar recomendações:", err);
            
            if (err.message.includes("Token expirado") || err.message.includes("Token não encontrado")) {
                removeToken();
                navigate('/login');
                setError("Sessão expirada. Faça login novamente.");
            } else {
                setError("Falha ao carregar filmes. " + err.message);
            }
        } finally {
            setLoading(false);
        }
    }, [currentFetcher, currentEndpoint, executeFetch, navigate]);

    useEffect(() => {
        const loadInitialConfig = async () => {
            setLoading(true);
            setError(null);
            
            const token = getToken();
            let endpoint = "";
            let fetcher = fetch;
            let title = "Recomendações";
            let isPersonalizedAttempt = false;
            
            let genreParam = genreId ? `?genre_id=${genreId}` : '';
            
            if (genreId) {
                endpoint = `/recommendations/genre${genreParam}`; 
                title = "Recomendações por Gênero Selecionado";
            } else if (token) {
                endpoint = "/recommendations"; 
                fetcher = fetchWithAuth;
                title = "Suas Recomendações Personalizadas";
                isPersonalizedAttempt = true;
            } else {
                endpoint = "/movies/catalog"; 
                fetcher = fetch;
                title = "Catálogo Completo (A-Z)";
            }
            
            setPageTitle(title);
            setCurrentFetcher(() => fetcher);
            setCurrentEndpoint(endpoint);
            setPage(pageFromUrl);
            
            try {
                const initialMovies = await executeFetch(endpoint, fetcher, pageFromUrl);

                if (initialMovies.length > 0) {
                    setMovies(initialMovies);
                    return;
                }
                
                if (isPersonalizedAttempt) {
                    throw new Error("422_FALLBACK_NEEDED: Nenhuma recomendação personalizada encontrada.");
                }

            } catch (err) {
                if (isPersonalizedAttempt && (err.message.includes("422") || err.message.includes("422_FALLBACK_NEEDED"))) {
                    
                    const friendlyMessage = "Você precisa avaliar mais filmes para receber sugestões personalizadas. Exibindo filmes populares para começar.";
                    setError(friendlyMessage);
                    
                    setCurrentEndpoint(`/recommendations/popular`);
                    setCurrentFetcher(() => fetch);
                    setPageTitle("Filmes Populares para Avaliação");
                    
                    try {
                        const fallbackMovies = await executeFetch(`/recommendations/popular`, fetch, pageFromUrl);
                        if (fallbackMovies.length > 0) {
                            setMovies(fallbackMovies);
                        } else {
                            setError("Não foi possível carregar nenhuma recomendação. Tente novamente mais tarde.");
                        }
                    } catch (fallbackError) {
                        console.error("Erro no fallback:", fallbackError);
                        setError("Falha ao carregar lista de filmes genérica. " + fallbackError.message);
                    }
                    
                } else {
                    setError("Erro ao carregar recomendações: " + err.message);
                }
            } finally {
                setLoading(false);
            }
        };

        loadInitialConfig();
    }, [navigate, genreId, location.search, executeFetch]);
    
    useEffect(() => {
        if (currentEndpoint) {
            loadMovies(pageFromUrl);
        }
    }, [pageFromUrl, currentEndpoint, loadMovies]);

    const handlePageChange = (event, value) => {
        let newSearch = `?page=${value}`;
        
        if (genreId) {
            newSearch += `&genre=${genreId}`;
        }
        
        navigate(`${location.pathname}${newSearch}`);
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

    if (loading && movies.length === 0) {
        return (
            <Layout headerTitle={pageTitle}>
                <div className="empty-message">
                    <CircularProgress />
                    <h2>Carregando recomendações...</h2>
                </div>
            </Layout>
        );
    }
    
    if (error && movies.length === 0) {
        return (
            <Layout headerTitle={pageTitle}>
                <div className="error-message">
                    <h2>{error}</h2>
                    <p>Tente recarregar a página ou <a href="/login">fazer login</a>.</p>
                </div>
            </Layout>
        );
    }
    
    if (movies.length === 0) {
        return (
            <Layout headerTitle={pageTitle}>
                <div className="empty-message">
                    <h2>Nenhuma recomendação encontrada.</h2>
                    <p>Por favor, <a href="/genres">escolha um gênero</a> ou <a href="/login">faça login</a> para receber as primeiras sugestões.</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout headerTitle={pageTitle}>
            {error && (
                <div className="alert-message" style={{ margin: '15px 0' }}>
                    <p>⚠️ {error}</p>
                </div>
            )}
            
            <h2 style={{ marginBottom: '20px' }}>Resultados ({totalCount} itens)</h2>
            <div className="card-grid" id="recommendationsList">
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