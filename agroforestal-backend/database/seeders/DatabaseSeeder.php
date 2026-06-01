<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Brand;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->create([
            'name'     => 'Admin Agroforestal',
            'email'    => 'admin@agroforestal.com',
            'password' => Hash::make('Admin@1234'),
            'role'     => 'admin',
        ]);

        $brands = ['STIHL', 'Honda', 'Husqvarna', 'Kawasaki', 'Briggs & Stratton'];
        foreach ($brands as $b) {
            Brand::create(['name' => $b, 'slug' => \Illuminate\Support\Str::slug($b)]);
        }

        $categories = ['Motosierras', 'Guadañas', 'Sopladoras', 'Podadoras', 'Repuestos', 'Accesorios', 'Maquinaria pesada'];
        foreach ($categories as $c) {
            Category::create(['name' => $c, 'slug' => \Illuminate\Support\Str::slug($c)]);
        }
    }
}
// This is already at the end, just add after brand/category seeding
