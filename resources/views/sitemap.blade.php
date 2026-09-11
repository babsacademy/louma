<?php echo '<?xml version="1.0" encoding="UTF-8"?>'; ?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>{{ route('home') }}</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
@foreach ($shops as $shop)
    <url>
        <loc>{{ route('public.shops.show', $shop) }}</loc>
        @if ($shop->updated_at)
        <lastmod>{{ $shop->updated_at->toAtomString() }}</lastmod>
        @endif
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>
@endforeach
</urlset>
