import { router } from '@inertiajs/react';
import { MapPin, Store } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';

import { Badge } from '@/components/ui/badge';
import type { PublicShop } from '@/types';
import { show as shopsShow } from '@/routes/public/shops';

type Coordinates = [number, number];

type ZoneMarker = {
    zone: string;
    coordinates: Coordinates;
    shops: PublicShop[];
};

const dakarCenter: Coordinates = [14.7167, -17.4677];

const zoneCoordinates: Record<string, Coordinates> = {
    almadies: [14.7467, -17.5249],
    corniche: [14.7004, -17.4867],
    dakar: dakarCenter,
    'grand yoff': [14.7444, -17.4443],
    mamelles: [14.7321, -17.5024],
    mermoz: [14.7105, -17.4857],
    ouakam: [14.7214, -17.4902],
    'parcelles assainies': [14.7565, -17.4334],
    plateau: [14.6677, -17.4353],
    yoff: [14.7561, -17.4663],
};

function normalizeZone(zone: string): string {
    return zone
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim()
        .toLowerCase();
}

function coordinatesForZone(zone: string): Coordinates {
    const knownCoordinates = zoneCoordinates[normalizeZone(zone)];

    if (knownCoordinates) {
        return knownCoordinates;
    }

    const offset = Array.from(zone).reduce(
        (total, character) => total + character.charCodeAt(0),
        0,
    );

    return [
        dakarCenter[0] + ((offset % 7) - 3) * 0.004,
        dakarCenter[1] + ((offset % 11) - 5) * 0.004,
    ];
}

function toLngLat([latitude, longitude]: Coordinates): [number, number] {
    return [longitude, latitude];
}

function createMarkerElement(marker: ZoneMarker): HTMLButtonElement {
    const element = document.createElement('button');
    const label = document.createElement('span');
    const shopLabel = marker.shops.length > 1 ? 'boutiques' : 'boutique';

    element.type = 'button';
    element.className = 'louma-map-marker';
    element.setAttribute(
        'aria-label',
        `${marker.shops.length} ${shopLabel} disponible${marker.shops.length > 1 ? 's' : ''} à ${marker.zone}`,
    );
    label.textContent = String(marker.shops.length);
    element.append(label);

    return element;
}

function createPopupContent(marker: ZoneMarker): HTMLDivElement {
    const content = document.createElement('div');
    const heading = document.createElement('p');
    const count = document.createElement('p');
    const shopList = document.createElement('div');

    content.className = 'louma-map-popup';
    heading.className = 'louma-map-popup__zone';
    heading.textContent = marker.zone;
    count.className = 'louma-map-popup__count';
    count.textContent = `${marker.shops.length} boutique${marker.shops.length > 1 ? 's' : ''} disponible${marker.shops.length > 1 ? 's' : ''}`;
    shopList.className = 'louma-map-popup__shops';

    marker.shops.forEach((shop) => {
        const shopLink = document.createElement('a');

        shopLink.href = shopsShow.url(shop.slug);
        shopLink.className = 'louma-map-popup__shop';
        shopLink.textContent = shop.name;
        shopLink.addEventListener('click', (event) => {
            event.preventDefault();
            router.visit(shopsShow.url(shop.slug));
        });
        shopList.append(shopLink);
    });

    content.append(heading, count, shopList);

    return content;
}

export default function ShopZoneMap({ shops }: { shops: PublicShop[] }) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const markers = useMemo<ZoneMarker[]>(() => {
        const shopsByZone = new Map<string, PublicShop[]>();

        shops.forEach((shop) => {
            const existingShops = shopsByZone.get(shop.zone) ?? [];
            shopsByZone.set(shop.zone, [...existingShops, shop]);
        });

        return Array.from(shopsByZone, ([zone, zoneShops]) => ({
            zone,
            coordinates: coordinatesForZone(zone),
            shops: zoneShops,
        }));
    }, [shops]);

    useEffect(() => {
        if (!mapContainer.current || !markers.length) {
            return;
        }

        let isDisposed = false;
        let map: import('maplibre-gl').Map | undefined;

        void import('maplibre-gl').then((maplibregl) => {
            if (isDisposed || !mapContainer.current) {
                return;
            }

            const mapInstance = new maplibregl.Map({
                container: mapContainer.current,
                style: 'https://tiles.openfreemap.org/styles/bright',
                center: toLngLat(dakarCenter),
                zoom: 12,
            });
            map = mapInstance;

            mapInstance.addControl(
                new maplibregl.NavigationControl(),
                'top-right',
            );
            mapInstance.on('load', () => {
                const bounds = new maplibregl.LngLatBounds();

                markers.forEach((marker) => {
                    const markerElement = createMarkerElement(marker);
                    const popup = new maplibregl.Popup({
                        closeButton: true,
                        closeOnClick: true,
                        offset: 24,
                    }).setDOMContent(createPopupContent(marker));
                    const mapMarker = new maplibregl.Marker({
                        element: markerElement,
                        anchor: 'bottom',
                    })
                        .setLngLat(toLngLat(marker.coordinates))
                        .setPopup(popup)
                        .addTo(mapInstance);

                    markerElement.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            mapMarker.togglePopup();
                        }
                    });
                    bounds.extend(toLngLat(marker.coordinates));
                });

                if (markers.length === 1) {
                    mapInstance.jumpTo({
                        center: toLngLat(markers[0].coordinates),
                        zoom: 13,
                    });

                    return;
                }

                mapInstance.fitBounds(bounds, {
                    padding: 48,
                    maxZoom: 13,
                    duration: 0,
                });
            });
        });

        return () => {
            isDisposed = true;
            map?.remove();
        };
    }, [markers]);

    if (!markers.length) {
        return null;
    }

    return (
        <section className="border-b border-stone-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold tracking-[0.14em] text-amber-800 uppercase">
                            Disponible autour de vous
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
                            Retrouvez les boutiques par zone
                        </h2>
                        <p className="mt-2 max-w-2xl text-base leading-7 text-stone-700">
                            Touchez un marqueur pour voir les boutiques
                            disponibles dans cette zone de Dakar.
                        </p>
                    </div>
                    <Badge className="w-fit border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-50">
                        <MapPin className="size-4" aria-hidden="true" />
                        {markers.length} zone{markers.length > 1 ? 's' : ''}
                    </Badge>
                </div>
                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm">
                    <div
                        ref={mapContainer}
                        className="louma-map h-80 w-full sm:h-[26.25rem] lg:h-[30rem]"
                        role="region"
                        aria-label="Carte des boutiques Louma Guinard à Dakar"
                    />
                </div>
                <div
                    className="mt-4 flex flex-wrap gap-2"
                    aria-label="Zones disponibles"
                >
                    {markers.map((marker) => (
                        <span
                            key={marker.zone}
                            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700"
                        >
                            <Store
                                className="size-3.5 text-amber-700"
                                aria-hidden="true"
                            />
                            {marker.zone}
                            <span className="text-stone-500">
                                ({marker.shops.length})
                            </span>
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}
