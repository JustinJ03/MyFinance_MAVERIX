<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\BudgetPeriod;
use App\Services\BudgetService;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $today   = now()->toDateString();
        $budgets = $request->user()->budgets()
            ->where('is_active', true)
            ->with(['category', 'periods' => fn ($q) => $q
                ->where('period_start', '<=', $today)
                ->where('period_end', '>=', $today)
            ])
            ->get()
            ->map(function ($budget) {
                $period = $budget->periods->first();
                return array_merge($budget->toArray(), [
                    'current_period' => $period,
                    'percentage'     => $period?->percentage ?? 0,
                    'status'         => $period?->status ?? 'on_track',
                ]);
            });

        return $this->success($budgets);
    }

    public function overview(Request $request): JsonResponse
    {
        return $this->index($request);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category_id'  => 'required|exists:categories,id',
            'period_type'  => 'required|in:monthly,weekly',
            'amount_limit' => 'required|numeric|min:0.01',
            'rollover'     => 'boolean',
        ]);

        $budget = $request->user()->budgets()->create($data);

        // Create first budget period
        $this->createCurrentPeriod($budget);

        return $this->created($budget->load('category'), 'Budget created');
    }

    public function show(Request $request, Budget $budget): JsonResponse
    {
        $this->authorise($request, $budget);
        return $this->success($budget->load(['category', 'periods']));
    }

    public function update(Request $request, Budget $budget): JsonResponse
    {
        $this->authorise($request, $budget);

        $data = $request->validate([
            'amount_limit' => 'sometimes|numeric|min:0.01',
            'period_type'  => 'sometimes|in:monthly,weekly',
            'rollover'     => 'boolean',
        ]);

        $budget->update($data);

        if (isset($data['amount_limit'])) {
            $budget->currentPeriod()?->update(['amount_limit' => $data['amount_limit']]);
        }

        return $this->success($budget->fresh('category'), 'Budget updated');
    }

    public function destroy(Request $request, Budget $budget): JsonResponse
    {
        $this->authorise($request, $budget);
        $budget->delete();
        return $this->success(null, 'Budget deleted');
    }

    public function toggle(Request $request, Budget $budget): JsonResponse
    {
        $this->authorise($request, $budget);
        $budget->update(['is_active' => !$budget->is_active]);
        return $this->success($budget, 'Budget toggled');
    }

    public function history(Request $request, Budget $budget): JsonResponse
    {
        $this->authorise($request, $budget);
        $periods = $budget->periods()->orderByDesc('period_start')->get();
        return $this->success($periods);
    }

    private function createCurrentPeriod(Budget $budget): void
    {
        $now = Carbon::now();

        [$start, $end] = match ($budget->period_type) {
            'monthly' => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
            'weekly'  => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
        };

        BudgetPeriod::create([
            'budget_id'    => $budget->id,
            'period_start' => $start->toDateString(),
            'period_end'   => $end->toDateString(),
            'amount_limit' => $budget->amount_limit,
            'amount_spent' => 0,
        ]);
    }

    private function authorise(Request $request, Budget $budget): void
    {
        abort_if($budget->user_id !== $request->user()->id, 403, 'Forbidden');
    }
}
