<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\PaymentController as AdminPaymentController;
use App\Http\Controllers\Admin\SellerController;
use App\Http\Controllers\Admin\SellerPayoutController as AdminSellerPayoutController;
use App\Http\Controllers\Admin\ShopController;
use App\Http\Controllers\Public\OrderController as PublicOrderController;
use App\Http\Controllers\Public\ShopController as PublicShopController;
use App\Http\Controllers\Public\SitemapController;
use App\Http\Controllers\Seller\DashboardController as SellerDashboardController;
use App\Http\Controllers\Seller\OrderController as SellerOrderController;
use App\Http\Controllers\Seller\ShopController as SellerShopController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('robots.txt', [SitemapController::class, 'robots'])->name('robots');
Route::get('sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');

Route::get('/', [PublicShopController::class, 'index'])->name('home');
Route::get('boutiques', [PublicShopController::class, 'index'])->name('public.shops.index');
Route::get('boutiques/{shop:slug}', [PublicShopController::class, 'show'])->name('public.shops.show');
Route::post('boutiques/{shop:slug}/commandes', [PublicOrderController::class, 'store'])
    ->middleware('throttle:public-orders')
    ->name('public.orders.store');
Route::get('commande/{order:reference}/{requestToken}', [PublicOrderController::class, 'show'])
    ->middleware('throttle:public-order-confirmation')
    ->name('public.orders.show');

Route::middleware(['auth', 'active'])->group(function () {
    Route::get('dashboard', function (Request $request) {
        if ($request->user()->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        return redirect()->route('seller.dashboard');
    })->name('dashboard');

    Route::middleware(['role:admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/', DashboardController::class)->name('dashboard');

        Route::get('sellers', [SellerController::class, 'index'])->name('sellers.index');
        Route::get('sellers/create', [SellerController::class, 'create'])->name('sellers.create');
        Route::post('sellers', [SellerController::class, 'store'])->name('sellers.store');
        Route::get('sellers/{seller}', [SellerController::class, 'show'])->name('sellers.show');
        Route::get('sellers/{seller}/edit', [SellerController::class, 'edit'])->name('sellers.edit');
        Route::patch('sellers/{seller}', [SellerController::class, 'update'])->name('sellers.update');
        Route::post('sellers/{seller}/disable', [SellerController::class, 'disable'])->name('sellers.disable');
        Route::post('sellers/{seller}/enable', [SellerController::class, 'enable'])->name('sellers.enable');

        Route::get('shops', [ShopController::class, 'index'])->name('shops.index');
        Route::get('shops/create', [ShopController::class, 'create'])->name('shops.create');
        Route::post('shops', [ShopController::class, 'store'])->name('shops.store');
        Route::get('shops/{shop}', [ShopController::class, 'show'])->name('shops.show');
        Route::get('shops/{shop}/edit', [ShopController::class, 'edit'])->name('shops.edit');
        Route::patch('shops/{shop}', [ShopController::class, 'update'])->name('shops.update');
        Route::post('shops/{shop}/disable', [ShopController::class, 'disable'])->name('shops.disable');
        Route::post('shops/{shop}/enable', [ShopController::class, 'enable'])->name('shops.enable');

        Route::get('orders', [AdminOrderController::class, 'index'])->name('orders.index');
        Route::get('orders/{order}', [AdminOrderController::class, 'show'])->name('orders.show');
        Route::post('orders/{order}/confirm', [AdminOrderController::class, 'confirm'])->name('orders.confirm');
        Route::post('orders/{order}/cancel', [AdminOrderController::class, 'cancel'])->name('orders.cancel');
        Route::post('orders/{order}/start-preparing', [AdminOrderController::class, 'startPreparing'])->name('orders.start-preparing');
        Route::post('orders/{order}/mark-picked-up', [AdminOrderController::class, 'markPickedUp'])->name('orders.mark-picked-up');
        Route::post('orders/{order}/start-delivery', [AdminOrderController::class, 'startDelivery'])->name('orders.start-delivery');
        Route::post('orders/{order}/mark-delivered', [AdminOrderController::class, 'markDelivered'])->name('orders.mark-delivered');
        Route::post('orders/{order}/payment', [AdminOrderController::class, 'recordPayment'])->name('orders.payment');
        Route::post('orders/{order}/payout', [AdminOrderController::class, 'recordPayout'])->name('orders.payout');
        Route::get('payments', [AdminPaymentController::class, 'index'])->name('payments.index');
        Route::get('payouts', [AdminSellerPayoutController::class, 'index'])->name('payouts.index');
    });

    Route::middleware(['role:seller'])->prefix('seller')->name('seller.')->group(function () {
        Route::get('/', SellerDashboardController::class)->name('dashboard');
        Route::get('shops', [SellerShopController::class, 'index'])->name('shops.index');
        Route::get('shops/{shop}', [SellerShopController::class, 'show'])->name('shops.show');
        Route::patch('shops/{shop}/inventory', [SellerShopController::class, 'updateInventory'])
            ->name('shops.inventory.update');
        Route::get('orders', [SellerOrderController::class, 'index'])->name('orders.index');
        Route::get('orders/{order}', [SellerOrderController::class, 'show'])->name('orders.show');
    });
});

require __DIR__.'/settings.php';
