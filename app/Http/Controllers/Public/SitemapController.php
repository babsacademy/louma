<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function index(): Response
    {
        $shops = Shop::query()
            ->select(['slug', 'updated_at'])
            ->where('active', true)
            ->whereHas('seller', fn ($query) => $query->where('active', true))
            ->latest('updated_at')
            ->get();

        return response()->view('sitemap', ['shops' => $shops], 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
        ]);
    }

    public function robots(): Response
    {
        $contents = implode("\n", [
            'User-agent: *',
            'Allow: /',
            '',
            'Disallow: /admin',
            'Disallow: /seller',
            'Disallow: /dashboard',
            'Disallow: /settings',
            'Disallow: /login',
            'Disallow: /register',
            'Disallow: /commande/',
            '',
            'Sitemap: '.route('sitemap'),
        ]);

        return response($contents."\n", 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }
}
