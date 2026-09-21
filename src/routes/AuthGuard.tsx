import { useNavigate } from '@solidjs/router';
import { onMount, ParentComponent, Show } from 'solid-js';
import { useAuthContext } from '../context/AuthContext';

const AuthGuard: ParentComponent = (props) => {
    const { isAuthenticated, loading, initializeAuth } = useAuthContext();
    const navigate = useNavigate();

    onMount(async () => {
        if (isAuthenticated()) {
            return;
        }

        const authenticated = await initializeAuth();

        if (!authenticated) {
            navigate('/login', { replace: true });
        }
    });

    return (
        <Show when={!loading() && isAuthenticated()}>
            {props.children}
        </Show>
    );
};

export default AuthGuard;
