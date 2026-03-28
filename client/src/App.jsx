import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CreatorPage from './pages/CreatorPage';
import PlaceholderPage from './pages/PlaceholderPage';
import './styles/App.css';

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="app__main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/createur" element={<CreatorPage />} />
          <Route path="/galerie" element={<PlaceholderPage title="Galerie" />} />
          <Route path="/comment-ca-marche" element={<PlaceholderPage title="Comment ça marche" />} />
          <Route path="/faq" element={<PlaceholderPage title="FAQ & Contact" />} />
          <Route path="/mentions-legales" element={<PlaceholderPage title="Mentions légales" />} />
          <Route path="/confidentialite" element={<PlaceholderPage title="Politique de confidentialité" />} />
          <Route path="*" element={<PlaceholderPage title="Page introuvable" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
