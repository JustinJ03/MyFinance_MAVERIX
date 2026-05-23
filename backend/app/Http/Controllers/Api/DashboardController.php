<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(private DashboardService $service) {}

    public function index(Request $request): JsonResponse
    {
        return $this->success($this->service->fullDashboard($request->user()));
    }

    public function netWorth(Request $request): JsonResponse
    {
        return $this->success($this->service->netWorth($request->user()));
    }

    public function cashflow(Request $request): JsonResponse
    {
        return $this->success($this->service->cashflowChart($request->user()));
    }

    public function spendingBreakdown(Request $request): JsonResponse
    {
        return $this->success($this->service->spendingBreakdown($request->user()));
    }
}
