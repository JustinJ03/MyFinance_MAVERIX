<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(private AuthService $authService) {}

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'                  => 'required|string|max:100',
            'email'                 => 'required|email|unique:users,email',
            'password'              => ['required', 'confirmed', Password::min(8)],
        ]);

        $result = $this->authService->register($data);

        return $this->created([
            'user'  => $result['user'],
            'token' => $result['token'],
        ], 'Registration successful');
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
            'remember' => 'boolean',
        ]);

        $result = $this->authService->login($data);

        return $this->success([
            'user'  => $result['user'],
            'token' => $result['token'],
        ], 'Login successful');
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());
        return $this->success(null, 'Logged out successfully');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->success($request->user());
    }

    public function updateMe(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'sometimes|string|max:100',
            'password'     => ['sometimes', 'confirmed', Password::min(8)],
        ]);

        $user = $this->authService->updateProfile($request->user(), $data);
        return $this->success($user, 'Profile updated');
    }
}
