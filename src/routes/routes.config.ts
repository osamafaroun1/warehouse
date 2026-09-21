import { lazy } from 'solid-js';

export interface RouteConfig {
    path: string;
    component: ReturnType<typeof lazy>;
    group: 'public' | 'app';
}

export const routes: RouteConfig[] = [
    {
        path: '/login',
        component: lazy(() => import('../pages/LogIn')),
        group: 'public',
    },
    {
        path: '/reset-password',
        component: lazy(() => import('../pages/ResetPassword')),
        group: 'public',
    },
    {
        path: '/',
        component: lazy(() => import('../pages/Home')),
        group: 'app',
    },
    {
        path: '/warehouse/entry',
        component: lazy(() => import('../pages/WarehouseEntry')),
        group: 'app',
    },
    {
        path: '/warehouse/exit',
        component: lazy(() => import('../pages/WarehouseExit')),
        group: 'app',
    },
    {
        path: '/warehouse/stock',
        component: lazy(() => import('../pages/WarehouseStock')),
        group: 'app',
    },
    {
        path: '/warehouse/history',
        component: lazy(() => import('../pages/WarehouseHistory')),
        group: 'app',
    },
    {
        path: '/settings',
        component: lazy(() => import('../pages/Settings')),
        group: 'app',
    },
    {
        path: '*',
        component: lazy(() => import('../pages/404')),
        group: 'public',
    },
];

export const publicRoutes = routes.filter((r) => r.group === 'public');
export const appRoutes = routes.filter((r) => r.group === 'app');
