// @ts-check
// React is used implicitly by JSX
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../components/App';

describe('App Component', () => {
  test('renders welcome message', () => {
    render(<App />);
    const welcomeElement = screen.getByText(/welcome to gaze detection/i);
    expect(welcomeElement).toBeInTheDocument();
  });
});
