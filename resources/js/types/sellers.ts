export type SellerRole = 'admin' | 'seller';

export interface SellerCreator {
    id: number;
    name: string;
}

export interface Seller {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: SellerRole;
    active: boolean;
    disabled_at: string | null;
    created_by: number | null;
    created_at: string;
    updated_at: string;
    shops_count?: number;
    creator?: SellerCreator;
}

export interface SellerFilters {
    search?: string;
}

export interface SellerForEdit {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    active: boolean;
    disabled_at: string | null;
    created_at: string;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number | null;
    to: number | null;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}
