import { Head, usePage } from '@inertiajs/react';

type PublicSeoProps = {
    title: string;
    description: string;
    image?: string | null;
    noIndex?: boolean;
    schema?: Record<string, unknown>;
};

const defaultImagePath = '/storage/shops/default-shop.png';

export default function PublicSeo({
    title,
    description,
    image,
    noIndex = false,
    schema,
}: PublicSeoProps) {
    const { url } = usePage();
    const path = url.split('?')[0] || '/';
    const origin = window.location.origin;
    const canonicalUrl = new URL(path, origin).toString();
    const imageUrl = new URL(image || defaultImagePath, origin).toString();
    const robots = noIndex ? 'noindex, nofollow' : 'index, follow';
    const structuredData = schema
        ? { ...schema, url: schema.url || canonicalUrl }
        : null;

    return (
        <Head title={title}>
            <meta
                head-key="description"
                name="description"
                content={description}
            />
            <meta head-key="robots" name="robots" content={robots} />
            <link head-key="canonical" rel="canonical" href={canonicalUrl} />
            <meta head-key="og-type" property="og:type" content="website" />
            <meta head-key="og-title" property="og:title" content={title} />
            <meta
                head-key="og-description"
                property="og:description"
                content={description}
            />
            <meta head-key="og-url" property="og:url" content={canonicalUrl} />
            <meta
                head-key="og-site-name"
                property="og:site_name"
                content="Louma Guinard"
            />
            <meta head-key="og-locale" property="og:locale" content="fr_SN" />
            <meta head-key="og-image" property="og:image" content={imageUrl} />
            <meta
                head-key="twitter-card"
                name="twitter:card"
                content="summary_large_image"
            />
            {structuredData ? (
                <script
                    head-key="structured-data"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(structuredData),
                    }}
                />
            ) : null}
        </Head>
    );
}
