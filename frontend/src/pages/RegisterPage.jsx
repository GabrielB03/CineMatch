import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { TextField, Button, Box, Paper, Typography, Alert } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(null);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (!username || !email || !password) {
            setMessage("Por favor, preencha todos os campos.");
            return;
        }

        try {
            const res = await fetch("https://localhost:5000/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message || "Registro concluído com sucesso!");
                console.log("Registro realizado com sucesso!");

                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setMessage(data.message || "Erro ao registrar. Tente novamente.");
            }
        } catch (err) {
            console.error("Erro no registro:", err);
            setMessage("Erro de conexão. Verifique se o backend está rodando.");
        }
    };

    const isSuccess = message && message.includes('sucesso');

    return (
        <Layout headerTitle="Registro">
            <Box sx={{ maxWidth: 400, margin: '50px auto' }}>
                <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="h5" align="center" gutterBottom>
                        Crie sua conta
                    </Typography>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        <TextField
                            label="Nome de usuário"
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