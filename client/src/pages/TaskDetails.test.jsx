import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import TaskDetails from './TaskDetails';

// Mock store
const mockStore = configureStore({
  reducer: {
    auth: {
      user: {
        _id: '123',
        name: 'Test User',
        email: 'test@example.com'
      }
    }
  }
});

// Mock react-router-dom
const MockTaskDetails = () => (
  <Provider store={mockStore}>
    <BrowserRouter>
      <TaskDetails />
    </BrowserRouter>
  </Provider>
);

describe('TaskDetails Component', () => {
  test('renders without crashing', () => {
    try {
      render(<MockTaskDetails />);
      expect(true).toBe(true);
    } catch (error) {
      console.error('Component failed to render:', error);
      expect(false).toBe(true);
    }
  });
});
