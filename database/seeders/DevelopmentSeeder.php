<?php

namespace Database\Seeders;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DevelopmentSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::factory()->admin()->create([
            'name' => 'Admin Louma',
            'email' => 'admin@loumaguinar.sn',
        ]);

        $seller1 = User::factory()->seller()->create([
            'name' => 'Moussa Diop',
            'email' => 'moussa@loumaguinar.sn',
            'created_by' => $admin->id,
        ]);

        $seller2 = User::factory()->seller()->create([
            'name' => 'Awa Ndiaye',
            'email' => 'awa@loumaguinar.sn',
            'created_by' => $admin->id,
        ]);

        Shop::factory()->create([
            'seller_id' => $seller1->id,
            'name' => 'Élevage Teranga Almadies',
            'slug' => 'elevage-teranga-almadies',
            'zone' => 'Almadies',
            'stock_quantity' => 45,
            'average_weight' => 2150,
            'active' => true,
        ]);

        Shop::factory()->create([
            'seller_id' => $seller1->id,
            'name' => 'Poulets Bio Yoff',
            'slug' => 'poulets-bio-yoff',
            'zone' => 'Yoff',
            'stock_quantity' => 20,
            'average_weight' => 1950,
            'active' => true,
        ]);

        Shop::factory()->create([
            'seller_id' => $seller2->id,
            'name' => 'Ferme Baobab Plateau',
            'slug' => 'ferme-baobab-plateau',
            'zone' => 'Plateau',
            'stock_quantity' => 60,
            'average_weight' => 2300,
            'active' => true,
        ]);
    }
}
