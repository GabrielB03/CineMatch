import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Paper, Typography, Alert } from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'https://localhost:5000/api';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!email || !password) {
            setErrorMessage("Por favor, preencha todos os campos.");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
                credentials: 'include',
            });

            const data = await res.json();

            if (res.ok) {
                console.log("Login realizado com sucesso!");
                navigate('/recommendations');
            } else {
                setErrorMessage(data.message || "Erro ao fazer login. Verifique suas credenciais.");
            }
        } catch (err) {
            console.error("Erro no login:", err);
            setErrorMessage("Erro de conexão ou JSON inválido. Verifique o console do navegador e se o backend está ativo.");
        }
    };

    return (
        <Layout headerTitle="Login">
            <Box sx={{ maxWidth: 400, margin: '50px auto' }}>
                <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="h5" align="center" gutterBottom>
                        Acesse sua conta
                    </Typography>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        <TextField
                            label="E-mail"
                            type="email"
                            variant="outlined"
                            fullWidth
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <TextField
                            label="Senha"
                            type="password"
                            variant="outlined"
                            fullWidth
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        {errorMessage && (
                            <Alert severity="error">{errorMessage}</Alert>
                        )}

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            fullWidth
                            startIcon={<LockOpenIcon />}
                        >
                            Entrar
                        </Button>
                    </form>
                </Paper>
            </Box>
        </Layout>
    );
};

export default LoginPage;