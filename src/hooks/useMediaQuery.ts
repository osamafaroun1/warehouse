import { createSignal, onCleanup, onMount } from 'solid-js';

/**
 * Reactive media-query signal for Solid.
 * Returns an accessor that stays in sync with the given media query,
 * updating live as the viewport is resized.
 */
export function useMediaQuery(query: string) {
    const [matches, setMatches] = createSignal(false);

    onMount(() => {
        const mql = window.matchMedia(query);
        setMatches(mql.matches);

        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
        mql.addEventListener('change', handler);

        onCleanup(() => mql.removeEventListener('change', handler));
    });

    return matches;
}
