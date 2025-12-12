import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Paper, Typography, Alert } from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'https://cinematch-api-mhxk.onrender.com';

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
                setErrorMessage(data.message || "Erro ao realizar login. Verifique suas credenciais.");
            }
        } catch (error) {
            console.error("Erro na comunicação com a API:", error);
            setErrorMessage("Falha na conexão com o servidor. Tente novamente.");
        }
    };

    return (
        <Layout headerTitle="Login">
            <Box sx={{ maxWidth: 400, margin: '50px auto' }}>
                <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <LockOpenIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                        Acessar Conta
                    </Typography>
                    
                    <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>

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