# DBB Connect — Laravel REST API Backend

This is the dedicated Laravel 11/12 REST API backend for the **DBB Connect** field management desktop application (Vue + Electron).

## Tech Stack
- PHP 8.4
- Laravel 11/12
- Laravel Sanctum (Bearer token authentication)
- MySQL / MariaDB (or SQLite for lightweight local dev)

## Directory Overview
- `app/Http/Controllers/Api/`: REST controllers (`AuthController`, `DocumentController`, `FolderController`, `CommentController`, `ActivityController`, `UserController`)
- `app/Models/`: Eloquent models with relations (`User`, `Document`, `Folder`, `DocumentAssignment`, `DocumentComment`, `ActivityLog`)
- `app/Http/Resources/`: JSON API resources transforming database records to frontend TypeScript contracts
- `database/migrations/`: Database schema for users, personal access tokens, folders, documents, assignments, comments, and activities
- `database/seeders/`: Pre-seeded DBB official test accounts (`dmbbadmin`, `dbbadmin`, `Marc Louie Cabigas`, `Juan Dela Cruz`, `Pedro Santos`)
- `routes/api.php`: Sanctum-authenticated API routes
