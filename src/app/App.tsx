import React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import '../styles/fonts.css';
import { ThemeProvider } from './components/layout/ThemeProvider';

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
