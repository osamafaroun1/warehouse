import { Component } from 'solid-js';
import { Icon } from '../components/ui';

const SplashScreen: Component = () => {
    return (
        <div class={`fixed inset-0 z-100 flex items-center justify-center bg-zinc-950 transition-opacity duration-700`}>
            <div class='flex flex-col items-center'>
                {/* Logo */}
                <div class='mb-8 flex items-center gap-3'>
                    <div class='flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 via-violet-600 to-fuchsia-600 shadow-2xl shadow-indigo-500/50'>
                        <Icon
                            name='bolt'
                            size={42}
                            class='text-white'
                        />
                    </div>

                    <div>
                        <div class='text-4xl font-bold tracking-tighter text-white'>
                            المستودع
                        </div>
                        <div class='text-xs font-medium tracking-[3px] text-indigo-400 -mt-1'>
                            ENTERPRISE
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div class='text-center'>
                    <div class='text-sm font-medium text-white/90'>
                        {'Initializing workspace...'}
                    </div>
                </div>

                {/* Loading Indicator */}
                <div class='mb-8 mt-8 flex items-center gap-2'>
                    <div
                        class='h-2 w-2 animate-bounce rounded-full bg-indigo-500'
                        style={{ 'animation-delay': '0ms' }}
                    />
                    <div
                        class='h-2 w-2 animate-bounce rounded-full bg-violet-500'
                        style={{ 'animation-delay': '150ms' }}
                    />
                    <div
                        class='h-2 w-2 animate-bounce rounded-full bg-fuchsia-500'
                        style={{ 'animation-delay': '300ms' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
