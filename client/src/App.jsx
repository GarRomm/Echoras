import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import './styles/App.css';

const CreatorPage = lazy(() => import('./pages/CreatorPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const CommentCaMarchePage = lazy(() => import('./pages/CommentCaMarchePage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const MyCreationsPage = lazy(() => import('./pages/MyCreationsPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const GaleriePage = lazy(() => import('./pages/GaleriePage'));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'));
const AdminOrderDetailPage = lazy(() => import('./pages/AdminOrderDetailPage'));
const MentionsLegalesPage = lazy(() => import('./pages/MentionsLegalesPage'));
const ConfidentialitePage = lazy(() => import('./pages/ConfidentialitePage'));

export default function App() {
  const location = useLocation();
  const isCreator = location.pathname === '/createur';

  return (
    <div className="app">
      <Header />
      <main className={`app__main${isCreator ? ' app__main--fixed' : ''}`}>
        <Suspense fallback={null}>
        <Routes>
          {/* Pages publiques */}
          <Route path="/" element={<HomePage />} />
          <Route path="/createur" element={<CreatorPage />} />
          <Route path="/galerie" element={<GaleriePage />} />
          <Route path="/comment-ca-marche" element={<CommentCaMarchePage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
          <Route path="/confidentialite" element={<ConfidentialitePage />} />

          {/* Auth */}
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterPage />} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ForgotPasswordPage />} />

          {/* Pages protégées (Phase 3+) */}
          <Route path="/profil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/mes-creations" element={<ProtectedRoute><MyCreationsPage /></ProtectedRoute>} />
          <Route path="/mes-commandes" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
          <Route path="/panier" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/confirmation" element={<ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>} />

          {/* Admin (Phase 5) */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminPage /></ProtectedRoute>} />
          <Route path="/admin/commandes/:id" element={<ProtectedRoute requiredRole="ADMIN"><AdminOrderDetailPage /></ProtectedRoute>} />

          <Route path="*" element={<PlaceholderPage title="Page introuvable" />} />
        </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
