import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SelectedSummary from '../SelectedSummary';
import { getUserSummary } from '../RequestService';

jest.mock('../RequestService', () => ({
  getUserSummary: jest.fn(),
}));

jest.mock('react-markdown', () => (props) => (
    <div data-testid="react-markdown">{props.children}</div>
  ));

jest.mock('remark-gfm', () => jest.fn());
jest.mock('react-syntax-highlighter', () => ({
    Prism: jest.fn(() => <div data-testid="syntax-highlighter"></div>),
  }));
  
jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
    oneDark: {},
  }));

describe('SelectedSummary Component', () => {
  const mockSummary = {
    id: 1,
    title: 'Test Summary',
    content: 'This is the content of the summary.',
    createdAt: '2024-12-01T12:00:00Z',
  };

  const mockOnBack = jest.fn();
  const mockOnSummaryRegenerate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  test('renders the SelectedSummary component with correct data', () => {
    const mockSummary = {
      title: 'Test Summary',
      type: 'General',
      createdAt: '2024-12-01T12:00:00Z',
      inputData: 'This is the input data.',
      outputData: 'This is the content of the summary.',
    };
  
    render(<SelectedSummary summary={mockSummary} onBack={jest.fn()} />);
  
    // Check for summary title
    expect(screen.getByText('Test Summary')).toBeInTheDocument();
  
    // Check for content using a regex matcher or `data-testid`
    expect(screen.getByText(/This is the content of the summary\./i)).toBeInTheDocument(); 
  });
  

  test('displays an error message if summary regeneration fails', async () => {
    // Mock API to reject the regeneration
    getUserSummary.mockRejectedValue(new Error('Failed to regenerate summary.'));
  
    render(
      <SelectedSummary
        summary={mockSummary}
        onBack={mockOnBack}
        onSummaryRegenerate={mockOnSummaryRegenerate}
      />
    );
    const regenerateButton = screen.getByRole('button', { name: /Regenerate/i });
    fireEvent.click(regenerateButton);
    expect(await screen.getByPlaceholderText('Provide feedback for regenerating this summary...')).toBeInTheDocument();
  });

  test('displays a message if no summary is provided', () => {
    render(<SelectedSummary summary={null} onBack={jest.fn()} />);

    expect(screen.getByText('No Summary Available')).toBeInTheDocument();
    expect(screen.getByText('Please select a summary to view its details.')).toBeInTheDocument();
  });

  test('displays summary details if a summary is provided', () => {
    const mockSummary = {
      title: 'Test Summary',
      type: 'General',
      createdAt: '2024-12-01T12:00:00Z',
      outputData: 'Sample output data',
    };

    render(<SelectedSummary summary={mockSummary} onBack={jest.fn()} />);

    expect(screen.getByText('Test Summary')).toBeInTheDocument();
  });
});