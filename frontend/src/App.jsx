import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'; 
import HomePage from './pages/HomePage'; 
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GenreSelectionPage from './pages/GenreSelectionPage';
import RecommendationPage from './pages/RecommendationPage';
import AccountPage from './pages/AccountPage'; 
import MyRatingsPage from './pages/MyRatingsPage';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<HomePage />} /> 
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/genres" element={<GenreSelectionPage />} />
          
          <Route path="/recommendations" element={<RecommendationPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/my-ratings" element={<MyRatingsPage />} />
          
          <Route path="*" element={<HomePage />} /> 
        </Routes>
      </div>
    </Router>
  );
}

export default App;