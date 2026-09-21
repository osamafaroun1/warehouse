import { createContext, createSignal, onMount, type ParentProps, useContext } from 'solid-js';

type Theme = 'light' | 'dark';

const ThemeCtx = createContext<ReturnType<typeof makeThemeContext>>();

function makeThemeContext() {
    const [theme, setThemeState] = createSignal<Theme>('dark');

    onMount(() => {
        const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) as Theme | null;
        const initial: Theme = saved ?? 'dark';
        apply(initial);
        setThemeState(initial);
    });

    const apply = (t: Theme) => {
        const root = document.documentElement;
        if (t === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
        localStorage.setItem('theme', t);
    };

    const setTheme = (t: Theme) => {
        setThemeState(t);
        apply(t);
    };

    const toggle = () => setTheme(theme() === 'dark' ? 'light' : 'dark');

    return {
        theme,
        toggle,
        setTheme,
    };
}

export function ThemeProvider(props: ParentProps) {
    const ctx = makeThemeContext();

    return (
        <ThemeCtx.Provider value={ctx}>
            {props.children}
        </ThemeCtx.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeCtx);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
}
