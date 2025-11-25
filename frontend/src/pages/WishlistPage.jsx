import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import StarRating from '../components/StarRating';
import { fetchWithAuth, getToken } from '../utils/authApi';
import { CircularProgress, Button, Box, Pagination } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DeleteIcon from '@mui/icons-material/Delete';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const API_BASE_URL = 'https://localhost:5000/api';
const MOVIES_PER_PAGE = 30;

const WishlistPage = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    
    const pageFromUrl = parseInt(new URLSearchParams(location.search).get('page')) || 1;
    const [currentPage, setCurrentPage] = useState(pageFromUrl);

    const executeFetch = useCallback(async (endpoint, currentPage) => {
        const pageParam = `page=${currentPage}&limit=${MOVIES_PER_PAGE}`;
        const finalEndpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${pageParam}`;
        
        const response = await fetchWithAuth(finalEndpoint);
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const textError = await response.text();
            console.error("Resposta não é JSON:", textError);
            throw new Error(`Resposta inválida do servidor. Tipo de conteúdo: ${contentType}`);
        }
        
        const data = await response.json();

        if (response.ok && Array.isArray(data.wishlist)) {
            const totalCount = data.total_count || data.wishlist.length; 
            const calculatedTotalPages = Math.ceil(totalCount / MOVIES_PER_PAGE);
            setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
            
            return data.wishlist.map(item => item.movie ? item.movie : item);
        } else {
            return [];
        }
    }, []);
    
    const loadWishlist = useCallback(async (pageToLoad) => {
        if (!getToken()) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const endpoint = `user/watchlist`; 
            const newMovies = await executeFetch(endpoint, pageToLoad);
            
            setMovies(newMovies);
            setCurrentPage(pageToLoad);
            
        } catch (err) {
            console.error("Erro ao carregar Wishlist:", err);
            
            if (err.message.includes("Token expirado") || err.message.includes("Token não encontrado")) {
                navigate('/login');
                setError("Sessão expirada. Faça login novamente.");
            } else {
                setError("Falha ao carregar a Wishlist. " + err.message);
            }
        } finally {
            setLoading(false);
        }
    }, [executeFetch, navigate]);
    
    useEffect(() => {
        loadWishlist(pageFromUrl);
    }, [pageFromUrl, loadWishlist]);

    const handlePageChange = (event, value) => {
        navigate(`${location.pathname}?page=${value}`);
    };
    
    const handleRemoveFromWishlist = async (tmdbId) => {
        try {
            const response = await fetchWithAuth(`user/watchlist/${tmdbId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error("Falha ao remover item da Wishlist.");
            }

            loadWishlist(currentPage); 
        } catch (err) {
            setError(err.message);
        }
    };


    if (loading && movies.length === 0) {
        return (
            <Layout headerTitle="Sua Lista de Desejos (Wishlist)">
                <div className="empty-message">
                    <CircularProgress color="secondary" />
                    <h2>Carregando sua lista...</h2>
                </div>
            </Layout>
        );
    }
    
    if (error && movies.length === 0) {
        return (
            <Layout headerTitle="Sua Lista de Desejos (Wishlist)">
                <div className="error-message">
                    <h2>{error}</h2>
                    <p>Tente recarregar a página.</p>
                </div>
            </Layout>
        );
    }
    
    if (movies.length === 0 && !loading) {
        return (
            <Layout headerTitle="Sua Lista de Desejos (Wishlist)">
                <div className="empty-message">
                    <FavoriteIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <h2>Sua Wishlist está vazia!</h2>
                    <p>Adicione filmes que você quer assistir ou ver mais tarde.</p>
                    <Button variant="contained" color="primary" onClick={() => navigate('/recommendations')} sx={{ mt: 2 }}>
                        EXPLORAR FILMES
                    </Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout headerTitle="Sua Lista de Desejos (Wishlist)">
            {error && (
                <div className="alert-message" style={{ margin: '15px 0' }}>
                    <p>⚠️ {error}</p>
                </div>
            )}
            
            <div className="card-grid" id="wishlist">
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
                                    startIcon={<DeleteIcon />}
                                    onClick={() => handleRemoveFromWishlist(movie.tmdb_id)}
                                    sx={{ mt: 1 }}
                                >
                                    Remover
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
        </Layout>
    );
};

export default WishlistPage;