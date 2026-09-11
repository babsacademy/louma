import { Link } from '@inertiajs/react';
import { divIcon } from 'leaflet';
import { MapPin, Store } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

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

function MapViewport({ markers }: { markers: ZoneMarker[] }) {
    const map = useMap();

    useEffect(() => {
        if (markers.length === 1) {
            map.setView(markers[0].coordinates, 13);

            return;
        }

        map.fitBounds(
            markers.map((marker) => marker.coordinates),
            {
                padding: [32, 32],
                maxZoom: 13,
            },
        );
    }, [map, markers]);

    return null;
}

function markerIcon(shopCount: number) {
    return divIcon({
        className: 'louma-map-marker',
        html: `<span>${shopCount}</span>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
    });
}

export default function ShopZoneMap({ shops }: { shops: PublicShop[] }) {
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
                    <MapContainer
                        center={dakarCenter}
                        zoom={12}
                        scrollWheelZoom={false}
                        className="h-80 w-full sm:h-[26.25rem] lg:h-[30rem]"
                        aria-label="Carte des boutiques Louma Guinard à Dakar"
                    >
                        <TileLayer
                            attribution={
                                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            }
                            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapViewport markers={markers} />
                        {markers.map((marker) => (
                            <Marker
                                key={marker.zone}
                                position={marker.coordinates}
                                icon={markerIcon(marker.shops.length)}
                                alt={`Boutiques disponibles à ${marker.zone}`}
                            >
                                <Popup>
                                    <div className="min-w-44 space-y-2 py-1">
                                        <p className="flex items-center gap-1.5 font-semibold text-stone-950">
                                            <MapPin className="size-4 text-amber-700" />
                                            {marker.zone}
                                        </p>
                                        <p className="text-xs text-stone-600">
                                            {marker.shops.length} boutique
                                            {marker.shops.length > 1
                                                ? 's'
                                                : ''}{' '}
                                            disponible
                                            {marker.shops.length > 1 ? 's' : ''}
                                        </p>
                                        <div className="grid gap-1.5">
                                            {marker.shops.map((shop) => (
                                                <Link
                                                    key={shop.id}
                                                    href={shopsShow.url(
                                                        shop.slug,
                                                    )}
                                                    className="rounded-md px-1 py-0.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-50 hover:text-amber-950"
                                                >
                                                    {shop.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
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
