import { createEffect, createRoot, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';

// Define your translations
const langs: { [langName: string]: () => Promise<any> } = {
    en: async () => (await import('./lang/en.json')).default,
    ar: async () => (await import('./lang/ar.json')).default,
};

const getInitialLocale = () => {
    const storedLocale = localStorage.getItem('locale') || 'en';
    return storedLocale in langs ? storedLocale : 'en';
};

// Create signal for the current locale
const [locale, setLocale] = createSignal<string>(getInitialLocale());
const [dir, setDir] = createSignal<'ltr' | 'rtl'>('ltr');
const [isRtl, setIsRtl] = createSignal(false);

// Create a signal for the current translations
const [dicts, setDicts] = createStore<{ [key: string]: any }>({});

// Load the translations based on the selected locale
const loadTranslations = async () => {
    const en = await langs.en();
    const ar = await langs.ar();
    setDicts({
        en,
        ar,
    });
};

createRoot(() => {
    createEffect(() => {
        const currentLocale = locale() || 'en';
        setDir(currentLocale === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.lang = locale();
        document.documentElement.dir = currentLocale === 'ar' ? 'rtl' : 'ltr';
        localStorage.setItem('locale', locale());
        setIsRtl(dir() === 'rtl');
    });
});

// Create the translator function with interpolation support
const t = (key: string, vars?: Record<string, string | number>): string => {
    let translation = dicts[locale()]?.[key] || key;

    if (vars) {
        Object.entries(vars).forEach(([varKey, value]) => {
            translation = translation.replace(new RegExp(`{{${varKey}}}`, 'g'), String(value));
        });
    }

    return translation;
};

// Set the locale function
const changeLocale = (newLocale: string) => {
    setLocale(newLocale); // Update the locale signal
};

export { changeLocale, dir, isRtl, loadTranslations, locale, t };
