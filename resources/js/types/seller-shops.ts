export interface SellerShop {
    id: number;
    name: string;
    zone: string;
    image_url: string | null;
    stock_quantity: number;
    formatted_weight: string;
    unit_price: number;
    active: boolean;
}

export interface SellerShopDetails extends SellerShop {
    description: string | null;
    average_weight_kg: number;
}

export interface SellerDashboardStats {
    total_shops: number;
    total_stock: number;
    active_shops: number;
    out_of_stock_shops: number;
    orders_to_prepare: number;
    orders_preparing: number;
    recently_delivered: number;
    pending_payout_amount: number;
    paid_payout_amount: number;
}
