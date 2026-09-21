import { useNavigate } from '@solidjs/router';
import { batch, type Component, createContext, createSignal, type JSXElement, Show, useContext } from 'solid-js';
import { User } from '../../shared/shared-types';
import { isApiError } from '../api/api';
import { logout, verifyAuth } from '../api/auth';
import { useServerReady } from '../hooks/useServeReady';
import SplashScreen from '../pages/SplashScreen';

interface AppProviderProps {
    children?: JSXElement;
}

// type Permission =
//     | 'view:billing'
//     | 'manage:users'
//     | 'manage:workspace'
//     | 'view:all'
//     | 'edit:all';

// const permissionsByRole: Record<any, Permission[]> = {
//     owner: ['view:billing', 'manage:users', 'manage:workspace', 'view:all', 'edit:all'],
//     admin: ['view:billing', 'manage:users', 'manage:workspace', 'view:all', 'edit:all'],
//     manager: ['view:all', 'edit:all'],
//     staff: ['view:all', 'edit:all'],
//     viewer: ['view:all'],
// };

const AuthContext = createContext<ReturnType<typeof makeAuthContext>>();

function makeAuthContext() {
    const serverReady = useServerReady();
    const [loading, setLoading] = createSignal(false);
    const [isAuthenticated, setIsAuthenticated] = createSignal(false);
    const [user, setUser] = createSignal<User>();
    const navigate = useNavigate();

    const isAdmin = () => {
        const currentUser = user();
        return currentUser ? ['admin', 'owner'].includes(currentUser.role) : false;
    };

    // const can = (permission: Permission) => {
    //     const currentUser = user();

    //     if (!currentUser) {
    //         return false;
    //     }

    //     return permissionsByRole[currentUser.role]?.includes(permission) ?? false;
    // };

    const setAuthenticatedUser = (nextUser: any) => {
        batch(() => {
            setUser(nextUser);
            setIsAuthenticated(true);
            setLoading(false);
        });
    };

    const resetAuthState = () => {
        batch(() => {
            setUser();
            setIsAuthenticated(false);
            setLoading(false);
        });
    };

    const clearAuth = async () => {
        await logout();
        resetAuthState();
    };

    const initializeAuth = async (): Promise<boolean> => {
        if (isAuthenticated()) {
            return true;
        }

        setLoading(true);

        try {
            const res = await verifyAuth();

            if (!res || isApiError(res)) {
                throw new Error('Not Authenticated');
            }

            setAuthenticatedUser(res.user);
            return true;
        } catch {
            resetAuthState();
            return false;
        }
    };

    const handleLogout = async () => {
        resetAuthState();
        navigate('/login', { replace: true });
        try {
            await logout();
        } catch {
            // Optionally handle the API failure
        }
    };

    return {
        loading,
        isAuthenticated,
        user,
        isAdmin,
        initializeAuth,
        setAuthenticatedUser,
        clearAuth,
        handleLogout,
        serverReady,
    } as const;
}

export const useAuthContext = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuthContext must be used within AuthProvider');
    }

    return context;
};

export const AuthProvider: Component<AppProviderProps> = (props) => {
    const ctx = makeAuthContext();

    return (
        <AuthContext.Provider value={ctx}>
            <Show
                when={ctx.serverReady()}
                fallback={<SplashScreen />}
            >
                {props.children}
            </Show>
        </AuthContext.Provider>
    );
};
