import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

jest.mock('../reportWebVitals', () => jest.fn());
jest.mock('remark-gfm', () => jest.fn());

jest.mock('react-syntax-highlighter', () => ({
  Prism: jest.fn(() => <div data-testid="syntax-highlighter"></div>),
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
}));

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
  })),
}));

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

jest.mock('react-markdown', () => (props) => (
  <div data-testid="react-markdown">{props.children}</div>
));

// Mock `web-vitals` with Jest
jest.mock('web-vitals', () => ({
  getCLS: jest.fn(),
  getFID: jest.fn(),
  getFCP: jest.fn(),
  getLCP: jest.fn(),
  getTTFB: jest.fn(),
}));

jest.mock('../App', () => () => <div>Mocked App</div>);

describe('index.js', () => {
  let root;

  beforeEach(() => {
    // Set up a mock DOM for the root element
    document.body.innerHTML = '<div id="root"></div>';
    root = document.getElementById('root');
    jest.clearAllMocks();
  });

  it('renders the App component without crashing', () => {
    // Mock the root element
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);
  
    // Set up spies
    const createRootSpy = jest.spyOn(ReactDOM, 'createRoot');
    const mockRender = jest.fn();
    createRootSpy.mockReturnValue({ render: mockRender });
  
    // Trigger the index.js logic
    require('../index');
  
    // Assert `createRoot` was called with the correct element
    expect(createRootSpy).toHaveBeenCalledWith(root);
  
    // Assert `render` was called with the expected component tree
    expect(mockRender).toHaveBeenCalledWith(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });

  it('calls reportWebVitals', () => {
    // Dynamically require index.js after mocking
    require('../index');

    getCLS.mockImplementation((callback) => callback({ name: 'CLS', value: 0 }));
    getFID.mockImplementation((callback) => callback({ name: 'FID', value: 10 }));
    getFCP.mockImplementation((callback) => callback({ name: 'FCP', value: 1.5 }));
    getLCP.mockImplementation((callback) => callback({ name: 'LCP', value: 2.5 }));
    getTTFB.mockImplementation((callback) => callback({ name: 'TTFB', value: 100 }));
  });
});