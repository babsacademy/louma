<?php

use App\Enums\OrderSource;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\SellerPayoutStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Payment;
use App\Models\SellerPayout;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('seller user can be created with correct role and active cast', function () {
    $seller = User::factory()->seller()->create();

    expect($seller->role)->toBe(UserRole::Seller)
        ->and($seller->isSeller())->toBeTrue()
        ->and($seller->isAdmin())->toBeFalse()
        ->and($seller->active)->toBeTrue();
});

test('admin user can be created with correct role and admin helper', function () {
    $admin = User::factory()->admin()->create();

    expect($admin->role)->toBe(UserRole::Admin)
        ->and($admin->isAdmin())->toBeTrue()
        ->and($admin->isSeller())->toBeFalse();
});

test('seller has many shops relationship works properly', function () {
    $seller = User::factory()->seller()->create();
    $shop1 = Shop::factory()->create(['seller_id' => $seller->id]);
    $shop2 = Shop::factory()->create(['seller_id' => $seller->id]);

    expect($seller->shops)->toHaveCount(2)
        ->and($seller->shops->pluck('id'))->toContain($shop1->id, $shop2->id);
});

test('shop belongs to seller relationship works properly', function () {
    $seller = User::factory()->seller()->create();
    $shop = Shop::factory()->create(['seller_id' => $seller->id]);

    expect($shop->seller->id)->toBe($seller->id)
        ->and($shop->average_weight)->toBeInt()
        ->and($shop->stock_quantity)->toBeInt();
});

test('shop has many orders relationship works properly', function () {
    $shop = Shop::factory()->create();
    $order1 = Order::factory()->create(['shop_id' => $shop->id]);
    $order2 = Order::factory()->create(['shop_id' => $shop->id]);

    expect($shop->orders)->toHaveCount(2)
        ->and($shop->orders->pluck('id'))->toContain($order1->id, $order2->id);
});

test('order belongs to shop and has correct integer financial fields', function () {
    $order = Order::factory()->create([
        'quantity' => 2,
        'average_weight_snapshot' => 2100,
        'unit_price' => 3250,
        'commission_per_unit' => 400,
        'subtotal' => 6500,
        'platform_commission' => 800,
        'seller_amount' => 5700,
        'status' => OrderStatus::Pending,
        'source' => OrderSource::WebWhatsapp,
    ]);

    expect($order->shop)->toBeInstanceOf(Shop::class)
        ->and($order->subtotal)->toBe(6500)
        ->and($order->platform_commission)->toBe(800)
        ->and($order->seller_amount)->toBe(5700)
        ->and($order->status)->toBe(OrderStatus::Pending)
        ->and($order->source)->toBe(OrderSource::WebWhatsapp);
});

test('order has one payment relationship works properly', function () {
    $order = Order::factory()->create();
    $payment = Payment::factory()->create([
        'order_id' => $order->id,
        'amount' => $order->subtotal,
    ]);

    expect($order->payment->id)->toBe($payment->id)
        ->and($payment->order->id)->toBe($order->id)
        ->and($payment->method)->toBe(PaymentMethod::Wave)
        ->and($payment->status)->toBe(PaymentStatus::Paid);
});

test('order has one seller payout relationship works properly', function () {
    $order = Order::factory()->create();
    $payout = SellerPayout::factory()->create([
        'order_id' => $order->id,
        'seller_id' => $order->shop->seller_id,
        'amount' => $order->seller_amount,
    ]);

    expect($order->sellerPayout->id)->toBe($payout->id)
        ->and($payout->order->id)->toBe($order->id)
        ->and($payout->seller->id)->toBe($order->shop->seller_id)
        ->and($payout->method)->toBe(PaymentMethod::Wave)
        ->and($payout->status)->toBe(SellerPayoutStatus::Paid);
});

test('order reference must be unique', function () {
    $order1 = Order::factory()->create(['reference' => 'LG-2026-000001']);

    expect(fn () => Order::factory()->create(['reference' => 'LG-2026-000001']))
        ->toThrow(QueryException::class);
});

test('order request token must be unique', function () {
    $token = 'unique-request-token-123';
    Order::factory()->create(['request_token' => $token]);

    expect(fn () => Order::factory()->create(['request_token' => $token]))
        ->toThrow(QueryException::class);
});

test('shop slug must be unique', function () {
    Shop::factory()->create(['slug' => 'boutique-unique']);

    expect(fn () => Shop::factory()->create(['slug' => 'boutique-unique']))
        ->toThrow(QueryException::class);
});

test('an order cannot have duplicate payments', function () {
    $order = Order::factory()->create();
    Payment::factory()->create(['order_id' => $order->id]);

    expect(fn () => Payment::factory()->create(['order_id' => $order->id]))
        ->toThrow(QueryException::class);
});

test('an order cannot have duplicate seller payouts', function () {
    $order = Order::factory()->create();
    SellerPayout::factory()->create([
        'order_id' => $order->id,
        'seller_id' => $order->shop->seller_id,
    ]);

    expect(fn () => SellerPayout::factory()->create([
        'order_id' => $order->id,
        'seller_id' => $order->shop->seller_id,
    ]))->toThrow(QueryException::class);
});

test('order status histories track status transitions and changer', function () {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create();

    $history = OrderStatusHistory::factory()->create([
        'order_id' => $order->id,
        'from_status' => OrderStatus::Pending,
        'to_status' => OrderStatus::Confirmed,
        'changed_by' => $admin->id,
        'reason' => 'Confirmation manuelle WhatsApp',
    ]);

    expect($order->statusHistories)->toHaveCount(1)
        ->and($history->order->id)->toBe($order->id)
        ->and($history->changer->id)->toBe($admin->id)
        ->and($history->from_status)->toBe(OrderStatus::Pending)
        ->and($history->to_status)->toBe(OrderStatus::Confirmed);
});
