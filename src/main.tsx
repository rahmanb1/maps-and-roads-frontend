import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById('root')!).render(
    <HelmetProvider>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </HelmetProvider>
);