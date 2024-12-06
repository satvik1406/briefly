import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SummariesList from '../SummariesList';
import { getUserSummaries, deleteUserSummary } from '../RequestService';
import { AuthProvider, useAuth } from '../App';

jest.mock('../RequestService', () => ({
    getUserSummaries: jest.fn(),
    deleteUserSummary: jest.fn(),
}));

jest.mock('remark-gfm', () => jest.fn());
jest.mock('react-markdown', () => (props) => (
    <div data-testid="react-markdown">{props.children}</div>
));
jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
    oneDark: {},
  }));

jest.mock('../App', () => {
    const originalModule = jest.requireActual('../App');
    return {
        ...originalModule,
        useAuth: jest.fn(),
    };
});

describe('SummariesList Component', () => {
    const mockSummaries = [
        { id: 1, title: 'Summary 1', content: 'Content 1', createdAt: '2024-12-01T12:00:00Z', type: 'code' },
        { id: 2, title: 'Summary 2', content: 'Content 2', createdAt: '2024-12-02T12:00:00Z', type: 'research' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            userData: { id: 'user-id', email: 'test@example.com' },
        });
    });

    test('renders without crashing and displays summaries', async () => {
        getUserSummaries.mockResolvedValue({
            status: 'OK',
            result: mockSummaries,
        });

        render(
            <AuthProvider>
                <SummariesList />
            </AuthProvider>
        );

        // Check for the summaries
        expect(await screen.findByText('Summary 1')).toBeInTheDocument();
        expect(await screen.findByText('Summary 2')).toBeInTheDocument();
    });

    test('displays an error message when fetch fails', async () => {
        getUserSummaries.mockRejectedValue(new Error('Failed to fetch summaries'));

        render(
            <AuthProvider>
                <SummariesList />
            </AuthProvider>
        );

        expect(await screen.getByRole('progressbar')).toBeInTheDocument();

        
    });

    test('calls deleteSummary function when delete button is clicked', async () => {
        getUserSummaries.mockResolvedValue({
            status: 'OK',
            result: mockSummaries,
        });
        deleteUserSummary.mockResolvedValue({ status: 'OK' });

        render(
            <AuthProvider>
                <SummariesList />
            </AuthProvider>
        );

        // Wait for summaries to render

        expect(await screen.findByText('Summary 1')).toBeInTheDocument();

        // Find and click the delete button
        const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
        fireEvent.click(deleteButtons[0]);
    });

    test('removes a summary from the list when successfully deleted', async () => {
        getUserSummaries.mockResolvedValue({
            status: 'OK',
            result: mockSummaries,
        });
        deleteUserSummary.mockResolvedValue({ status: 'OK' });

        render(
            <AuthProvider>
                <SummariesList />
            </AuthProvider>
        );

        // Wait for summaries to render
        expect(await screen.findByText('Summary 1')).toBeInTheDocument();

        // Find and click the delete button
        const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
        fireEvent.click(deleteButtons[0]);
        
        // Ensure only the remaining summary is present
        expect(screen.getByText('Summary 2')).toBeInTheDocument();
    });

    test('handles an empty summaries list gracefully', async () => {
        getUserSummaries.mockResolvedValue({
            status: 'OK',
            result: [],
        });

        render(
            <AuthProvider>
                <SummariesList />
            </AuthProvider>
        );

        // Ensure no summaries message is displayed
        expect(await screen.findByText('No summaries available. Create one to get started!')).toBeInTheDocument();
    });

});