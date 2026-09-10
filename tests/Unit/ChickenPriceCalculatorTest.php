<?php

use App\Services\ChickenPriceCalculator;

test('chicken price is 2900 FCFA when weight is strictly below 2000 grams', function () {
    expect(ChickenPriceCalculator::calculateUnitPrice(1999))->toBe(2900);
    expect(ChickenPriceCalculator::calculateUnitPrice(1800))->toBe(2900);
    expect(ChickenPriceCalculator::calculateUnitPrice(1500))->toBe(2900);
});

test('chicken price is 3250 FCFA when weight is exactly 2000 grams or above', function () {
    expect(ChickenPriceCalculator::calculateUnitPrice(2000))->toBe(3250);
    expect(ChickenPriceCalculator::calculateUnitPrice(2100))->toBe(3250);
    expect(ChickenPriceCalculator::calculateUnitPrice(2500))->toBe(3250);
});
