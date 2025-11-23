import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth, getToken } from '../utils/authApi';
import { Alert, Box } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarOutlineIcon from '@mui/icons-material/StarOutline';


const StarRating = ({ tmdbId, initialRating = 0 }) => {
    const initialStars = Math.round(initialRating / 2);

    const [savedRating, setSavedRating] = useState(initialStars);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const navigate = useNavigate();

    const handleRatingClick = async (rating) => {
        setFeedback(null);

        const token = getToken();
        if (!token) {
            setFeedback({ message: "Você precisa estar logado para avaliar.", type: 'error' });
            setTimeout(() => navigate('/login'), 2000);
            return;
        }

        const ratingData = {
            rating: rating * 2,
        };

        try {
            const response = await fetchWithAuth(`/movies/${tmdbId}/rate`, {
                method: "POST",
                body: JSON.stringify(ratingData),
            });

            if (response.ok) {
                setSavedRating(rating);
                setFeedback({ message: "Avaliação salva com sucesso!", type: 'success' });
            } else {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message);
            }
        } catch (error) {
            console.error("Erro ao salvar avaliação", error);

            let errorMessage = "Erro ao salvar avaliação. ";
            if (error.message.includes("Token expirado")) {
                errorMessage = "Sessão expirada. Faça login novamente";
            } else {
                errorMessage += error.message;
            }

            setFeedback({ message: errorMessage, type: 'error' });
            setHoverRating(0);
        }
    };

    return (
        <Box className="star-rating" sx={{ position: 'relative', display: 'inline-flex', gap: 0.5 }}>
            
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
                        whiteSpace: 'nowrap'
                    }}
                >
                    {feedback.message}
                </Alert>
            )}

            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;

                const isActive = ratingValue <= (hoverRating || savedRating);

                const Star = isActive ? StarIcon : StarOutlineIcon;

                return (
                    <Star
                        key={index}
                        onClick={() => handleRatingClick(ratingValue)}
                        onMouseEnter={() => setHoverRating(ratingValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        sx={{
                            cursor: 'pointer',
                            color: isActive ? 'gold' : 'gray',
                            fontSize: 28
                        }}
                    />
                );
            })}
        </Box>
    );
};

export default StarRating;