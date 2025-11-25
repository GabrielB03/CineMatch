import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button, Box, Typography } from '@mui/material';

const HomePage = () => {
    return (
        <Layout headerTitle="CineMatch">
            <Box 
                sx={{ 
                    textAlign: 'center', 
                    padding: 5, 
                    mt: 5
                }}
            >
                <Typography variant="h2" component="h2" gutterBottom>
                    Bem vindo ao CineMatch!
                </Typography>
                
                <Typography variant="h6" sx={{ mt: 3, mb: 5 }}>
                    Receba recomendações de filmes com base nas suas preferências e descubra onde assisti-los.
                </Typography>
                
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: 3 
                }}>
                    
                    <Button 
                        variant="contained" 
                        color="primary" 
                        size="large" 
                        component={Link} 
                        to="/login"
                    >
                        Entrar
                    </Button>
                    
                    <Button 
                        variant="outlined" 
                        color="secondary" 
                        size="large" 
                        component={Link} 
                        to="/genres"
                    >
                        Explorar Gêneros
                    </Button>
                    
                    <Button 
                        variant="text" 
                        color="inherit" 
                        size="large" 
                        component={Link} 
                        to="/register"
                    >
                        Registrar
                    </Button>
                </Box>
            </Box>
        </Layout>
    );
};

export default HomePage;