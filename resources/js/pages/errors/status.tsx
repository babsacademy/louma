import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Home, ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { home } from '@/routes';

const messages = {
    403: {
        title: 'Accès non autorisé',
        description:
            'Vous ne disposez pas des droits nécessaires pour consulter cette page.',
    },
    404: {
        title: 'Page introuvable',
        description: 'Cette page n’existe pas ou n’est plus disponible.',
    },
    500: {
        title: 'Une erreur est survenue',
        description:
            'Notre équipe peut consulter les journaux techniques. Réessayez dans quelques instants.',
    },
} as const;

export default function ErrorStatus({ status }: { status: 403 | 404 | 500 }) {
    const message = messages[status] ?? messages[500];

    return (
        <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-12 text-stone-950">
            <Head title={`${status} — ${message.title}`} />
            <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm sm:p-10">
                <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-900">
                    <ShieldAlert className="size-7" aria-hidden="true" />
                </span>
                <p className="mt-6 text-sm font-semibold tracking-[0.16em] text-amber-800 uppercase">
                    Erreur {status}
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                    {message.title}
                </h1>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                    {message.description}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button variant="outline" asChild>
                        <Link href={home.url()}>
                            <Home className="size-4" aria-hidden="true" />
                            Accueil
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        Retour
                    </Button>
                </div>
            </div>
        </main>
    );
}
