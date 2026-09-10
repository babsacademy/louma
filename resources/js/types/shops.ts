export interface ShopSeller {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    active?: boolean;
}

export interface Shop {
    id: number;
    seller_id: number;
    name: string;
    slug: string;
    zone: string;
    description: string | null;
    image_path: string | null;
    image_url: string | null;
    stock_quantity: number;
    average_weight: number;
    average_weight_kg: number;
    formatted_weight: string;
    unit_price: number;
    active: boolean;
    created_at: string;
    updated_at: string;
    seller?: ShopSeller;
}

export interface ShopFilters {
    search?: string;
    zone?: string;
    status?: string;
}

export interface ShopForEdit {
    id: number;
    seller_id: number;
    name: string;
    zone: string;
    description: string | null;
    stock_quantity: number;
    average_weight_kg: number;
    image_url: string | null;
    active: boolean;
    seller?: ShopSeller;
}
