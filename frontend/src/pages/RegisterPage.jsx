import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { TextField, Button, Box, Paper, Typography, Alert } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'https://cinematch-api-mhxk.onrender.com';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setIsSuccess(false);

        if (!username || !email || !password) {
            setMessage("Por favor, preencha todos os campos.");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message || "Registro concluído com sucesso!");
                setIsSuccess(true);
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setMessage(data.message || "Erro ao registrar. Verifique os dados e tente novamente.");
                setIsSuccess(false);
            }
        } catch (error) {
            console.error("Erro na comunicação com a API:", error);
            setMessage("Falha na conexão com o servidor. Tente novamente.");
            setIsSuccess(false);
        }
    };

    return (
        <Layout headerTitle="Registrar">
            <Box sx={{ maxWidth: 400, margin: '50px auto' }}>
                <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <PersonAddIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                        Criar Nova Conta
                    </Typography>
                    
                    <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <TextField
                            label="Nome de Usuário"
                            type="text"
                            variant="outlined"
                            fullWidth
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        
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

                        {message && (
                            <Alert severity={isSuccess ? "success" : "error"}>{message}</Alert>
                        )}

                        <Button
                            type="submit"
                            variant="contained"
                            color="success"
                            size="large"
                            fullWidth
                            startIcon={<PersonAddIcon />}
                        >
                            Registrar
                        </Button>
                    </form>
                </Paper>
            </Box>
        </Layout>
    );
};

export default RegisterPage;