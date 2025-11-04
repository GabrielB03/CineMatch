import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const HomePage = () => {
    return (
        <Layout headerTitle="CineMatch">
            <main style={{ textAlign: 'center', padding: '50px' }}>
                <h2>Bem vindo ao CineMatch!</h2>
                <p style={{ marginTop: '20px', fontSize: '1.1rem' }}>
                    Receba recomendações de filmes com base nas suas preferências e descubra onde assisti-los.
                </p>
                <div style={{ marginTop: '30px' }}>
                    <Link to="/login" style={{ marginRight: '15px' }}>
                        <button>Entrar</button>
                    </Link>
                    <Link to="/genres">
                        <button>Explorar Gêneros</button>
                    </Link>
                </div>
            </main>
        </Layout>
    );
};

export default HomePage;