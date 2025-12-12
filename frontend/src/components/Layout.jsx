import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CineMatchLogo from '../assets/cinematch.png';
import { getToken, removeToken } from '../utils/authApi';
import ThemeSwitch from './ThemeSwitch';
import { AppBar, Toolbar, Button, Typography, Box, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import MenuIcon from '@mui/icons-material/Menu';

const Layout = ({ children, headerTitle }) => {
    const isAuthenticated = !!getToken();
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleLogout = () => {
        removeToken();
        navigate('/login');
    };

    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setDrawerOpen(open);
    };

    const navButtonSx = {
        fontSize: '0.8rem',
        minWidth: 0,
        padding: '6px 8px',
    };

    const navItems = [
        { label: 'Recomendações', path: '/recommendations', isAuthenticated: true },
        { label: 'Wishlist', path: '/wishlist', isAuthenticated: true, icon: FavoriteBorderIcon },
        { label: 'Minhas Notas', path: '/my-ratings', isAuthenticated: true },
        { label: 'Comunidade', path: '/users', isAuthenticated: true },
        { label: 'Gêneros', path: '/genres', isAuthenticated: true },
        { label: 'CONTA', path: '/account', isAuthenticated: true },
    ];

    const unauthenticatedNavItems = [
        { label: 'Login', path: '/login', isAuthenticated: false },
        { label: 'Registrar', path: '/register', isAuthenticated: false },
    ];

    const drawerList = (
        <Box
            sx={{ width: 250 }}
            role="presentation"
            onClick={toggleDrawer(false)}
            onKeyDown={toggleDrawer(false)}
        >
            <List>
                {(isAuthenticated ? navItems : unauthenticatedNavItems).map((item) => (
                    <ListItem key={item.label} disablePadding>
                        <ListItemButton component={Link} to={item.path}>
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
                {isAuthenticated && (
                    <ListItem disablePadding>
                        <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
                            <ListItemText primary="Sair" />
                        </ListItemButton>
                    </ListItem>
                )}
            </List>
        </Box>
    );

    return (
        <div className="app-wrapper">
            <AppBar position="static" color="primary">
                <Toolbar sx={{ color: 'primary.contrastText', minHeight: 60, paddingRight: { xs: 1, sm: 2 } }}> 
                    
                    {isAuthenticated && (
                        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
                            <IconButton
                                color="inherit"
                                aria-label="open drawer"
                                edge="start"
                                onClick={toggleDrawer(true)}
                                sx={{ mr: 1 }}
                            >
                                <MenuIcon />
                            </IconButton>
                        </Box>
                    )}

                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
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
                            variant="h6"
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
                        
                        {isAuthenticated && (
                            <Button 
                                onClick={handleLogout}
                                variant="outlined"
                                color="secondary"
                                size="small"
                                sx={{ 
                                    ml: 1, 
                                    borderColor: 'primary.contrastText',
                                    fontSize: '0.8rem',
                                    padding: '4px 8px',
                                    display: { xs: 'block', md: 'none' } 
                                }}
                            >
                                Sair
                            </Button>
                        )}

                        <nav style={{ marginLeft: 10 }}>
                            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}> 
                                {isAuthenticated ? (
                                    <>
                                        {navItems.map(item => (
                                            <Button
                                                key={item.path}
                                                color="inherit"
                                                component={Link}
                                                to={item.path}
                                                sx={navButtonSx}
                                                startIcon={item.icon ? <item.icon sx={{ fontSize: '1rem' }} /> : null}
                                            >
                                                {item.label}
                                            </Button>
                                        ))}
                                        
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
                                                display: { xs: 'none', md: 'block' },
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
                                        {unauthenticatedNavItems.map(item => (
                                            <Button
                                                key={item.path}
                                                color="inherit"
                                                component={Link}
                                                to={item.path}
                                                sx={navButtonSx}
                                                variant={item.label === 'Registrar' ? 'outlined' : 'text'}
                                            >
                                                {item.label}
                                            </Button>
                                        ))}
                                    </>
                                )}
                            </Box>
                        </nav>
                    </Box>
                </Toolbar>
            </AppBar>
            
            {isAuthenticated && (
                <Drawer
                    anchor="left"
                    open={drawerOpen}
                    onClose={toggleDrawer(false)}
                >
                    {drawerList}
                </Drawer>
            )}
            
            <main style={{ padding: '20px' }}>
                {children}
            </main>

            <footer>
                <p>&copy; 2025 CineMatch. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
};

export default Layout;