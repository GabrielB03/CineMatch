import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import StarRating from '../components/StarRating';
import { fetchWithAuth, getToken } from '../utils/authApi';
import { CircularProgress, Button, Box, Pagination, Tabs, Tab, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DeleteIcon from '@mui/icons-material/Delete';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'https://cinematch-api-mhxk.onrender.com';
const ITEMS_PER_PAGE = 30;

const WishlistPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    
    const pageFromUrl = parseInt(new URLSearchParams(location.search).get('page')) || 1;
    const [currentPage, setCurrentPage] = useState(pageFromUrl);
    
    const contentType = tabValue === 0 ? 'movie' : 'tv';

    const executeFetch = useCallback(async (endpoint, currentPage) => {
        const pageParam = `page=${currentPage}&limit=${ITEMS_PER_PAGE}`;
        const finalEndpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${pageParam}`;
        
        const response = await fetchWithAuth(finalEndpoint);
        
        const contentTypeHeader = response.headers.get("content-type");
        if (!contentTypeHeader || !contentTypeHeader.includes("application/json")) {
            const textError = await response.text();
            console.error("Resposta não é JSON:", textError);
            throw new Error(`Resposta inválida do servidor. Tipo de conteúdo: ${contentTypeHeader}`);
        }
        
        const data = await response.json();

        if (response.ok && Array.isArray(data.wishlist)) {
            const totalCount = data.total_count || data.wishlist.length; 
            const calculatedTotalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
            setTotalCount(totalCount);
            setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
            
            return data.wishlist;
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
            const newItems = await executeFetch(endpoint, 1);
            
            setItems(newItems);
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
        setCurrentPage(value);
    };
    
    const handleRemoveFromWishlist = async (tmdbId, itemType) => {
        try {
            const response = await fetchWithAuth(`user/watchlist/${tmdbId}?type=${itemType}`, {
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
    
    const filteredItems = items.filter(item => item.content_type === contentType);
    const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    
    const calculatedTotalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

    if (loading && items.length === 0) {
        return (
            <Layout headerTitle="Sua Lista de Desejos (Wishlist)">
                <div className="empty-message">
                    <CircularProgress color="secondary" />
                    <h2>Carregando sua lista...</h2>
                </div>
            </Layout>
        );
    }
    
    if (error && items.length === 0) {
        return (
            <Layout headerTitle="Sua Lista de Desejos (Wishlist)">
                <div className="error-message">
                    <h2>{error}</h2>
                    <p>Tente recarregar a página.</p>
                </div>
            </Layout>
        );
    }
    
    if (items.length === 0 && !loading) {
        return (
            <Layout headerTitle="Sua Lista de Desejos (Wishlist)">
                <div className="empty-message">
                    <FavoriteIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <h2>Sua Wishlist está vazia!</h2>
                    <p>Adicione filmes e séries que você quer assistir ou ver mais tarde.</p>
                    <Button variant="contained" color="primary" onClick={() => navigate('/recommendations?type=movie')} sx={{ mt: 2 }}>
                        EXPLORAR CONTEÚDO
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
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
                <Tabs value={tabValue} onChange={(e, newValue) => {setTabValue(newValue); setCurrentPage(1);}} aria-label="content type tabs">
                    <Tab label={`Filmes (${items.filter(r => r.content_type === 'movie').length})`} />
                    <Tab label={`Séries (${items.filter(r => r.content_type === 'tv').length})`} />
                </Tabs>
            </Box>
            
            {paginatedItems.length === 0 && !loading ? (
                 <Typography variant="body1">Você não tem {contentType === 'movie' ? 'filmes' : 'séries'} na sua Wishlist.</Typography>
            ) : (
                <div className="card-grid" id="wishlist">
                    {paginatedItems.map((item) => {
                        const content = item.content;
                        const showRating = !!getToken();
                        
                        return (
                            <div className="movie-card" key={`${item.content_type}-${content.tmdb_id}`}>
                                <img 
                                    src={`${TMDB_IMAGE_BASE_URL}${content.poster_path}`} 
                                    alt={`Poster de ${content.title}`} 
                                    className="movie-poster"
                                />
                                <h3>{content.title}</h3>
                                <p className="plot">{content.overview || "Nenhuma descrição disponível."}</p>
                                
                                <div className="rating-area">
                                    {showRating && (
                                        <StarRating 
                                            tmdbId={content.tmdb_id} 
                                            initialRating={content.user_rating || 0} 
                                            contentType={item.content_type}
                                        />
                                    )}
                                    <Button 
                                        variant="contained" 
                                        color="secondary" 
                                        size="small"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => handleRemoveFromWishlist(content.tmdb_id, item.content_type)}
                                        sx={{ mt: 1 }}
                                    >
                                        Remover
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            <Box sx={{ textAlign: 'center', my: 4 }}>
                <Pagination
                    count={calculatedTotalPages}
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