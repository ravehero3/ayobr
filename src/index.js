import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

try {
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root container not found');
  }
  
  const root = createRoot(container);
  root.render(<App />);
  console.log('React app mounted successfully');
} catch (error) {
  console.error('Failed to mount React app:', error);
  document.body.innerHTML = `<div style="color: red; padding: 20px;">Error: ${error.message}</div>`;
}
