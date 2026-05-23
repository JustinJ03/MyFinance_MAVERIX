<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(CategorySeeder::class);

        // Demo user for hackathon presentation
        User::firstOrCreate(
            ['email' => 'demo@myfinance.my'],
            [
                'name'     => 'Demo User',
                'password' => Hash::make('password'),
            ]
        );
    }
}
