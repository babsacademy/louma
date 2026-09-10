import { Store } from 'lucide-react';

import { cn } from '@/lib/utils';

export default function ShopImage({
    src,
    alt,
    className,
}: {
    src: string | null;
    alt: string;
    className?: string;
}) {
    if (src) {
        return (
            <div
                className={cn(
                    'aspect-[4/3] overflow-hidden bg-[#f5eddf]',
                    className,
                )}
            >
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex aspect-[4/3] flex-col items-center justify-center gap-3 bg-[#f5eddf] text-stone-600',
                className,
            )}
        >
            <span className="flex size-11 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-800">
                <Store className="size-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium">Image non disponible</span>
        </div>
    );
}
