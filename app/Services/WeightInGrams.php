<?php

namespace App\Services;

final class WeightInGrams
{
    /**
     * Convert a validated kilogram value to its integer gram representation.
     */
    public static function fromKilograms(string $kilograms): int
    {
        [$wholeKilograms, $decimalGrams] = array_pad(
            explode('.', trim($kilograms), 2),
            2,
            '',
        );

        return ((int) $wholeKilograms * 1000) + (int) str_pad($decimalGrams, 3, '0');
    }
}
