import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';

const mockUseAuth = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderProtected({ user = null, loading = false, requiredRole = undefined } = {}) {
  mockUseAuth.mockReturnValue({ user, loading });
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute requiredRole={requiredRole}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/connexion" element={<div>Login Page</div>} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('renders nothing while auth is loading', () => {
    const { container } = renderProtected({ loading: true });
    expect(container.firstChild).toBeNull();
  });

  it('redirects to /connexion when the user is not authenticated', () => {
    renderProtected({ user: null });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children when the user is authenticated and no role is required', () => {
    renderProtected({ user: { id: 1, role: 'USER' } });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children when the user role matches requiredRole', () => {
    renderProtected({ user: { id: 1, role: 'ADMIN' }, requiredRole: 'ADMIN' });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to / when authenticated user role does not match requiredRole', () => {
    renderProtected({ user: { id: 1, role: 'USER' }, requiredRole: 'ADMIN' });
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('does not show protected content when role is wrong', () => {
    renderProtected({ user: { id: 1, role: 'USER' }, requiredRole: 'ADMIN' });
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('does not show login page when user is authenticated', () => {
    renderProtected({ user: { id: 1, role: 'USER' } });
    expect(screen.queryByText('Login Page')).toBeNull();
  });
});
