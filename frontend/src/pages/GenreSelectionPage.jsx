import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { FormControl, InputLabel, Select, MenuItem, Button, Box, CircularProgress, Alert } from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';

const API_BASE_URL = 'https://localhost:5000/api';

const GenreSelectionPage = () => {
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGenres = async () => {
            try {
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

    const handleSubmit = (e) => {
        e.preventDefault();

        if (selectedGenre) {
            navigate(`/recommendations?genre=${selectedGenre}&page=1`);
        } else {
            setError("Por favor, selecione um gênero.");
        }
    };

    if (loading) {
        return (
            <Layout headerTitle="Escolha seu Gênero Favorito">
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                    <p style={{marginLeft: 10}}>Carregando lista de gêneros...</p>
                </Box>
            </Layout>
        );
    }

    if (error && genres.length === 0) {
        return (
            <Layout headerTitle="Escolha seu Gênero Favorito">
                <Alert severity="error" sx={{ my: 2, maxWidth: 600, mx: 'auto' }}>
                    Erro ao carregar gêneros: {error}
                </Alert>
            </Layout>
        );
    }


    return (
        <Layout headerTitle="Escolha seu Gênero Favorito">
            <main>
                <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, margin: '20px auto', display: 'flex', flexDirection: 'column', gap: 3 }}>

                    <FormControl fullWidth variant="outlined">
                        <InputLabel id="genre-select-label">Gênero</InputLabel>
                        <Select
                            labelId="genre-select-label"
                            id="genreSelect"
                            value={selectedGenre}
                            label="Gênero"
                            onChange={(e) => {
                                setSelectedGenre(e.target.value);
                                setError(null);
                            }}
                        >
                            <MenuItem value="">
                                <em>-- Escolha um gênero --</em>
                            </MenuItem>

                            {genres.map(genre => (
                                <MenuItem key={genre.id} value={genre.id}>
                                    {genre.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {error && selectedGenre === '' && (
                        <Alert severity="warning">Por favor, selecione um gênero.</Alert>
                    )}

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<MovieIcon />}
                    >
                        Ver Recomendações
                    </Button>
                </Box>
            </main>
        </Layout>
    );
};

export default GenreSelectionPage;