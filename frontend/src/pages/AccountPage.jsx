import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { fetchWithAuth, getToken, decodeToken } from '../utils/authApi';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Paper, Typography, Alert, CircularProgress } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const AccountPage = () => {
    const [user, setUser] = useState({ username: '', email: '' });
    const [newPassword, setNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [message, setMessage] = useState({ text: null, type: null });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserProfile = async () => {
            setLoading(true);
            try {
                const response = await fetchWithAuth("/auth/user-profile", { method: "GET" }); 
                
                if (response.status === 401) {
                    navigate('/login');
                    return;
                }

                const data = await response.json();
                
                setUser({
                    username: data.username || '',
                    email: data.email || '',
                });

            } catch (error) {
                console.error("Erro ao carregar perfil:", error);

                if (error.message.includes('401')) {
                     navigate('/login');
                } else {
                    setMessage({ text: "Não foi possível carregar os dados do perfil.", type: 'error' });
                }
            } finally {
                setLoading(false);
            }
        };

        if (getToken()) {
            fetchUserProfile();
        } else {
             navigate('/login');
        }
        
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: null, type: null });
        setLoading(true);

        const updateData = {
            username: user.username,
            email: user.email,
            current_password: currentPassword,
            new_password: newPassword || undefined,
        };

        if (!updateData.username || !updateData.email || !updateData.current_password) {
            setMessage({ text: "A senha atual é obrigatória para qualquer alteração.", type: 'error' });
            setLoading(false);
            return;
        }

        try {
            const response = await fetchWithAuth("/auth/account", {
                method: "PUT",
                body: JSON.stringify(updateData),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.new_access_token) {
                    const updatedUserData = decodeToken(data.new_access_token);
                    if (updatedUserData) {
                        setUser({
                            username: updatedUserData.username,
                            email: updatedUserData.email,
                        });
                    }
                }
                
                setMessage({ text: data.message || "Conta atualizada com sucesso!", type: 'success' });
                setNewPassword('');
                setCurrentPassword('');
                
            } else {
                setMessage({ text: data.message || "Erro ao atualizar conta.", type: 'error' });
            }
        } catch (error) {
            console.error("Erro na API de conta:", error);
            if (error.message.includes('401')) {
                 setMessage({ text: "Sessão expirada. Faça login novamente.", type: 'error' });
                 setTimeout(() => navigate('/login'), 2000);
            } else {
                setMessage({ text: "Erro de conexão ou sessão expirada.", type: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout headerTitle="Configurações da Conta">
            <Box sx={{ maxWidth: 500, margin: '50px auto' }}>
                <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="h5" align="center" gutterBottom>
                        <AccountCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Meu Perfil
                    </Typography>
                    
                    {loading && <CircularProgress sx={{ mx: 'auto', my: 2 }} />}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        
                        <TextField
                            label="Nome de Usuário"
                            type="text"
                            variant="outlined"
                            fullWidth
                            required
                            value={user.username}
                            onChange={(e) => setUser({ ...user, username: e.target.value })}
                            disabled={loading}
                        />

                        <TextField
                            label="E-mail"
                            type="email"
                            variant="outlined"
                            fullWidth
                            required
                            value={user.email}
                            onChange={(e) => setUser({ ...user, email: e.target.value })}
                            disabled={loading}
                        />
                        
                        <Typography variant="subtitle1" sx={{ mt: 1, mb: -1, color: 'text.secondary' }}>
                            Alterar Senha (Opcional)
                        </Typography>

                        <TextField
                            label="Nova Senha (deixe vazio para não alterar)"
                            type="password"
                            variant="outlined"
                            fullWidth
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={loading}
                        />

                        <TextField
                            label="Senha Atual (Obrigatório para confirmar)"
                            type="password"
                            variant="outlined"
                            fullWidth
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={loading}
                        />

                        {message.text && (
                            <Alert severity={message.type} sx={{ mt: 1 }}>{message.text}</Alert>
                        )}

                        <Button
                            type="submit"
                            variant="contained"
                            color={message.type === 'success' ? 'success' : 'primary'}
                            size="large"
                            fullWidth
                            disabled={loading || !user.username}
                            startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
                            sx={{ mt: 2 }}
                        >
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </form>
                </Paper>
            </Box>
        </Layout>
    );
};

export default AccountPage;