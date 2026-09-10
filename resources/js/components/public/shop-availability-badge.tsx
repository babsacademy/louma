import { CheckCircle2, CircleAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

export default function ShopAvailabilityBadge({
    available,
}: {
    available: boolean;
}) {
    return (
        <Badge
            variant="outline"
            className={
                available
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-stone-300 bg-stone-100 text-stone-700'
            }
        >
            {available ? (
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
            ) : (
                <CircleAlert className="size-3.5" aria-hidden="true" />
            )}
            {available ? 'Disponible' : 'Rupture de stock'}
        </Badge>
    );
}
