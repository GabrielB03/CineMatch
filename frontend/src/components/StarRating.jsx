import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth, getToken } from '../utils/authApi';
import { Alert, Box, Rating } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import { Typography, Button } from '@mui/material';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'https://cinematch-api-mhxk.onrender.com';

const StarRating = ({ tmdbId, initialRating = 0, contentType = 'movie' }) => {
    const initialStars = Math.round(initialRating / 2);

    const [savedRating, setSavedRating] = useState(initialStars);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    const handleRatingClick = async (rating) => {
        setFeedback(null);
        setIsSaving(true);
        
        const token = getToken();
        if (!token) {
            setFeedback({ message: "Você precisa estar logado para avaliar.", type: 'error' });
            setIsSaving(false);
            setTimeout(() => navigate('/login'), 2000);
            return;
        }

        const ratingData = {
            tmdb_id: tmdbId,
            rating: rating * 2,
            content_type: contentType
        };

        try {
            const response = await fetchWithAuth('/ratings', {
                method: "POST",
                body: JSON.stringify(ratingData),
            });

            if (response.status === 401) {
                navigate('/login');
                return;
            }

            const data = await response.json().catch(() => ({ message: response.statusText }));

            if (!response.ok) {
                throw new Error(data.error || data.message || "Falha ao salvar a avaliação.");
            }

            setSavedRating(rating);
            setFeedback({ message: "Avaliação salva com sucesso!", type: 'success' });
            
        } catch (error) {
            console.error(`Erro ao salvar avaliação de ${contentType}`, error);

            let errorMessage = "Erro ao salvar avaliação. ";
            if (error.message.includes("Token expirado")) {
                errorMessage = "Sessão expirada. Faça login novamente";
            } else if (error.message.includes("não encontrado")) {
                errorMessage = `${contentType.toUpperCase()} não encontrado no catálogo. Tente mais tarde.`;
            } else {
                errorMessage += error.message;
            }

            setFeedback({ message: errorMessage, type: 'error' });
            setHoverRating(0);
            setSavedRating(initialStars);
        } finally {
            setIsSaving(false);
            setTimeout(() => setFeedback(null), 5000);
        }
    };
    
    const handleRemoveRating = async () => {
        setFeedback(null);
        setIsSaving(true);
        
        try {
            const response = await fetchWithAuth(`/ratings/${tmdbId}?content_type=${contentType}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Falha ao remover a avaliação.");
            }
            
            setSavedRating(0);
            setFeedback({ message: "Avaliação removida com sucesso!", type: 'success' });
            
        } catch (error) {
            setFeedback({ message: `Erro ao remover avaliação: ${error.message}`, type: 'error' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setFeedback(null), 5000);
        }
    };

    return (
        <Box className="star-rating" sx={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            
            {feedback && (
                <Alert
                    severity={feedback.type}
                    sx={{
                        position: 'absolute',
                        top: '-50px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1000,
                        maxWidth: 300,
                        whiteSpace: 'nowrap',
                        p: 0.5
                    }}
                >
                    {feedback.message}
                </Alert>
            )}

            <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                {[...Array(5)].map((_, index) => {
                    const ratingValue = index + 1;

                    const currentRating = hoverRating || savedRating;
                    const isActive = ratingValue <= currentRating;

                    const StarComponent = isActive ? StarIcon : StarOutlineIcon;

                    return (
                        <StarComponent
                            key={index}
                            onClick={() => handleRatingClick(ratingValue)}
                            onMouseEnter={() => setHoverRating(ratingValue)}
                            onMouseLeave={() => setHoverRating(0)}
                            sx={{
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                color: isActive ? 'gold' : 'gray',
                                fontSize: 28,
                                opacity: isSaving ? 0.7 : 1
                            }}
                        />
                    );
                })}
            </Box>
            {isSaving && <Typography variant="caption" color="primary">Salvando...</Typography>}
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                {savedRating > 0 && !isSaving && (
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        ({savedRating * 2}/10)
                    </Typography>
                )}
                {savedRating > 0 && !isSaving && (
                    <Button
                        onClick={handleRemoveRating}
                        variant="text"
                        color="error"
                        size="small"
                        sx={{ fontSize: '0.7rem', padding: '0 4px', minWidth: 'auto' }}
                    >
                        REMOVER
                    </Button>
                )}
            </Box>
        </Box>
    );
};

export default StarRating;