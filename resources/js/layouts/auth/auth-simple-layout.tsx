import { Link } from '@inertiajs/react';
import { ArrowLeft, ShoppingBasket } from 'lucide-react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="public-marketplace relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-stone-50 px-4 py-10 text-stone-900 sm:px-6">
            <div className="absolute inset-x-0 top-0 h-1 bg-amber-500" />
            <div className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full bg-amber-100/70 blur-3xl" />
            <div className="relative w-full max-w-md">
                <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-[0_20px_60px_-36px_rgb(120_53_15/0.42)] sm:p-8">
                    <div className="flex flex-col items-center gap-5">
                        <Link
                            href={home()}
                            className="flex items-center gap-2.5 font-semibold tracking-tight text-stone-950"
                        >
                            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500 text-stone-950 shadow-sm">
                                <ShoppingBasket className="size-5" />
                            </div>
                            <span className="text-lg">Louma Guinard</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight text-stone-950">
                                {title}
                            </h1>
                            <p className="text-center text-sm leading-6 text-stone-600">
                                {description}
                            </p>
                        </div>
                    </div>
                    <div className="mt-8">{children}</div>
                </div>
                <Link
                    href={home()}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-amber-700"
                >
                    <ArrowLeft className="size-4" />
                    Retour aux boutiques
                </Link>
            </div>
        </div>
    );
}
