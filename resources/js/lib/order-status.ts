export const orderStatus = {
    pending: { label: 'En attente', variant: 'secondary' },
    confirmed: { label: 'Confirmée', variant: 'default' },
    preparing: { label: 'En préparation', variant: 'default' },
    picked_up: { label: 'Récupérée', variant: 'default' },
    delivering: { label: 'En livraison', variant: 'default' },
    delivered: { label: 'Livrée', variant: 'default' },
    cancelled: { label: 'Annulée', variant: 'destructive' },
} as const;

export type OrderStatus = keyof typeof orderStatus;
