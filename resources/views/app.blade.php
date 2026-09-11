@php
    $component = $page['component'] ?? '';
    $shop = $page['props']['shop'] ?? [];
    $isPublicShopPage = in_array($component, ['public/shops/index', 'public/shops/show'], true);
    $isIndexable = $isPublicShopPage && ! request()->hasAny(['search', 'zone', 'page']);
    $siteName = config('app.name');
    $seoTitle = match ($component) {
        'public/shops/index' => "Poulets disponibles à Dakar — {$siteName}",
        'public/shops/show' => ($shop['name'] ?? $siteName).' — Poulets à '.($shop['zone'] ?? 'Dakar')." — {$siteName}",
        default => $siteName.' — Poulets disponibles à Dakar',
    };
    $seoDescription = match ($component) {
        'public/shops/show' => 'Stock, poids et prix des poulets de '.($shop['name'] ?? 'cette boutique').' à '.($shop['zone'] ?? 'Dakar').'.',
        'public/shops/index' => 'Trouvez une boutique de poulet à Dakar, consultez le stock, le poids et le prix, puis commandez simplement.',
        default => 'Trouvez des poulets disponibles près de chez vous à Dakar.',
    };
    $canonicalUrl = request()->url();
    $seoImage = $shop['image_url'] ?? url('/storage/shops/default-shop.png');
    $structuredData = match ($component) {
        'public/shops/index' => $isIndexable ? [
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            'name' => $siteName,
            'url' => $canonicalUrl,
            'inLanguage' => 'fr-SN',
        ] : null,
        'public/shops/show' => $isIndexable ? [
            '@context' => 'https://schema.org',
            '@type' => 'Store',
            'name' => $shop['name'] ?? $siteName,
            'image' => $seoImage,
            'url' => $canonicalUrl,
            'address' => [
                '@type' => 'PostalAddress',
                'addressLocality' => $shop['zone'] ?? 'Dakar',
                'addressRegion' => 'Dakar',
                'addressCountry' => 'SN',
            ],
            'areaServed' => 'Dakar',
            'offers' => [
                '@type' => 'Offer',
                'price' => $shop['unit_price'] ?? null,
                'priceCurrency' => 'XOF',
                'availability' => ($shop['stock_quantity'] ?? 0) > 0
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
            ],
        ] : null,
        default => null,
    };
@endphp
<!DOCTYPE html>
<html lang="fr-SN" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <title data-inertia="">{{ $seoTitle }}</title>
        <meta data-inertia="description" name="description" content="{{ $seoDescription }}">
        <meta data-inertia="robots" name="robots" content="{{ $isIndexable ? 'index, follow' : 'noindex, nofollow' }}">
        <link data-inertia="canonical" rel="canonical" href="{{ $canonicalUrl }}">
        <meta data-inertia="og-type" property="og:type" content="website">
        <meta data-inertia="og-title" property="og:title" content="{{ $seoTitle }}">
        <meta data-inertia="og-description" property="og:description" content="{{ $seoDescription }}">
        <meta data-inertia="og-url" property="og:url" content="{{ $canonicalUrl }}">
        <meta data-inertia="og-site-name" property="og:site_name" content="{{ $siteName }}">
        <meta data-inertia="og-locale" property="og:locale" content="fr_SN">
        <meta data-inertia="og-image" property="og:image" content="{{ $seoImage }}">
        <meta data-inertia="twitter-card" name="twitter:card" content="summary_large_image">
        @if ($structuredData)
        <script data-inertia="structured-data" type="application/ld+json">{!! json_encode($structuredData, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
        @endif

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head />
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
