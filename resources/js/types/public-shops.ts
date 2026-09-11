import type { PaginatedData } from './sellers';

export interface PublicShop {
    id: number;
    name: string;
    slug: string;
    zone: string;
    description: string | null;
    image_url: string | null;
    stock_quantity: number;
    formatted_weight: string;
    unit_price: number;
}

export interface PublicShopFilters {
    search: string;
    zone: string;
}

export interface PublicShopPageProps {
    shops: PaginatedData<PublicShop>;
    zones: string[];
    mapShops: PublicShop[];
    filters: PublicShopFilters;
}
