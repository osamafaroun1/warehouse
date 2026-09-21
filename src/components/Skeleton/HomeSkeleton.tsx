// src/components/Skeleton/HomeSkeleton.tsx
import { Component, For } from 'solid-js';
import { Card } from '../ui';
import { Skeleton } from './Skeleton';

const HomeSkeleton: Component = () => {
    return (
        <div class='mx-auto max-w-[1600px] space-y-6 animate-pulse'>
            {/* Header */}
            <div class='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                <div>
                    <Skeleton class='h-8 w-64' />
                    <Skeleton class='mt-2 h-4 w-80' />
                </div>
                <div class='flex gap-2'>
                    <Skeleton class='h-9 w-28' />
                    <Skeleton class='h-9 w-32' />
                </div>
            </div>

            {/* Stats Cards - 6 cards, 3 per row on desktop */}
            <div class='grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-3'>
                <For each={[1, 2, 3, 4, 5, 6]}>
                    {() => (
                        <Card>
                            <div class='mb-3 flex items-center justify-between'>
                                <Skeleton class='h-9 w-9 rounded-lg' />
                                <Skeleton class='h-5 w-16 rounded-full' />
                            </div>
                            <Skeleton class='h-8 w-20' />
                            <Skeleton class='mt-2 h-3 w-24' />
                        </Card>
                    )}
                </For>
            </div>

            {/* Quick Actions */}
            <Card>
                <div class='mb-3 flex items-center justify-between'>
                    <Skeleton class='h-5 w-32' />
                    <Skeleton class='h-5 w-5 rounded' />
                </div>
                <div class='grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6'>
                    <For each={[1, 2, 3, 4, 5, 6]}>
                        {() => <Skeleton class='h-9 w-full rounded-lg' />}
                    </For>
                </div>
                <div class='mt-4'>
                    <Skeleton class='h-16 w-full rounded-lg' />
                </div>
            </Card>

            {/* Two column layout: Recent Activity + Expiring Marks */}
            <div class='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                {/* Recent Activity */}
                <Card padding='none'>
                    <div class='flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-white/5'>
                        <Skeleton class='h-5 w-32' />
                        <Skeleton class='h-4 w-16' />
                    </div>
                    <div class='divide-y divide-zinc-100 dark:divide-white/5'>
                        <For each={[1, 2, 3, 4, 5]}>
                            {() => (
                                <div class='flex items-center justify-between p-3'>
                                    <div class='flex items-center gap-3'>
                                        <Skeleton class='h-8 w-8 rounded-lg' />
                                        <div>
                                            <Skeleton class='h-4 w-40' />
                                            <Skeleton class='mt-1 h-3 w-24' />
                                        </div>
                                    </div>
                                    <div class='flex items-center gap-2'>
                                        <Skeleton class='h-5 w-16 rounded-full' />
                                        <Skeleton class='h-3 w-20' />
                                    </div>
                                </div>
                            )}
                        </For>
                    </div>
                </Card>

                {/* Expiring Marks */}
                <Card padding='none'>
                    <div class='flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-white/5'>
                        <div class='flex items-center gap-2'>
                            <Skeleton class='h-5 w-5 rounded' />
                            <Skeleton class='h-5 w-32' />
                        </div>
                        <Skeleton class='h-4 w-16' />
                    </div>
                    <div class='divide-y divide-zinc-100 dark:divide-white/5'>
                        <For each={[1, 2, 3, 4, 5]}>
                            {() => (
                                <div class='flex items-center justify-between p-3'>
                                    <div>
                                        <Skeleton class='h-4 w-40' />
                                        <Skeleton class='mt-1 h-3 w-24' />
                                    </div>
                                    <div class='text-right'>
                                        <Skeleton class='h-4 w-24' />
                                        <Skeleton class='mt-1 h-5 w-20 rounded-full' />
                                    </div>
                                </div>
                            )}
                        </For>
                    </div>
                </Card>
            </div>

            {/* Pie Charts Row - 2 charts */}
            <div class='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <For each={[1, 2]}>
                    {() => (
                        <Card>
                            <div class='mb-3'>
                                <Skeleton class='h-5 w-40' />
                                <Skeleton class='mt-1 h-3 w-32' />
                            </div>
                            <div class='flex flex-col items-center justify-center gap-3'>
                                <Skeleton class='h-40 w-40 rounded-full' />
                                <div class='flex flex-wrap justify-center gap-3'>
                                    <For each={[1, 2, 3]}>
                                        {() => (
                                            <div class='flex items-center gap-2'>
                                                <Skeleton class='h-2 w-2 rounded-sm' />
                                                <Skeleton class='h-3 w-16' />
                                                <Skeleton class='h-3 w-8' />
                                            </div>
                                        )}
                                    </For>
                                </div>
                            </div>
                        </Card>
                    )}
                </For>
            </div>

            {/* Recent Payments */}
            <Card padding='none'>
                <div class='flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-white/5'>
                    <Skeleton class='h-5 w-32' />
                    <Skeleton class='h-4 w-16' />
                </div>
                <div class='divide-y divide-zinc-100 dark:divide-white/5'>
                    <For each={[1, 2, 3, 4, 5]}>
                        {() => (
                            <div class='flex items-center justify-between p-3'>
                                <div>
                                    <Skeleton class='h-4 w-40' />
                                    <Skeleton class='mt-1 h-3 w-32' />
                                </div>
                                <div class='text-right'>
                                    <Skeleton class='h-4 w-24' />
                                    <Skeleton class='mt-1 h-5 w-16 rounded-full' />
                                </div>
                            </div>
                        )}
                    </For>
                </div>
            </Card>
        </div>
    );
};

export default HomeSkeleton;
