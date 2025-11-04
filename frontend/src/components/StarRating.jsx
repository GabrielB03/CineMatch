import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth, getToken } from '../utils/authApi';
import Feedback from './Feedback';

/**
 * Componente de avaliação por estrelas.
 * @param {number} tmdbId o ID TMDB do filme a ser avaliado.
 * @param {number} initialRating A avaliação atual do usuário (0-10), padrão 0.
*/
const StarRating = ({ tmdbId, initialRating = 0 }) => {
    // Converte a nota 0-10 do Flask para 0-5 estrelas no React
    const initialStars = Math.round(initialRating / 2);

    // Estado que mantém a avaliação salva do usuário
    const [savedRating, setSavedRating] = useState(initialStars);
    // Estado que controla o efeito hover (quantas estrelas estão acesas no momento)
    const [hoverRating, setHoverRating] = useState(0);
    // Estado para feedback (sucesso/erro)
    const [feedback, setFeedback] = useState(null);
    const navigate = useNavigate();

    // ------------------------------------
    // FUNÇÃO DE CLIQUE/AVALIAÇÃO
    // ------------------------------------
    const handleRatingClick = async (rating) => {
        setFeedback(null); // Limpa feedback anterior

        const token = getToken();
        if (!token) {
            setFeedback({ message: "Você precisa estar logado para avaliar.", type: 'error' });
            // Redireciona o usuário após 2 segundos
            setTimeout(() => navigate('/login'), 2000);
            return;
        }

        const ratingData = {
            rating: rating * 2, // Converte 1-5 estrelas para a nota 2-10 esperada pelo Flask
        };

        try {
            // Chama a rota protegida pelo Flask usando o fetchWithAuth
            const response = await fetchWithAuth(`/movies/${tmdbId}/rate`, {
                method: "POST",
                body: JSON.stringify(ratingData),
            });

            // Se a resposta.ok for verdadeira, a avaliação foi salva
            if (response.ok) {
                // Atualiza o estado da avaliação salva (muda o visual de forma permanente)
                setSavedRating(rating);
                setFeedback({ message: "Avaliação salva com sucesso!", type: 'success' });
            } else {
                // A função fetchWithAuth já lança um erro para 401, 404, etc.
                // Este bloco só deve pegar erros não tratados pelo fetchWithAuth
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message);
            }
        } catch (error) {
            console.error("Erro ao salvar avaliação", error);

            let errorMessage = "Erro ao salvar avaliação. ";
            if (error.message.includes("Token expirado")) {
                errorMessage = "Sessão expirada. Faça login novamente";
                // O redirecionamento para o login deve ser feito aqui ou no componente que usa o token.
            } else {
                errorMessage += error.message;
            }

            setFeedback({ message: errorMessage, type: 'error' });

            // Reverte o visual para a nota salva anteriormente em caso de erro
            setHoverRating(0);
        }
    };

    // ------------------------------------
    // RENDERIZAÇÃO
    // ------------------------------------
    return (
        // O container deve ter position: relative para o Feedback absoluto funcionar
        <div className="star-rating" style={{ position: 'relative' }}>
            {/* O componente Feedback é renderizado acima das estrelas */}
            {feedback && <Feedback message={feedback.message} type={feedback.type} />}

            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;

                // Determina se a estrela deve estar ativa
                const isActive = ratingValue <= (hoverRating || savedRating);

                return (
                    <span
                        key={index}
                        className={`star ${isActive ? 'active' : ''}`}
                        onClick={() => handleRatingClick(ratingValue)}
                        onMouseEnter={() => setHoverRating(ratingValue)}
                        onMouseLeave={() => setHoverRating(0)} // Reseta o hover ao sair
                        data-value={ratingValue}
                        dangerouslySetInnerHTML={{ __html: '&#9733;' }}
                    />
                );
            })}
        </div>
    );
};

export default StarRating;