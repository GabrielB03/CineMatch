import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CineMatchLogo from '../assets/cinematch.png';
import { getToken, removeToken } from '../utils/authApi';
import ThemeSwitch from './ThemeSwitch';

// Componente que renderiza o cabeçalho e rodapé em todas as páginas
const Layout = ({ children, headerTitle }) => {
    
    // 1. Verifica o estado de autenticação a partir do token
    const isAuthenticated = !!getToken();
    const navigate = useNavigate();

    // 2. Função de Logout
    const handleLogout = () => {
        removeToken(); // Remove o token
        navigate('/login'); // Redireciona para o login
    };

    return (
        <div className="app-wrapper">
            <header>
                <div className="header-container">
                    <div className="logo">
                        <Link to="/">
                            <img src={CineMatchLogo} alt="CineMatch Logo" />
                        </Link>
                    </div>

                    {headerTitle ? <h1>{headerTitle}</h1> : null}
                    
                    <div className="header-actions">
                        <ThemeSwitch />
                        
                        <nav>
                            {isAuthenticated ? (
                                // Links para usuário LOGADO
                                <>
                                    <Link to="/recommendations" style={{marginRight: '15px'}}>Recomendações</Link>
                                    <Link to="/genres" style={{marginRight: '15px'}}>Gêneros</Link>
                                    
                                    <button 
                                        onClick={handleLogout}
                                        style={{
                                            background: 'none',
                                            border: '1px solid #fff',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            padding: '5px 10px',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        Sair
                                    </button>
                                </>
                            ) : (
                                // Links para usuário NÃO LOGADO
                                <>
                                    <Link to="/login" style={{marginRight: '10px'}}>Login</Link>
                                    <Link to="/register">Registrar</Link>
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            </header>

            <main>
                {children}
            </main>

            <footer>
                <p>&copy; 2025 CineMatch. Todos os direitos reservados.</p>
            </footer>
        </div>
    )
}

export default Layout;