import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import Layout from '../components/Layout';
import StarRating from '../components/StarRating';
// O arquivo authApi.js deve ser modificado para propagar a mensagem 422
import { fetchWithAuth, removeToken, getToken } from '../utils/authApi'; 

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const API_BASE_URL = 'http://localhost:5000'; // Base da API Flask

const RecommendationPage = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    
    // 1. Extrai o parâmetro 'genre' da URL (ex: ?genre=28)
    const queryParams = new URLSearchParams(location.search);
    const genreId = queryParams.get('genre');

    // Estado para armazenar o nome do gênero ou o título padrão
    const [pageTitle, setPageTitle] = useState("Recomendações");

    /**
     * Função auxiliar para executar a chamada de API e processar a resposta.
     * @param {string} endpoint - O endpoint RELATIVO (ex: /recommendations/genre?genre_id=X).
     * @param {function} fetcher - fetch ou fetchWithAuth.
     * @returns {Promise<boolean>} Retorna true em caso de sucesso, false em caso de falha controlada (ex: array vazio).
     */
    const executeFetch = async (endpoint, fetcher) => {
        let response;
        const isAuthCall = fetcher === fetchWithAuth;
        let url = isAuthCall ? endpoint : `${API_BASE_URL}${endpoint}`; // CORREÇÃO: Monta a URL completa para fetch padrão

        // Realiza a chamada. Se for fetchWithAuth, ele cuida do token e da URL base.
        // Se for fetch padrão (público), usa a URL completa montada acima.
        if (isAuthCall) {
            response = await fetcher(endpoint); // fetchWithAuth adiciona API_BASE_URL
        } else {
            response = await fetcher(url, { // fetch padrão usa a URL completa
                headers: { "Content-Type": "application/json" }
            }); 
        }
        
        const data = await response.json();

        // O Flask pode retornar 'recommendations' ou 'movies'
        const results = data.recommendations || data.movies;

        if (response.ok && Array.isArray(results)) {
            setMovies(results);
            return true; // Sucesso
        } else {
            setMovies([]);
            return false; // Falha (dados vazios, mas sem erro de rede/servidor)
        }
    };
    
    // ------------------------------------
    // FUNÇÃO DE CARREGAMENTO DE DADOS (useEffect)
    // ------------------------------------
    useEffect(() => {
        const loadRecommendations = async () => {
            setLoading(true);
            setError(null);
            
            const token = getToken();
            
            let initialEndpoint = ""; // Endpoint deve ser RELATIVO (ex: /recommendations...)
            let initialFetcher = fetch;
            let initialTitle = "Recomendações";
            let isPersonalizedAttempt = false; // Flag para saber se tentamos a rota JWT
            
            // Lógica para determinar o ENDPOINT INICIAL
            if (genreId) {
                // Caso 1: Busca por Gênero (Pública)
                initialEndpoint = `/recommendations/genre?genre_id=${genreId}`; // CORREÇÃO: Endpoint RELATIVO
                initialTitle = "Recomendações por Gênero Selecionado";
            } else if (token) {
                // Caso 2: Busca Personalizada (Usuário Logado)
                initialEndpoint = "/recommendations"; // Endpoint RELATIVO para fetchWithAuth
                initialFetcher = fetchWithAuth;
                initialTitle = "Suas Recomendações Personalizadas";
                isPersonalizedAttempt = true;
            } else {
                // Usuário não logado e sem gênero -> Redireciona
                navigate('/login');
                return;
            }
            
            // Define o título antes de iniciar a busca
            setPageTitle(initialTitle);


            try {
                // Tenta a primeira busca (Personalizada ou por Gênero com ID)
                const success = await executeFetch(initialEndpoint, initialFetcher);

                if (success) {
                    setPageTitle(initialTitle);
                    return; // Sai se a busca inicial for bem-sucedida
                }
                
                // Se falhou (sem erro), mas era a tentativa personalizada, faz o fallback
                if (isPersonalizedAttempt) {
                    throw new Error("422_FALLBACK_NEEDED: Nenhuma recomendação personalizada encontrada.");
                }

            } catch (err) {
                console.error("Erro ao carregar recomendações:", err);
                
                // 1. Tratamento de Erro de Autenticação (401 - Token expirado)
                if (err.message.includes("Token expirado") || err.message.includes("Token não encontrado")) {
                    removeToken();
                    navigate('/login');
                    setError("Sessão expirada. Faça login novamente.");
                    return;
                }
                
                // 2. Tratamento de Erro de Dados Insuficientes (422) ou Falha na Personalização
                if (isPersonalizedAttempt && (err.message.includes("422") || err.message.includes("422_FALLBACK_NEEDED"))) {
                    
                    // Define uma mensagem de erro amigável
                    const friendlyMessage = "Você precisa avaliar mais filmes para receber sugestões personalizadas. Exibindo filmes populares para começar.";
                    setError(friendlyMessage);
                    
                    // --- FALLBACK: Tenta carregar a lista genérica (Popular/Recentes) ---
                    const fallbackEndpoint = `/recommendations/genre`; // Rota genérica RELATIVA (sem API_BASE_URL)
                    const fallbackTitle = "Filmes Populares para Avaliação";
                    
                    try {
                        const fallbackSuccess = await executeFetch(fallbackEndpoint, fetch);
                        if (fallbackSuccess) {
                            setPageTitle(fallbackTitle);
                            // Se o fallback for bem-sucedido, o estado de ERRO permanece
                            // mas o array de MOVIES é preenchido.
                        } else {
                             // Falhou a personalizada e a genérica
                             setError("Não foi possível carregar nenhuma recomendação. Tente novamente mais tarde.");
                        }
                    } catch (fallbackError) {
                        console.error("Erro no fallback:", fallbackError);
                        setError("Falha ao carregar lista de filmes genérica. " + fallbackError.message);
                    }
                    
                } else {
                    // Outros erros (rede, 404, etc.)
                    setError("Erro ao carregar recomendações: " + err.message);
                }
            } finally {
                setLoading(false);
            }
        };

        loadRecommendations();
    }, [navigate, genreId, location.search]);

    // ------------------------------------
    // RENDERIZAÇÃO DE ESTADOS
    // ------------------------------------
    
    if (loading) {
        return (
            <Layout headerTitle={pageTitle}>
                <div className="empty-message">
                    <h2>Carregando recomendações...</h2>
                </div>
            </Layout>
        );
    }
    
    // Se há ERRO e não há filmes (caso de erro fatal OU 422 onde o fallback falhou)
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
    
    // Se há filmes (incluindo o caso de sucesso no fallback)
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

    // ------------------------------------
    // RENDERIZAÇÃO PRINCIPAL (Cards de Filme)
    // ------------------------------------
    return (
        <Layout headerTitle={pageTitle}>
            {/* Exibe a mensagem de erro amigável APENAS se o fallback foi um sucesso, 
                indicando que a personalização falhou, mas a lista genérica carregou. */}
            {error && movies.length > 0 && (
                 <div className="alert-message">
                    <p>⚠️ {error}</p>
                 </div>
            )}
            
            <h2>{pageTitle}</h2>
            <div className="card-grid" id="recommendationsList">
                {movies.map((movie) => {
                    // Checa o token para decidir se exibe o componente de avaliação
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
                                {/* StarRating só é exibido se o usuário estiver logado */}
                                {showRating && (
                                    <StarRating 
                                        tmdbId={movie.tmdb_id} 
                                        initialRating={movie.user_rating || 0} 
                                    />
                                )}
                                {/* Onde assistir */}
                                {movie.watch_providers && (
                                    <p className="watch-providers">Onde assistir: {movie.watch_providers}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Layout>
    );
};

export default RecommendationPage;