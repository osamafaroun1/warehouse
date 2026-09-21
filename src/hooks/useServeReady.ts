// src/hooks/useServerReady.ts
import { createSignal, onMount } from 'solid-js';

export function useServerReady() {
    const [ready, setReady] = createSignal(false);

    onMount(async () => {
        for (let i = 0; i < 30; i++) {
            try {
                const res = await fetch(`${SERVER_BASE_URL}/health`);
                if (res.ok) {
                    setReady(true);
                    return;
                }
            } catch {
                // server not up yet, keep retrying
            }
            await new Promise((r) => setTimeout(r, 200));
        }
        setReady(true); // give up waiting, show app anyway after ~6s
    });

    return ready;
}
