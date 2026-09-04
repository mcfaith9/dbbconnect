<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'id' => 'admin-001',
                'username' => 'dmbbadmin',
                'display_name' => 'DMBB Administrator',
                'name' => 'DMBB Administrator',
                'email' => 'dmbbadmin@dbb.com',
                'password' => Hash::make('ilovedbb'),
                'role' => 'admin',
                'position' => 'Office Document Administrator',
                'department' => 'Executive Management & Operations',
                'phone' => '+63 917 111 2233',
                'assigned_project' => null,
            ],
            [
                'id' => 'admin-002',
                'username' => 'dbbadmin',
                'display_name' => 'DBB Administrator',
                'name' => 'DBB Administrator',
                'email' => 'dbbadmin@dbb.com',
                'password' => Hash::make('ilovedbb'),
                'role' => 'admin',
                'position' => 'Head Field Administrator',
                'department' => 'Field Management & Operations',
                'phone' => '+63 917 222 3344',
                'assigned_project' => null,
            ],
            [
                'id' => 'employee-001',
                'username' => 'Marc Louie Cabigas',
                'display_name' => 'Marc Louie Cabigas',
                'name' => 'Marc Louie Cabigas',
                'email' => 'marc.cabigas@dbb.com',
                'password' => Hash::make('ilovedbb'),
                'role' => 'employee',
                'position' => 'Lead Field Engineer',
                'department' => 'Naga Project Team',
                'phone' => '+63 918 100 2001',
                'assigned_project' => 'Naga Project Phase 2',
            ],
            [
                'id' => 'employee-002',
                'username' => 'Juan Dela Cruz',
                'display_name' => 'Juan Dela Cruz',
                'name' => 'Juan Dela Cruz',
                'email' => 'juan.delacruz@dbb.com',
                'password' => Hash::make('ilovedbb'),
                'role' => 'employee',
                'position' => 'Senior Field Engineer',
                'department' => 'Naga Project Team',
                'phone' => '+63 918 234 5678',
                'assigned_project' => 'Naga Project Phase 2',
            ],
            [
                'id' => 'employee-003',
                'username' => 'Pedro Santos',
                'display_name' => 'Pedro Santos',
                'name' => 'Pedro Santos',
                'email' => 'pedro.santos@dbb.com',
                'password' => Hash::make('ilovedbb'),
                'role' => 'employee',
                'position' => 'Site Safety Officer',
                'department' => 'Cebu Commercial Port',
                'phone' => '+63 920 345 6789',
                'assigned_project' => 'Cebu Project',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['id' => $userData['id']],
                $userData
            );
        }
    }
}
