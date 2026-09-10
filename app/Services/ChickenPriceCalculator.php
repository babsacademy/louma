<?php

namespace App\Services;

class ChickenPriceCalculator
{
    public const THRESHOLD_GRAMS = 2000;

    public const PRICE_BELOW_THRESHOLD = 2900;

    public const PRICE_EQUAL_OR_ABOVE_THRESHOLD = 3250;

    public const COMMISSION_PER_UNIT = 400;

    /**
     * Calcule le prix unitaire d'un poulet en FCFA selon le poids moyen en grammes.
     */
    public static function calculateUnitPrice(int $weightInGrams): int
    {
        return $weightInGrams < self::THRESHOLD_GRAMS
            ? self::PRICE_BELOW_THRESHOLD
            : self::PRICE_EQUAL_OR_ABOVE_THRESHOLD;
    }
}
