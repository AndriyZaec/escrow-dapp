import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SolanaProvider } from '@solana/react-hooks';
import { solanaClient } from '@/lib/solana';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SolanaProvider client={solanaClient}>
      <App />
    </SolanaProvider>
  </StrictMode>,
);
