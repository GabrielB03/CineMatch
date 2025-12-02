import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Container, Typography, Grid, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import axios from 'axios';
import { getToken } from '../utils/authApi';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'https://localhost:5000/api';

const UserListPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            if (!getToken()) {
                setError("Você precisa estar logado para ver outros usuários.");
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${API_URL}/users`, {
                    withCredentials: true,
                });
                setUsers(response.data.map(u => ({ id: u.id, username: u.username })));
                setLoading(false);
            } catch (err) {
                console.error("Erro ao buscar usuários:", err);
                setError("Falha ao carregar a lista de usuários.");
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return <Layout headerTitle="Comunidade"><CircularProgress sx={{ display: 'block', margin: '40px auto' }} /></Layout>;
    }

    if (error) {
        return <Layout headerTitle="Comunidade"><Alert severity="error" sx={{ mt: 2 }}>{error}</Alert></Layout>;
    }

    return (
        <Layout headerTitle="Comunidade">
            <Container maxWidth="md">
                <Typography variant="h4" gutterBottom>
                    Usuários do CineMatch ({users.length})
                </Typography>
                <Grid container spacing={3}>
                    {users.map((user) => (
                        <Grid item key={user.id} xs={12} sm={6} md={4}>
                            <Card
                                component={Link}
                                to={`/users/${user.id}`}
                                sx={{
                                    textDecoration: 'none',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    p: 3,
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'scale(1.03)', boxShadow: 6 }
                                }}
                            >
                                <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                <Typography variant="h6" component="div">
                                    {user.username}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Ver Avaliações
                                </Typography>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Layout>
    );
};

export default UserListPage;