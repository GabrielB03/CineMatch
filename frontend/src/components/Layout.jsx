import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CineMatchLogo from '../assets/cinematch.png';
import { getToken, removeToken } from '../utils/authApi';
import ThemeSwitch from './ThemeSwitch';
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const Layout = ({ children, headerTitle }) => {
    const isAuthenticated = !!getToken();
    const navigate = useNavigate();

    const handleLogout = () => {
        removeToken();
        navigate('/login');
    };

    return (
        <div className="app-wrapper">
            <AppBar position="static" color="primary">
                <Toolbar sx={{ color: 'primary.contrastText' }}> 
                    <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
                        <Link 
                            to="/"
                            style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
                        >
                            <img src={CineMatchLogo} alt="CineMatch Logo" style={{ height: 40, marginRight: 8 }} />
                            <Typography variant="h6" component="div">
                                CineMatch
                            </Typography>
                        </Link>
                    </Box>

                    {headerTitle && (
                        <Typography 
                            variant="h5" 
                            component="h1" 
                            sx={{ 
                                ml: 4, 
                                flexGrow: 1, 
                                textAlign: 'left' 
                            }}
                        >
                            {headerTitle}
                        </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <ThemeSwitch />
                        <nav style={{ marginLeft: 20 }}>
                            {isAuthenticated ? (
                                <>
                                    <Button color="inherit" component={Link} to="/recommendations">
                                        Recomendações
                                    </Button>
                                    <Button color="inherit" component={Link} to="/my-ratings">
                                        Minhas Notas
                                    </Button>
                                    <Button color="inherit" component={Link} to="/users">
                                        Comunidade
                                    </Button>
                                    <Button color="inherit" component={Link} to="/genres">
                                        Gêneros
                                    </Button>
                                    <Button color="inherit" component={Link} to="/account">
                                        CONTA
                                    </Button>
                                    
                                    <Button 
                                        onClick={handleLogout}
                                        variant="outlined"
                                        color="secondary"
                                        size="small"
                                        startIcon={<ExitToAppIcon />}
                                        sx={{ 
                                            ml: 2, 
                                            borderColor: 'primary.contrastText',
                                            '&:hover': {
                                                borderColor: 'secondary.main',
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            }
                                        }}
                                    >
                                        Sair
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button color="inherit" component={Link} to="/login">
                                        Login
                                    </Button>
                                    <Button 
                                        color="inherit" 
                                        variant="outlined" 
                                        component={Link} 
                                        to="/register" 
                                        sx={{ 
                                            ml: 1,
                                            borderColor: 'primary.contrastText' 
                                        }}
                                    >
                                        Registrar
                                    </Button>
                                </>
                            )}
                        </nav>
                    </Box>
                </Toolbar>
            </AppBar>

            <main style={{ padding: '20px' }}>
                {children}
            </main>

            <footer>
                <p>&copy; 2025 CineMatch. Todos os direitos reservados.</p>
            </footer>
        </div>
    )
}

export default Layout;