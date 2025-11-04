import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const RegisterPage = () => {
    // 1. Estados para os campos do formulário
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(null); // Para sucesso ou erro

    const navigate = useNavigate();

    // 2. Função de submissão do formulário
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (!username || !email || !password) {
            setMessage("Por favor, preencha todos os campos.");
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                // Registro bem-sucedido: Armazenar token (se o Flask retornar),
                // mas para o registro, é melhorar apenas redirecionar para o Login.
                setMessage(data.message || "Registro concluído com sucesso!");
                console.log("Registro realizado com sucesso!");

                // Redireciona o usuário para a página de Login após 2 segundos
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                // Erro de validação ou e-mail já existe (Resposta do Flask)
                setMessage(data.message || "Erro ao registrar. Tente novamente.");
            }
        } catch (err) {
            console.error("Erro no registro:", err);
            setMessage("Erro de conexão. Verifique se o backend está rodando.");
        }
    };

    return (
        <Layout headerTitle="Registro">
            <form onSubmit={handleSubmit}>
                {/* Campo nome de usuário */}
                <label htmlFor="username">Nome de usuário</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                {/* Campo e-mail */}
                <label htmlFor="email">E-mail</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                {/* Campo senha */}
                <label htmlFor="password">Senha</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {/* Exibe a mensagem de status (sucesso ou erro) */}
                {message && <p style={{ color: message.includes('sucesso') ? 'green' : 'red', textAlign: 'center' }}>{message}</p>}

                <button type="submit">Registrar</button>
            </form>
        </Layout>
    );
};

export default RegisterPage;