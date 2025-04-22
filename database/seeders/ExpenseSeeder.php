<?php

namespace Database\Seeders;

use App\Models\Expense;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use Carbon\Carbon;

class ExpenseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();
        
        $expenseTitles = [
            'Office Supplies', 'Fuel', 'Equipment', 'Rent', 'Utilities',
            'Maintenance', 'Employee Salary', 'Marketing', 'Travel Expense',
            'Food and Beverages', 'Vehicle Maintenance', 'Software Subscription',
            'Internet Service', 'Phone Bills', 'Insurance', 'Training',
            'Consulting Fee', 'Shipping Cost', 'Raw Materials', 'Repair'
        ];

        // Start from January 2025
        $baseDate = Carbon::create(2025, 2, 1);
        
        // Create 500 unique expenses (in reverse order for ID, but forward in time)
        for ($i = 1; $i <= 500; $i++) {
            // Each expense is 2-5 hours newer than the previous one
            // This ensures unique timestamps that maintain chronology
            $hoursOffset = rand(2, 5);
            $baseDate = (clone $baseDate)->addHours($hoursOffset);
            
            // Add minutes/seconds variation for uniqueness
            $createdAt = (clone $baseDate)->addMinutes(rand(0, 59))->addSeconds(rand(0, 59));
            
            // Updated time is 1-15 minutes after creation
            $updatedAt = (clone $createdAt)->addMinutes(rand(1, 15));
            
            Expense::create([
                'user_id' => 2, // Fixed user ID to 2
                'title' => $faker->randomElement($expenseTitles),
                'description' => $faker->optional(0.7)->sentence(6),
                'amount' => $faker->randomFloat(2, 10, 5000),
                'date' => $createdAt->format('Y-m-d'),
                'created_at' => $createdAt,
                'updated_at' => $updatedAt,
            ]);
        }
    }
}
