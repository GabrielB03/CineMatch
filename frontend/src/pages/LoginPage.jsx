import React, { useState } from 'react';
import Layout from '../components/Layout';
import { saveToken } from '../utils/authApi'; 
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    // 1. Estados para os campos do formulário
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);

    const navigate = useNavigate();

    // 2. Função de submissão do formulário
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!email || !password) {
            setErrorMessage("Por favor, preencha todos os campos.");
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                // 3. Lógica de salvar o token usando a função importada
                saveToken(data.access_token);
                console.log("Login realizado com sucesso!");

                // Redirecionar para a página de recomendações usando o React Router
                navigate('/recommendations');
            } else {
                setErrorMessage(data.message || "Erro ao fazer login. Verifique suas credenciais.");
            }
        } catch (err) {
            console.error("Erro no login:", err);
            setErrorMessage("Erro de conexão. Verifique se o backend está rodando.");
        }
    };

    return (
        <Layout headerTitle="Login">
            <form onSubmit={handleSubmit}>
                {/* 4. Ligação dos inputs com os estados usando 'value' e 'onChange' */}
                <label htmlFor="email">E-mail</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <label htmlFor="password">Senha</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {errorMessage && <p style={{ color: 'red', textAlign: 'center' }}>{errorMessage}</p>}

                <button type="submit">Entrar</button>
            </form>
        </Layout>
    );
};

export default LoginPage;