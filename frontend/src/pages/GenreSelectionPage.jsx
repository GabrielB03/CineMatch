import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const API_BASE_URL = 'http://localhost:5000';

const GenreSelectionPage = () => {
    // 1. Estados para gerenciar dados e UI
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // 2. Efeito para buscar a lista de gêneros na inicialização
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                // Rota para buscar gêneros
                const res = await fetch(`${API_BASE_URL}/genres`);

                if (!res.ok) {
                    throw new Error(`Erro ${res.status}: Não foi possível carregar os gêneros.`);
                }

                const data = await res.json();

                if (data.genres && Array.isArray(data.genres)) {
                    setGenres(data.genres);
                } else {
                    throw new Error("Formato de dados de gêneros inválido.");
                }
            } catch (err) {
                console.error("Erro ao carregar gêneros:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchGenres();
    }, []);

    // 3. Função de submissão do formulário
    const handleSubmit = (e) => {
        e.preventDefault();

        if (selectedGenre) {
            // Redireciona para a página de recomendações, passando o gênero como parâmetro de busca (query param)
            navigate(`/recommendations?genre=${selectedGenre}`);
        } else {
            alert("Por favor, selecione um gênero.");
        }
    };

    // 4. Renderização do conteúdo
    const renderContent = () => {
        if (loading) {
            return <p className="loading">Carregando lista de gêneros...</p>;
        }

        if (error) {
            return <p className="error-message">Erro ao carregar gêneros: {error}</p>;
        }

        return (
            <form onSubmit={handleSubmit}>
                <select
                    id="genreSelect"
                    required
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                >

                    <option value="">-- Escolha um gênero --</option>
                
                    {/* Renderiza as opções do Flask */}
                    {genres.map(genre => (
                        <option key={genre.id} value={genre.id}>
                            {genre.name}
                        </option>
                    ))}
                </select>
                <button type="submit">Ver Recomendações</button>
            </form>
        );
    };

    return (
        <Layout headerTitle="Escolha seu Gênero Favorito">
            <main>
                {renderContent()}
            </main>
        </Layout>
    );
};

export default GenreSelectionPage;