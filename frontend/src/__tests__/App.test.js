// App.test.js

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { verifyUser, createUser, getUserSummaries } from '../RequestService';
import jwtDecode from 'jwt-decode';
import { MemoryRouter } from 'react-router-dom';

// Mock external services
jest.mock('../RequestService', () => ({
  verifyUser: jest.fn(),
  createUser: jest.fn(),
  getUserSummaries: jest.fn(),
}));

jest.mock('jwt-decode', () => jest.fn());

// Mock child components with simple divs and data-testid attributes
jest.mock('../AuthForms', () => () => <div data-testid="auth-forms">Auth Forms</div>);
jest.mock('../Dashboard', () => () => <div data-testid="dashboard">Dashboard</div>);

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // Helper function to render the App without wrapping it in another Router
  const renderApp = () => {
    return render(<App />);
  };

  test('renders AuthForms when unauthenticated', async () => {
    renderApp();

    // Expect AuthForms to be in the document
    expect(await screen.findByTestId('auth-forms')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });

  test('renders Dashboard when authenticated', async () => {
    // Set up mock token and user data in localStorage
    const mockToken = 'mockAuthToken';
    const mockUserData = { id: '123', email: 'test@example.com' };

    localStorage.setItem('auth_token', mockToken);
    localStorage.setItem('user_data', JSON.stringify(mockUserData));

    // Mock jwtDecode to return a valid token
    jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 3600 }); // Token expires in 1 hour

    // Mock getUserSummaries to return sample summaries
    getUserSummaries.mockResolvedValueOnce({
      status: 'OK',
      result: [{ id: '1', title: 'Summary 1', content: 'Content 1' }],
    });

    renderApp();

    // Wait for summaries to be fetched
    await waitFor(() => {
      expect(getUserSummaries).toHaveBeenCalledWith('123');
    });

    // Expect Dashboard to be in the document
    expect(await screen.findByTestId('dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-forms')).not.toBeInTheDocument();
  });

  test('redirects unauthenticated user to login from dashboard route', async () => {
    // Navigate to /dashboard by setting the initial entries in MemoryRouter
    // Since App already includes BrowserRouter, we need to mock the initial route differently
    // Alternatively, manipulate window.history

    window.history.pushState({}, 'Dashboard', '/dashboard');

    renderApp();

    // Expect AuthForms to be rendered instead of Dashboard
    expect(await screen.findByTestId('auth-forms')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });

  test('redirects from root to /dashboard when authenticated', async () => {
    // Set up mock token and user data in localStorage
    const mockToken = 'mockAuthToken';
    const mockUserData = { id: '123', email: 'test@example.com' };

    localStorage.setItem('auth_token', mockToken);
    localStorage.setItem('user_data', JSON.stringify(mockUserData));

    // Mock jwtDecode to return a valid token
    jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 3600 }); // Token expires in 1 hour

    // Mock getUserSummaries to return empty summaries
    getUserSummaries.mockResolvedValueOnce({
      status: 'OK',
      result: [],
    });

    renderApp();

    // Expect Dashboard to be in the document
    expect(await screen.findByTestId('dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-forms')).not.toBeInTheDocument();
  });

  test('shows loading spinner during token verification', async () => {
    // Set up mock token and user data in localStorage
    const mockToken = 'mockAuthToken';
    const mockUserData = { id: '123', email: 'test@example.com' };

    localStorage.setItem('auth_token', mockToken);
    localStorage.setItem('user_data', JSON.stringify(mockUserData));

    // Mock jwtDecode to return a valid token
    jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 3600 }); // Token expires in 1 hour

    // Mock getUserSummaries with a delayed response
    getUserSummaries.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ status: 'OK', result: [] }), 100)
        )
    );

    renderApp();

    // Expect the loading spinner to be in the document
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for the loading spinner to disappear
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Finally, expect Dashboard to be rendered
    expect(await screen.findByTestId('dashboard')).toBeInTheDocument();
  });

  test('verifies token on load and fetches user summaries', async () => {
    // Set up mock token and user data in localStorage
    const mockToken = 'mockAuthToken';
    const mockUserData = { id: '123', email: 'test@example.com' };
    const mockSummaries = [
      { id: '1', title: 'Summary 1', content: 'Content 1' },
    ];

    localStorage.setItem('auth_token', mockToken);
    localStorage.setItem('user_data', JSON.stringify(mockUserData));

    // Mock jwtDecode to return a valid token
    jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 3600 }); // Token expires in 1 hour

    // Mock getUserSummaries to return mock summaries
    getUserSummaries.mockResolvedValueOnce({
      status: 'OK',
      result: mockSummaries,
    });

    renderApp();

    // Wait for getUserSummaries to be called with the correct user ID
    await waitFor(() => {
      expect(getUserSummaries).toHaveBeenCalledWith('123');
    });

    // Expect Dashboard to be in the document
    expect(await screen.findByTestId('dashboard')).toBeInTheDocument();
  });

  test('logs out user if token is expired', async () => {
    // Set up expired token and user data in localStorage
    const mockToken = 'expiredToken';
    const mockUserData = { id: '123', email: 'test@example.com' };

    localStorage.setItem('auth_token', mockToken);
    localStorage.setItem('user_data', JSON.stringify(mockUserData));

    // Mock jwtDecode to return an expired token
    jwtDecode.mockReturnValue({ exp: Date.now() / 1000 - 3600 }); // Token expired 1 hour ago

    renderApp();

    // Wait for AuthForms to be rendered due to token expiration
    await waitFor(() => {
      expect(screen.findByTestId('auth-forms')).resolves.toBeInTheDocument();
    });

    // Expect localStorage to be cleared
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('user_data')).toBeNull();
  });

  test('redirects to dashboard after successful login', async () => {
    // Mock verifyUser to return a successful authentication
    verifyUser.mockResolvedValueOnce({
      result: {
        auth_token: 'newAuthToken',
        user: { id: '123', email: 'test@example.com' },
      },
    });

    renderApp();

    // Initially, AuthForms should be rendered
    expect(await screen.findByTestId('auth-forms')).toBeInTheDocument();

    // Simulate successful login by setting localStorage and re-rendering
    // Note: Since AuthForms is mocked and doesn't handle actual user input, we'll manually set localStorage
    // and re-render to simulate the state after login
    localStorage.setItem('auth_token', 'newAuthToken');
    localStorage.setItem('user_data', JSON.stringify({ id: '123', email: 'test@example.com' }));
    jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 3600 }); // Valid token
    getUserSummaries.mockResolvedValueOnce({ status: 'OK', result: [] });

    // Re-render the App to reflect the updated localStorage
    renderApp();

    // Wait for Dashboard to be rendered
    expect(await screen.findByTestId('dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-forms')).not.toBeInTheDocument();
  });
});
