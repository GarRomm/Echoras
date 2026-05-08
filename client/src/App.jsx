import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import CreatorPage from './pages/CreatorPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PlaceholderPage from './pages/PlaceholderPage';
import CommentCaMarchePage from './pages/CommentCaMarchePage';
import CartPage from './pages/CartPage';
import MyCreationsPage from './pages/MyCreationsPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import './styles/App.css';

export default function App() {
  const location = useLocation();
  const isCreator = location.pathname === '/createur';

  return (
    <div className="app">
      <Header />
      <main className={`app__main${isCreator ? ' app__main--fixed' : ''}`}>
        <Routes>
          {/* Pages publiques */}
          <Route path="/" element={<HomePage />} />
          <Route path="/createur" element={<CreatorPage />} />
          <Route path="/galerie" element={<PlaceholderPage title="Galerie" />} />
          <Route path="/comment-ca-marche" element={<CommentCaMarchePage />} />
          <Route path="/faq" element={<PlaceholderPage title="FAQ" />} />
          <Route path="/contact" element={<PlaceholderPage title="Contact" />} />
          <Route path="/mentions-legales" element={<PlaceholderPage title="Mentions légales" />} />
          <Route path="/confidentialite" element={<PlaceholderPage title="Politique de confidentialité" />} />

          {/* Auth */}
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterPage />} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ForgotPasswordPage />} />

          {/* Pages protégées (Phase 3+) */}
          <Route path="/profil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/mes-creations" element={<ProtectedRoute><MyCreationsPage /></ProtectedRoute>} />
          <Route path="/mes-commandes" element={<ProtectedRoute><PlaceholderPage title="Mes commandes" /></ProtectedRoute>} />
          <Route path="/panier" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/confirmation" element={<ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>} />

          {/* Admin (Phase 5) */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminPage /></ProtectedRoute>} />

          <Route path="*" element={<PlaceholderPage title="Page introuvable" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
