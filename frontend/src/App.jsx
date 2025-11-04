import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'; 

// Importa todos os componentes de Página
import HomePage from './pages/HomePage'; 
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GenreSelectionPage from './pages/GenreSelectionPage';
import RecommendationPage from './pages/RecommendationPage';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Rotas Principais */}
          <Route path="/" element={<HomePage />} /> 
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/genres" element={<GenreSelectionPage />} />
          
          {/* Rota de Recomendações */}
          <Route path="/recommendations" element={<RecommendationPage />} />
          
          {/* Rota 404 de fallback */}
          <Route path="*" element={<HomePage />} /> 
        </Routes>
      </div>
    </Router>
  );
}

export default App;