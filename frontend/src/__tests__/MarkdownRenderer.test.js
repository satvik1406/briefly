import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MarkdownRenderer from '../MarkdownRenderer';

jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }) => <div data-testid="syntax-highlighter">{children}</div>,
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
}));

jest.mock('react-markdown', () => (props) => (
    <div data-testid="react-markdown">{props.children}</div>
  ));

jest.mock('remark-gfm', () => jest.fn());

describe('MarkdownRenderer Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
      });
  test('renders plain text content', () => {
    const plainText = 'This is a plain text paragraph.';
    render(<MarkdownRenderer content={plainText} />);

    expect(screen.getByText(plainText)).toBeInTheDocument();
  });

  test('renders Markdown formatted content', () => {
    const markdownContent = '# Heading 1\n\nThis is a paragraph.';
    render(<MarkdownRenderer content={markdownContent} />);
    const codeBlock = screen.getByTestId('react-markdown');
    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
    expect(codeBlock).toBeInTheDocument();
  });

  test('renders code blocks with syntax highlighting', () => {
    const markdownContent = '```js\nconsole.log("Hello, world!");\n```';
    render(<MarkdownRenderer content={markdownContent} />);
    const codeBlock = screen.getByTestId('react-markdown');
    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
    expect(codeBlock).toBeInTheDocument();
  });

  test('renders inline code', () => {
    const inlineCode = 'This is `inline code`.';
    render(<MarkdownRenderer content={inlineCode} />);
    const codeBlock = screen.getByTestId('react-markdown');
    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
    expect(codeBlock).toBeInTheDocument();
  });

  test('renders non-inline code block with syntax highlighting', () => {
    const codeContent = '```js\nconsole.log("Hello, world!");\n```';
    render(<MarkdownRenderer content={codeContent} />);
  
    const syntaxHighlighter = screen.getByTestId('react-markdown');
    expect(syntaxHighlighter).toBeInTheDocument();
    expect(syntaxHighlighter).toHaveTextContent('console.log("Hello, world!");');
  });

  test('renders GitHub-flavored Markdown (GFM)', () => {
    const gfmContent = '- [x] Task 1\n- [ ] Task 2\n\n| Col1 | Col2 |\n| ---- | ---- |\n| Val1 | Val2 |';
    render(<MarkdownRenderer content={gfmContent} />);
    const codeBlock = screen.getByTestId('react-markdown');
    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
    expect(codeBlock).toBeInTheDocument();
  });

  test('renders custom styles for paragraphs', () => {
    const paragraph = 'This is a styled paragraph.';
    render(<MarkdownRenderer content={paragraph} />);
    const codeBlock = screen.getByTestId('react-markdown');
    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
    expect(codeBlock).toBeInTheDocument();
  });

  test('renders without crashing for empty content', () => {
    render(<MarkdownRenderer content="" />);
    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
  });
});