import { render } from 'solid-js/web';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import 'material-icons/iconfont/material-icons.css';
import './index.css';
import { loadTranslations } from './localization';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

(async () => {
    await loadTranslations();
    render(() => (
        <ThemeProvider>
            <App />
        </ThemeProvider>
    ), root);
})();
