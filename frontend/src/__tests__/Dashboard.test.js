import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { useAuth } from '../App';
import { getUserSummaries } from '../RequestService';
import Dashboard from '../Dashboard';

// Mock dependencies
jest.mock('../App', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../RequestService', () => ({
  getUserSummaries: jest.fn(),
}));

jest.mock('../SummariesList', () => (props) => (
  <div data-testid="summaries-list">
    Mock Summaries List {props.selectedSummary ? `Selected: ${props.selectedSummary.title}` : ''}
  </div>
));

jest.mock('../NewSummary', () => (props) => (
  <div data-testid="new-summary-dialog" data-open={props.open}>
    Mock New Summary Dialog
  </div>
));

describe('Dashboard Component', () => {
  const mockUser = { id: '123', email: 'test@example.com' };
  const mockSummaries = [
    { id: 1, title: 'Summary 1', content: 'Content 1', createdAt: '2024-12-01' },
    { id: 2, title: 'Summary 2', content: 'Content 2', createdAt: '2024-12-02' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      userData: mockUser,
      loading: false,
    });
  });

  test('renders the Dashboard with Navbar, SummariesList, and NewSummaryDialog', async () => {
    getUserSummaries.mockResolvedValueOnce({
      status: 'OK',
      result: mockSummaries,
    });

    render(
      <Router>
        <Dashboard />
      </Router>
    );

    // Check for Navbar with "Briefly"

    expect(await screen.findByText(/briefly/i)).toBeInTheDocument();
    
    screen.debug();
    // Ensure SummariesList is rendered after data is fetched
    expect(await screen.findByTestId('summaries-list')).toBeInTheDocument();

    // Ensure NewSummaryDialog is rendered (initially closed)
    expect(screen.getByTestId('new-summary-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('new-summary-dialog')).toHaveAttribute('data-open', 'false');
  });

  test('displays a loading spinner while fetching data', () => {
    useAuth.mockReturnValueOnce({ userData: mockUser, loading: true });

    render(
      <Router>
        <Dashboard />
      </Router>
    );

    // Check for the loading spinner
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('handles API failure gracefully', async () => {
    getUserSummaries.mockRejectedValueOnce(new Error('Failed to fetch summaries'));

    render(
      <Router>
        <Dashboard />
      </Router>
    );

    // Ensure spinner appears initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for the loading state to clear
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

    // Verify SummariesList renders with no data
    expect(screen.getByTestId('summaries-list')).toHaveTextContent('Mock Summaries List');
  });

//   test('opens and closes the NewSummaryDialog', async () => {
//     // Mock the API response for summaries
//     getUserSummaries.mockResolvedValueOnce({
//       status: 'OK',
//       result: [
//         { id: 1, title: 'Summary 1', content: 'Content 1' },
//         { id: 2, title: 'Summary 2', content: 'Content 2' },
//       ],
//     });
  
//     render(
//       <Router>
//         <Dashboard />
//       </Router>
//     );
  
//     // Wait for the summaries to load and the button to appear
//     await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
  
//     const allButtons = screen.getAllByRole('button');
//     console.log(allButtons.map(button => button.textContent));
//     // Find and click the button to open the dialog
//     const openDialogButton = screen.getByRole('button', { name: /new summary/i });
//     fireEvent.click(openDialogButton);
  
//     // Ensure the dialog is open
//     expect(screen.getByTestId('new-summary-dialog')).toHaveAttribute('data-open', 'true');
  
//     // Close the dialog
//     fireEvent.click(screen.getByText(/cancel/i)); // Assuming "Cancel" button exists in NewSummaryDialog
//     expect(screen.getByTestId('new-summary-dialog')).toHaveAttribute('data-open', 'false');
//   });
  
  
  

  test('renders the selected summary when updated', async () => {
    getUserSummaries.mockResolvedValueOnce({
      status: 'OK',
      result: mockSummaries,
    });

    render(
      <Router>
        <Dashboard />
      </Router>
    );

    // Ensure SummariesList displays selected summary
    const summaryElement = await screen.findByTestId('summaries-list');
    expect(summaryElement).toHaveTextContent('Mock Summaries List');
  });

  test('handles empty summaries list gracefully', async () => {
    getUserSummaries.mockResolvedValueOnce({
      status: 'OK',
      result: [],
    });

    render(
      <Router>
        <Dashboard />
      </Router>
    );

    // Ensure SummariesList renders with no data
    expect(await screen.findByTestId('summaries-list')).toHaveTextContent('Mock Summaries List');
  });


    
    test('handles user logout correctly', () => {
        const mockLogout = jest.fn();
        useAuth.mockReturnValueOnce({
            userData: mockUser,
            loading: false,
            logout: mockLogout,
          });
        
      
        render(
          <Router>
            <Dashboard />
          </Router>
        );
      
        const logoutButton = screen.getByLabelText('Logout'); // Use aria-label
        console.log(logoutButton); // Ensure button is selected
      
        fireEvent.click(logoutButton); // Simulate click
        console.log(mockLogout.mock.calls); // Log calls to mockLogout
      
        // Assert that the logout function was called exactly once
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });
      
  
});
  
