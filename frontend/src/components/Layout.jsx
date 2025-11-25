import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CineMatchLogo from '../assets/cinematch.png';
import { getToken, removeToken } from '../utils/authApi';
import ThemeSwitch from './ThemeSwitch';
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

const Layout = ({ children, headerTitle }) => {
    const isAuthenticated = !!getToken();
    const navigate = useNavigate();

    const handleLogout = () => {
        removeToken();
        navigate('/login');
    };

    const navButtonSx = {
        fontSize: '0.8rem', // Reduz a fonte
        minWidth: 0,
        padding: '6px 8px', // Reduz o padding
    };

    return (
        <div className="app-wrapper">
            <AppBar position="static" color="primary">
                <Toolbar sx={{ color: 'primary.contrastText', minHeight: 60 }}> 
                    <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
                        <Link
                            to="/"
                            style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
                        >
                            <img src={CineMatchLogo} alt="CineMatch Logo" style={{ height: 40, marginRight: 8 }} />
                            <Typography variant="h6" component="div" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                CineMatch
                            </Typography>
                        </Link>
                    </Box>

                    {headerTitle && (
                        <Typography 
                            variant="h6" // Reduz o tamanho do título no header
                            component="h1" 
                            sx={{ 
                                ml: 2, 
                                flexGrow: 1, 
                                textAlign: 'left',
                                display: { xs: 'none', md: 'block' }
                            }}
                        >
                            {headerTitle}
                        </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                        <ThemeSwitch />
                        <nav style={{ marginLeft: 10 }}>
                            {isAuthenticated ? (
                                <>
                                    <Button color="inherit" component={Link} to="/recommendations" sx={navButtonSx}>
                                        Recomendações
                                    </Button>
                                    <Button color="inherit" component={Link} to="/wishlist" startIcon={<FavoriteBorderIcon sx={{ fontSize: '1rem' }} />} sx={navButtonSx}>
                                        Wishlist
                                    </Button>
                                    <Button color="inherit" component={Link} to="/my-ratings" sx={navButtonSx}>
                                        Minhas Notas
                                    </Button>
                                    <Button color="inherit" component={Link} to="/users" sx={navButtonSx}>
                                        Comunidade
                                    </Button>
                                    <Button color="inherit" component={Link} to="/genres" sx={navButtonSx}>
                                        Gêneros
                                    </Button>
                                    <Button color="inherit" component={Link} to="/account" sx={navButtonSx}>
                                        CONTA
                                    </Button>
                                    
                                    <Button 
                                        onClick={handleLogout}
                                        variant="outlined"
                                        color="secondary"
                                        size="small"
                                        startIcon={<ExitToAppIcon sx={{ fontSize: '1rem' }} />}
                                        sx={{ 
                                            ml: 1, 
                                            borderColor: 'primary.contrastText',
                                            fontSize: '0.8rem',
                                            padding: '4px 8px',
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
                                    <Button color="inherit" component={Link} to="/login" sx={navButtonSx}>
                                        Login
                                    </Button>
                                    <Button 
                                        color="inherit" 
                                        variant="outlined" 
                                        component={Link} 
                                        to="/register" 
                                        sx={{ 
                                            ml: 1,
                                            borderColor: 'primary.contrastText',
                                            fontSize: '0.8rem',
                                            padding: '4px 8px',
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