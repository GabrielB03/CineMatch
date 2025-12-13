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
    const navigate = useNavigate();
    const location = useLocation();
    
    const queryParams = new URLSearchParams(location.search);
    const genreId = queryParams.get('genre');
    const pageFromUrl = parseInt(queryParams.get('page')) || 1;
    const contentTypeFromUrl = queryParams.get('type') || 'movie';

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
            response = await fetch(API_URL + finalEndpoint, {
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
            });
        }
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: Falha na requisição da API.`);
        }
        
        const contentTypeHeader = response.headers.get("content-type");
        if (!contentTypeHeader || !contentTypeHeader.includes("application/json")) {
            const textError = await response.text();
            console.error("Resposta não é JSON:", textError);
            throw new Error(`Resposta inválida do servidor. Tipo de conteúdo: ${contentTypeHeader}`);
        }
        
        const data = await response.json();

        const results = data.recommendations || data.movies || data.tv_shows;

        if (response.ok && Array.isArray(results)) {
            const newContent = results.map(item => item.movie || item.tv_show || item);
            
            const count = data.total_count || newContent.length;
            setTotalCount(count);
            setTotalPages(Math.ceil(count / MOVIES_PER_PAGE) || 1);
            
            return newContent;
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
                setError("Falha ao carregar conteúdo. " + err.message);
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
            const isMovie = contentTypeFromUrl === 'movie';
            let title = `Recomendações de ${isMovie ? 'Filmes' : 'Séries'}`;
            let isPersonalizedAttempt = false;
            
            const contentPrefix = isMovie ? '' : `/${contentTypeFromUrl}`;
            
            let genreParam = genreId ? `?genre_id=${genreId}` : '';
            
            if (genreId) {
                endpoint = `/recommendations${contentPrefix}/genre${genreParam}`; 
                title = `Recomendações de ${isMovie ? 'Filmes' : 'Séries'} por Gênero`;
            } else if (token) {
                endpoint = `/recommendations${contentPrefix}`; 
                fetcher = fetchWithAuth;
                title = `Suas Recomendações Personalizadas de ${isMovie ? 'Filmes' : 'Séries'}`;
                isPersonalizedAttempt = true;
            } else {
                endpoint = `/recommendations${contentPrefix}/popular`; 
                fetcher = fetch;
                title = `${isMovie ? 'Filmes' : 'Séries'} Populares`;
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
                    
                    const friendlyMessage = `Você precisa avaliar mais ${isMovie ? 'filmes' : 'séries'} para receber sugestões personalizadas. Exibindo populares para começar.`;
                    setError(friendlyMessage);
                    
                    setCurrentEndpoint(`/recommendations${contentPrefix}/popular`);
                    setCurrentFetcher(() => fetch);
                    setPageTitle(`${isMovie ? 'Filmes' : 'Séries'} Populares para Avaliação`);
                    
                    try {
                        const fallbackMovies = await executeFetch(`/recommendations${contentPrefix}/popular`, fetch, pageFromUrl);
                        if (fallbackMovies.length > 0) {
                            setMovies(fallbackMovies);
                        } else {
                            setError("Não foi possível carregar nenhuma recomendação. Tente novamente mais tarde.");
                        }
                    } catch (fallbackError) {
                        console.error("Erro no fallback:", fallbackError);
                        setError("Falha ao carregar lista de conteúdo genérica. " + fallbackError.message);
                    }
                    
                } else {
                    setError("Erro ao carregar recomendações: " + err.message);
                }
            } finally {
                setLoading(false);
            }
        };

        loadInitialConfig();
    }, [navigate, genreId, location.search, executeFetch, contentTypeFromUrl]);
    
    useEffect(() => {
        if (currentEndpoint) {
            loadMovies(pageFromUrl);
        }
    }, [pageFromUrl, currentEndpoint, loadMovies]);

    const handlePageChange = (event, value) => {
        let newSearch = `?page=${value}&type=${contentTypeFromUrl}`;
        
        if (genreId) {
            newSearch += `&genre=${genreId}`;
        }
        
        navigate(`${location.pathname}${newSearch}`);
    };
    
    const handleAddToWishlist = async (tmdbId) => {
        if (!getToken()) {
            setSnackbarMessage("Faça login para adicionar conteúdo à sua Wishlist.");
            setSnackbarOpen(true);
            return;
        }
        try {
            const response = await fetchWithAuth(`user/watchlist/add/${tmdbId}?type=${contentTypeFromUrl}`, {
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
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                <Button
                    variant={contentTypeFromUrl === 'movie' ? 'contained' : 'outlined'}
                    onClick={() => {
                        const newParams = new URLSearchParams(location.search);
                        newParams.set('type', 'movie');
                        navigate(location.pathname + '?' + newParams.toString());
                    }}
                >
                    Ver Filmes
                </Button>
                <Button
                    variant={contentTypeFromUrl === 'tv' ? 'contained' : 'outlined'}
                    onClick={() => {
                        const newParams = new URLSearchParams(location.search);
                        newParams.set('type', 'tv');
                        navigate(location.pathname + '?' + newParams.toString());
                    }}
                >
                    Ver Séries
                </Button>
            </Box>
            
            <h2 style={{ marginBottom: '20px' }}>Resultados ({totalCount} itens)</h2>
            <div className="card-grid" id="recommendationsList">
                {movies.map((movie) => {
                    const showRating = !!getToken();
                    
                    return (
                        <div className="movie-card" key={movie.tmdb_id}>
                            <img 
                                src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`} 
                                alt={`Poster do conteúdo ${movie.title}`} 
                                className="movie-poster"
                            />
                            <h3>{movie.title}</h3>
                            <p className="plot">{movie.overview || "Nenhuma descrição disponível."}</p>
                            
                            <div className="rating-area">
                                {showRating && (
                                    <StarRating 
                                        tmdbId={movie.tmdb_id} 
                                        initialRating={movie.user_rating || 0} 
                                        contentType={contentTypeFromUrl}
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