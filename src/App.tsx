import { Route, Router } from '@solidjs/router';
import { Component, For } from 'solid-js';
import Shell from './components/layout/Shell';
import { AuthProvider } from './context/AuthContext';
import AuthGuard from './routes/AuthGuard';
import GuestGuard from './routes/GuestGuard';
import { appRoutes, publicRoutes } from './routes/routes.config';

const App: Component = () => {
    return (
        <Router
            root={(props) => (
                <AuthProvider>
                    {props.children}
                </AuthProvider>
            )}
        >
            {/* PUBLIC ROUTES */}
            <Route path='/*' component={GuestGuard}>
                <For each={publicRoutes}>
                    {(route) => <Route path={route.path} component={route.component} />}
                </For>
            </Route>

            <Route path='/*' component={AuthGuard}>
                <Route path='/*' component={Shell}>
                    <For each={appRoutes}>
                        {(route) => <Route path={route.path} component={route.component} />}
                    </For>
                </Route>
            </Route>
        </Router>
    );
};

export default App;
