import { Link, usePage } from '@inertiajs/react';
import { LogIn, Menu, ShoppingBasket } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { home } from '@/routes';
import login from '@/routes/login';
import { index as shopsIndex } from '@/routes/public/shops';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const { url } = usePage();
    const navigation = [
        { label: 'Accueil', href: home.url(), active: url === '/' },
        {
            label: 'Boutiques',
            href: shopsIndex.url(),
            active: url.startsWith(shopsIndex.url()),
        },
    ];

    return (
        <div className="public-marketplace bg-background text-foreground flex min-h-svh flex-col">
            <header className="bg-background/95 sticky top-0 z-20 border-b border-stone-200 backdrop-blur">
                <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <Link
                        href={home.url()}
                        className="flex items-center gap-2.5 font-semibold tracking-tight"
                    >
                        <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500 text-stone-950 shadow-sm">
                            <ShoppingBasket className="size-5" />
                        </span>
                        <span className="text-lg">Louma Guinard</span>
                    </Link>
                    <nav
                        className="hidden items-center gap-1 md:flex"
                        aria-label="Navigation principale"
                    >
                        {navigation.map((item) => (
                            <Button
                                key={item.label}
                                variant={item.active ? 'secondary' : 'ghost'}
                                size="sm"
                                className={
                                    item.active
                                        ? 'bg-amber-100 text-amber-950 hover:bg-amber-100'
                                        : 'text-stone-700 hover:bg-amber-50 hover:text-stone-950'
                                }
                                asChild
                            >
                                <Link href={item.href}>{item.label}</Link>
                            </Button>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-stone-300 bg-white"
                            asChild
                        >
                            <Link href={login.store.url()}>
                                <LogIn className="size-4" aria-hidden="true" />
                                Connexion
                            </Link>
                        </Button>
                    </nav>
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="border-stone-300 bg-white text-stone-950 hover:bg-stone-50 md:hidden"
                            >
                                <Menu className="size-5" />
                                <span className="sr-only">Ouvrir le menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[min(86vw,22rem)] border-stone-200 bg-white text-stone-950">
                            <SheetHeader>
                                <SheetTitle className="flex items-center gap-2 text-left text-stone-950">
                                    <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500 text-stone-950">
                                        <ShoppingBasket className="size-4" />
                                    </span>
                                    Louma Guinard
                                </SheetTitle>
                            </SheetHeader>
                            <nav
                                className="mt-4 grid gap-2 px-4"
                                aria-label="Navigation mobile"
                            >
                                {navigation.map((item) => (
                                    <Button
                                        key={item.label}
                                        variant={
                                            item.active ? 'secondary' : 'ghost'
                                        }
                                        className={
                                            item.active
                                                ? 'h-11 justify-start bg-amber-100 text-base text-amber-950 hover:bg-amber-100'
                                                : 'h-11 justify-start text-base text-stone-700 hover:bg-amber-50 hover:text-stone-950'
                                        }
                                        asChild
                                    >
                                        <Link
                                            href={item.href}
                                            onClick={() => setOpen(false)}
                                        >
                                            {item.label}
                                        </Link>
                                    </Button>
                                ))}
                                <Separator className="my-2" />
                                <Button
                                    className="h-11 border-stone-300 bg-white text-stone-950 hover:bg-stone-50"
                                    variant="outline"
                                    asChild
                                >
                                    <Link
                                        href={login.store.url()}
                                        onClick={() => setOpen(false)}
                                    >
                                        <LogIn className="size-4" />
                                        Connexion
                                    </Link>
                                </Button>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="mt-14 bg-stone-950 text-stone-200">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
                    <div>
                        <p className="text-lg font-semibold text-white">
                            Louma Guinard
                        </p>
                        <p className="mt-2 max-w-md text-sm leading-6 text-stone-300">
                            Des poulets disponibles près de chez vous à Dakar.
                        </p>
                    </div>
                    <nav
                        className="flex flex-wrap items-start gap-x-5 gap-y-2 text-sm"
                        aria-label="Liens utiles"
                    >
                        <Link
                            className="hover:text-amber-300"
                            href={home.url()}
                        >
                            Accueil
                        </Link>
                        <Link
                            className="hover:text-amber-300"
                            href={shopsIndex.url()}
                        >
                            Boutiques
                        </Link>
                        <Link
                            className="hover:text-amber-300"
                            href={login.store.url()}
                        >
                            Connexion
                        </Link>
                    </nav>
                </div>
                <div className="border-t border-stone-800">
                    <div className="mx-auto max-w-7xl px-4 py-5 text-center text-xs leading-5 text-stone-400 sm:px-6 lg:px-8">
                        <p>
                            Conçu &amp; développé par{' '}
                            <a
                                href="https://babsacademy.com/"
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-stone-300 underline-offset-4 transition-colors hover:text-amber-300 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                            >
                                Babsacademy
                            </a>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
