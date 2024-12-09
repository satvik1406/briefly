import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { useAuth } from '../App';
import { verifyUser, createUser, getUserSummaries } from '../RequestService';
import AuthForms from '../AuthForms';
import Dashboard from '../Dashboard';

jest.mock('../RequestService', () => ({
  verifyUser: jest.fn(),
  createUser: jest.fn(),
  getUserSummaries: jest.fn(),
}));

jest.mock('../AuthForms', () => jest.fn(() => <div>Auth Forms</div>));
jest.mock('../Dashboard', () => jest.fn(() => <div>Dashboard</div>));

jest.mock('../App', () => {
  const originalModule = jest.requireActual('../App');
  return {
    ...originalModule,
    useAuth: jest.fn(),
  };
});

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUseAuth = (isAuthenticated = false, loading = false, userData = null) => {
    useAuth.mockReturnValue({
      isAuthenticated,
      loading,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      userData,
      summaries: [],
      error: null,
    });
  };

  test('renders login page when unauthenticated', async () => {
    mockUseAuth(false, false); // User not authenticated and not loading

    render(<App />);

    expect(await screen.findByText('Auth Forms')).toBeInTheDocument();
  });

  test('renders dashboard when authenticated', async () => {
    mockUseAuth(true, false, { id: 'user-id', email: 'test@example.com' }); // User authenticated

    render(<App />);

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });

  test('shows loading spinner while verifying token', async () => {
    mockUseAuth(false, true); // Simulate token verification in progress

    render(<App />);

    expect(await screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('redirects to login page when token verification fails', async () => {
    mockUseAuth(false, false); // User not authenticated

    render(<App />);

    expect(await screen.findByText('Auth Forms')).toBeInTheDocument();
  });

  test('redirects to dashboard from root path when authenticated', async () => {
    mockUseAuth(true, false); // User authenticated

    render(<App />);

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });

  test('handles token expiration correctly', async () => {
    mockUseAuth(false, false); // Simulate expired token

    render(<App />);

    expect(await screen.findByText('Auth Forms')).toBeInTheDocument();
  });

  test('calls login function when logging in', async () => {
    const mockLogin = jest.fn();
    useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      login: mockLogin,
      logout: jest.fn(),
      register: jest.fn(),
      userData: null,
      summaries: [],
      error: null,
    });

    render(<App />);

    fireEvent.click(screen.getByText('Auth Forms'));
    expect(mockLogin).toHaveBeenCalled();
  });

  test('renders dashboard after successful login', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ success: true });
    useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      login: mockLogin,
      logout: jest.fn(),
      register: jest.fn(),
      userData: null,
      summaries: [],
      error: null,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Auth Forms')).toBeInTheDocument();
    });

    mockUseAuth(true, false, { id: 'user-id', email: 'test@example.com' });
    render(<App />);
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });

  test('handles registration process', async () => {
    const mockRegister = jest.fn().mockResolvedValue({ success: true });
    useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: mockRegister,
      userData: null,
      summaries: [],
      error: null,
    });

    render(<App />);

    fireEvent.click(screen.getByText('Auth Forms'));
    expect(mockRegister).toHaveBeenCalled();
  });

  test('fetches user summaries when authenticated', async () => {
    mockUseAuth(true, false, { id: 'user-id', email: 'test@example.com' });

    getUserSummaries.mockResolvedValue({
      status: 'OK',
      result: [
        { id: 1, title: 'Summary 1', content: 'Content 1', createdAt: '2024-12-01T12:00:00Z', type: 'code' },
      ],
    });

    render(<App />);

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });
});
