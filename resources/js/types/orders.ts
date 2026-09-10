import type { PaginatedData } from './sellers';

export interface PublicOrderConfirmation {
    reference: string;
    shop_name: string;
    shop_zone: string;
    customer_name: string;
    customer_phone_masked: string;
    delivery_address: string;
    quantity: number;
    average_weight_snapshot: number;
    unit_price: number;
    subtotal: number;
    status: string;
    cancellation_reason: string | null;
    created_at: string | null;
}

export interface AdminOrderSummary {
    id: number;
    reference: string;
    status: string;
    status_label: string;
    customer_name: string;
    customer_phone: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    created_at: string | null;
    shop: {
        name: string;
        zone: string;
        seller_name: string | null;
        seller_phone: string | null;
    };
}

export interface AdminOrder extends AdminOrderSummary {
    delivery_address: string;
    average_weight_snapshot: number;
    commission_per_unit: number;
    platform_commission: number;
    seller_amount: number;
    stock_reserved_at: string | null;
    stock_released_at: string | null;
    confirmed_at: string | null;
    preparing_at: string | null;
    picked_up_at: string | null;
    delivering_at: string | null;
    delivered_at: string | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    reservation_expires_at: string | null;
    payment: PaymentRecord | null;
    seller_payout: SellerPayoutRecord | null;
    history: Array<{
        id: number;
        from_status: string | null;
        to_status: string;
        reason: string | null;
        changed_by: string | null;
        created_at: string;
    }>;
}

export interface PaymentRecord {
    id: number;
    amount: number;
    method: string;
    status: string;
    transaction_reference: string;
    paid_at: string | null;
    recorded_by?: string | null;
}

export interface SellerPayoutRecord {
    id?: number;
    amount?: number;
    method?: string;
    status: string;
    transaction_reference?: string;
    paid_at: string | null;
    seller_name?: string | null;
    recorded_by?: string | null;
}

export interface SellerOrder {
    id: number;
    reference: string;
    status: string;
    quantity: number;
    average_weight_snapshot: number;
    seller_amount: number;
    seller_payout: Pick<SellerPayoutRecord, 'status' | 'paid_at'> | null;
    created_at: string | null;
    shop: { name: string; zone: string };
}

export interface OrderFilters {
    search: string;
    status: string | null;
}

export interface OrdersIndexProps {
    orders: PaginatedData<AdminOrderSummary>;
    filters: OrderFilters;
    statuses: Array<{ value: string; label: string }>;
}

export interface AdminPaymentRow extends PaymentRecord {
    order: {
        reference: string;
        customer_name: string;
        shop_name: string | null;
    };
    recorded_by: string | null;
}

export interface AdminPayoutRow extends SellerPayoutRecord {
    amount: number;
    method: string;
    status: string;
    transaction_reference: string;
    order: { reference: string; shop_name: string | null };
    seller: string | null;
    recorded_by: string | null;
}
