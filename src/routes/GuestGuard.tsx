import { useLocation, useNavigate } from '@solidjs/router';
import { createEffect, ParentComponent, Show, untrack } from 'solid-js';
import { useAuthContext } from '../context/AuthContext';
import { publicRoutes } from './routes.config';

const GuestGuard: ParentComponent = (props) => {
    const { loading, isAuthenticated } = useAuthContext();
    const location = useLocation();
    const navigate = useNavigate();

    createEffect(() => {
        if (!loading() && isAuthenticated()) {
            untrack(() => {
                const isPublic = publicRoutes.find((r) => r.path === location.pathname);
                if (isPublic) {
                    navigate('/', { replace: true });
                }
            });
        }
    });

    return (
        <Show when={!loading()} fallback={null}>
            {props.children}
        </Show>
    );
};

export default GuestGuard;
