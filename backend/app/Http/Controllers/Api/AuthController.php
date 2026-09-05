<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Authenticate user and issue Sanctum token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $loginInput = trim($request->input('username'));
        $password = trim($request->input('password'));

        // Match by username, email, display_name or name
        $user = User::where('username', $loginInput)
            ->orWhere('email', $loginInput)
            ->orWhere('display_name', $loginInput)
            ->orWhere('name', $loginInput)
            ->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid username or password.',
            ], 401);
        }

        // Generate Sanctum Personal Access Token
        $token = $user->createToken('dbbconnect-session')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Register a new field personnel account.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $id = 'employee-' . time() . '-' . Str::random(4);
        $name = trim($request->input('name'));
        $email = strtolower(trim($request->input('email')));
        $password = $request->filled('password') 
            ? Hash::make($request->input('password')) 
            : Hash::make('ilovedbb');

        // Ensure username is unique in database
        $username = $name;
        $counter = 1;
        while (User::where('username', $username)->exists()) {
            $username = $name . ' ' . $counter;
            $counter++;
        }

        $user = User::create([
            'id' => $id,
            'username' => $username,
            'name' => $name,
            'display_name' => $name,
            'email' => $email,
            'password' => $password,
            'role' => 'employee', // strictly employee for registrations
            'position' => $request->input('position', 'Field Engineer'),
            'department' => $request->input('department', 'Field Operations'),
            'phone' => $request->input('phone'),
            'assigned_project' => $request->input('assigned_project'),
        ]);

        $token = $user->createToken('dbbconnect-session')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => new UserResource($user),
        ], 201);
    }

    /**
     * Get the authenticated user's profile.
     */
    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'user' => new UserResource($request->user()),
        ]);
    }

    /**
     * Revoke current Sanctum token (Logout).
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Successfully logged out.',
        ]);
    }

    /**
     * Return configured test demo accounts.
     */
    public function testAccounts(): JsonResponse
    {
        $users = User::all();
        return response()->json([
            'success' => true,
            'data' => UserResource::collection($users),
        ]);
    }
}
