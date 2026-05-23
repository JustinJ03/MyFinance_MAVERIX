<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $expenseParents = [
            'Food'                => ['Groceries', 'Dining Out', 'Coffee & Drinks'],
            'Transport'           => ['Fuel', 'Toll', 'Parking', 'Public Transport', 'Ride Hailing'],
            'Bills & Utilities'   => ['Electricity', 'Water', 'Internet', 'Phone', 'Streaming'],
            'Shopping'            => ['Clothing', 'Electronics', 'Household'],
            'Health'              => ['Medical', 'Pharmacy', 'Fitness'],
            'Entertainment'       => ['Events', 'Hobbies', 'Games'],
            'Education'           => ['Tuition', 'Books', 'Courses'],
            'Personal Care'       => ['Grooming', 'Wellness'],
            'Travel'              => ['Accommodation', 'Flights', 'Activities'],
            'Investment/Savings'  => ['EPF (Voluntary)', 'ASB', 'Unit Trust', 'Others'],
            'Others'              => ['Miscellaneous'],
        ];

        $incomeParents = [
            'Income' => ['Salary', 'Bonus', 'Freelance', 'Business', 'Investment Returns', 'Rental', 'Side Income', 'Others'],
        ];

        foreach ($expenseParents as $parent => $children) {
            $parentId = DB::table('categories')->insertGetId([
                'user_id'    => null,
                'parent_id'  => null,
                'name'       => $parent,
                'type'       => 'expense',
                'is_system'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($children as $child) {
                DB::table('categories')->insert([
                    'user_id'    => null,
                    'parent_id'  => $parentId,
                    'name'       => $child,
                    'type'       => 'expense',
                    'is_system'  => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        foreach ($incomeParents as $parent => $children) {
            $parentId = DB::table('categories')->insertGetId([
                'user_id'    => null,
                'parent_id'  => null,
                'name'       => $parent,
                'type'       => 'income',
                'is_system'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($children as $child) {
                DB::table('categories')->insert([
                    'user_id'    => null,
                    'parent_id'  => $parentId,
                    'name'       => $child,
                    'type'       => 'income',
                    'is_system'  => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
