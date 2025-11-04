import React, { useEffect, useState } from 'react';

const Feedback = ({ message, type, duration = 3000 }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (message) {
            // Esconde a mensagem após a duração definida
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, duration);

            return () => clearTimeout(timer); // Limpa o timer ao desmontar
        }
    }, [message, duration]);

    if (!message || !isVisible) return null;

    // Define o estilo com base no tipo
    const style = {
        position: 'absolute',
        top: '-35px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: type === 'error' ? '#D32F2F' : '#4CAF50', // Vermelho para erro, Verde para sucesso
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 1000,
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        transition: 'opacity 0.3s ease'
    };

    return (
        <div style={style}>
            {message}
        </div>
    );
};

export default Feedback;