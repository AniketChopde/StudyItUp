import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', isLoading, children, disabled, ...props }, ref) => {

        /* ── Base ───────────────────────────────────────────────── */
        const baseStyles = [
            'relative inline-flex items-center justify-center',
            'font-semibold tracking-wide text-sm',
            'rounded-xl overflow-hidden',
            'transition-all duration-200 ease-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1122]',
            'disabled:opacity-40 disabled:pointer-events-none disabled:saturate-50',
            'active:scale-[0.97]',
            // Shimmer pseudo-element (only visible on default variant via conditional)
        ].join(' ');

        /* ── Variants ───────────────────────────────────────────── */
        const variants: Record<string, string> = {
            default: [
                // Gradient fill
                'bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600',
                'text-white',
                // Glow
                'shadow-[0_0_0_1px_rgba(99,102,241,0.3),0_4px_16px_rgba(99,102,241,0.35),0_1px_0_rgba(255,255,255,0.12)_inset]',
                // Hover: lift + stronger glow
                'hover:from-indigo-400 hover:via-indigo-500 hover:to-violet-500',
                'hover:shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_8px_24px_rgba(99,102,241,0.5),0_1px_0_rgba(255,255,255,0.15)_inset]',
                'hover:-translate-y-0.5',
                // Shimmer layer
                'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent',
                'before:translate-x-[-100%] before:transition-transform before:duration-700',
                'hover:before:translate-x-[100%]',
            ].join(' '),

            destructive: [
                'bg-gradient-to-br from-red-500 via-red-600 to-rose-600',
                'text-white',
                'shadow-[0_0_0_1px_rgba(239,68,68,0.3),0_4px_16px_rgba(239,68,68,0.3),0_1px_0_rgba(255,255,255,0.1)_inset]',
                'hover:from-red-400 hover:to-rose-500',
                'hover:shadow-[0_0_0_1px_rgba(239,68,68,0.4),0_8px_24px_rgba(239,68,68,0.45),0_1px_0_rgba(255,255,255,0.12)_inset]',
                'hover:-translate-y-0.5',
            ].join(' '),

            outline: [
                'bg-white/4 border border-white/12',
                'text-slate-200',
                'shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_2px_8px_rgba(0,0,0,0.2)]',
                // Hover: tint to indigo
                'hover:bg-indigo-500/10 hover:border-indigo-500/35 hover:text-indigo-200',
                'hover:shadow-[0_0_0_1px_rgba(99,102,241,0.2),0_4px_16px_rgba(99,102,241,0.15),0_1px_0_rgba(255,255,255,0.06)_inset]',
                'hover:-translate-y-0.5',
            ].join(' '),

            secondary: [
                'bg-white/8 border border-white/10',
                'text-slate-200',
                'shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_2px_6px_rgba(0,0,0,0.2)]',
                'hover:bg-white/12 hover:border-white/18 hover:text-white',
                'hover:-translate-y-0.5',
            ].join(' '),

            ghost: [
                'bg-transparent',
                'text-slate-300',
                'hover:bg-white/6 hover:text-white',
                'hover:shadow-none',
            ].join(' '),

            link: [
                'bg-transparent p-0 h-auto',
                'text-indigo-400 underline-offset-4',
                'hover:underline hover:text-indigo-300',
            ].join(' '),
        };

        /* ── Sizes ──────────────────────────────────────────────── */
        const sizes: Record<string, string> = {
            default: 'h-9 px-4 py-2 gap-2',
            sm:      'h-7 px-3 text-xs gap-1.5 rounded-lg',
            lg:      'h-11 px-6 text-sm gap-2 rounded-xl',
            icon:    'h-9 w-9 rounded-xl',
        };

        return (
            <button
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {/* Spinner */}
                {isLoading && (
                    <svg
                        className="h-3.5 w-3.5 animate-spin flex-shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12" cy="12" r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button };
