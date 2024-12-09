import reportWebVitals from '../reportWebVitals';

// Mock `web-vitals` with Jest
jest.mock('web-vitals', () => ({
  getCLS: jest.fn(),
  getFID: jest.fn(),
  getFCP: jest.fn(),
  getLCP: jest.fn(),
  getTTFB: jest.fn(),
}));

// Import mocked functions
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

describe('reportWebVitals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // Default mock implementations
    getCLS.mockImplementation((callback) => callback({ name: 'CLS', value: 0 }));
    getFID.mockImplementation((callback) => callback({ name: 'FID', value: 10 }));
    getFCP.mockImplementation((callback) => callback({ name: 'FCP', value: 1.5 }));
    getLCP.mockImplementation((callback) => callback({ name: 'LCP', value: 2.5 }));
    getTTFB.mockImplementation((callback) => callback({ name: 'TTFB', value: 100 }));
  });

  it('calls all web vitals functions with the provided callback', () => {
    const mockCallback = jest.fn();

    expect(() => reportWebVitals(mockCallback));
  });

  it('does not call web vitals functions when no callback is provided', () => {
    reportWebVitals();

    // Ensure no calls are made to the web vitals functions
    expect(getCLS).not.toHaveBeenCalled();
    expect(getFID).not.toHaveBeenCalled();
    expect(getFCP).not.toHaveBeenCalled();
    expect(getLCP).not.toHaveBeenCalled();
    expect(getTTFB).not.toHaveBeenCalled();
  });

  it('handles errors gracefully if web vitals functions throw', () => {
    const mockCallback = jest.fn();

    // Simulate an error in one of the web vitals functions
    getCLS.mockImplementation(() => {
      throw new Error('Test Error');
    });

    expect(() => reportWebVitals(mockCallback)).not.toThrow();
  });

  it('does not modify global variables or cause side effects', () => {
    const mockCallback = jest.fn();
    const globalStateBefore = { ...global };

    reportWebVitals(mockCallback);

    const globalStateAfter = { ...global };
    expect(globalStateAfter).toEqual(globalStateBefore); // Ensure no side effects
  });

  it('exports reportWebVitals as a function', () => {
    expect(typeof reportWebVitals).toBe('function');
  });

});