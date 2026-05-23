<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EpfTransaction;
use App\Services\EpfService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EpfController extends Controller
{
    use ApiResponse;

    public function __construct(private EpfService $service) {}

    public function overview(Request $request): JsonResponse
    {
        return $this->success($this->service->overview($request->user()));
    }

    public function transactions(Request $request): JsonResponse
    {
        $query = $request->user()->epfTransactions()->orderByDesc('date');

        if ($request->has('account')) {
            $query->where('epf_account_number', $request->account);
        }
        if ($request->has('type')) {
            $query->where('transaction_type', $request->type);
        }

        return $this->success($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'transaction_type'  => 'required|in:contribution,withdrawal,dividend',
            'contribution_type' => 'nullable|in:mandatory,voluntary',
            'epf_account_number'=> 'required_unless:transaction_type,contribution|in:1,2,3',
            'date'              => 'required|date',
            'employee_amount'   => 'nullable|numeric|min:0',
            'employer_amount'   => 'nullable|numeric|min:0',
            'total_amount'      => 'required_unless:contribution_type,mandatory|numeric|min:0',
            'remarks'           => 'nullable|string',
        ]);

        if ($data['transaction_type'] === 'contribution' && ($data['contribution_type'] ?? null) === 'mandatory') {
            $txs = $this->service->createMandatoryContribution($request->user(), $data);
            return $this->created($txs, 'Mandatory contribution recorded (split across accounts 1/2/3)');
        }

        $data['user_id'] = $request->user()->id;
        $tx = EpfTransaction::create($data);
        return $this->created($tx, 'EPF transaction recorded');
    }

    public function update(Request $request, EpfTransaction $epfTransaction): JsonResponse
    {
        abort_if($epfTransaction->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'date'              => 'sometimes|date',
            'employee_amount'   => 'sometimes|numeric|min:0',
            'employer_amount'   => 'sometimes|numeric|min:0',
            'total_amount'      => 'sometimes|numeric|min:0',
            'remarks'           => 'nullable|string',
        ]);

        $epfTransaction->update($data);
        return $this->success($epfTransaction, 'EPF transaction updated');
    }

    public function destroy(Request $request, EpfTransaction $epfTransaction): JsonResponse
    {
        abort_if($epfTransaction->user_id !== $request->user()->id, 403);
        $epfTransaction->delete();
        return $this->success(null, 'EPF transaction deleted');
    }

    public function analytics(Request $request): JsonResponse
    {
        $user = $request->user();

        $contributions = $user->epfTransactions()
            ->where('transaction_type', 'contribution')
            ->orderBy('date')
            ->get();

        $byMonth = $contributions->groupBy(function ($tx) {
            return $tx->date->format('Y-m');
        })->flatMap(function ($monthGroup, $month) {
            return $monthGroup->groupBy('epf_account_number')->map(function ($accGroup, $accNum) use ($month) {
                return [
                    'month'              => $month,
                    'epf_account_number' => (int) $accNum,
                    'total'              => (float) $accGroup->sum('total_amount'),
                ];
            })->values();
        })->sortBy('month')->values();

        return $this->success(['monthly_contributions' => $byMonth]);
    }

    public function retirementCalculator(Request $request): JsonResponse
    {
        $params = $request->validate([
            'current_balance'      => 'required|numeric|min:0',
            'monthly_contribution' => 'required|numeric|min:0',
            'current_age'          => 'required|integer|min:18|max:70',
            'retirement_age'       => 'nullable|integer|min:50|max:80',
            'annual_rate'          => 'nullable|numeric|min:0|max:0.2',
        ]);

        return $this->success($this->service->retirementProjection($params));
    }

    public function sustainabilityCalculator(Request $request): JsonResponse
    {
        $params = $request->validate([
            'account3_balance'  => 'required|numeric|min:0',
            'monthly_withdrawal'=> 'required|numeric|min:0',
        ]);

        return $this->success($this->service->withdrawalSustainability($params));
    }

    public function comfortCalculator(Request $request): JsonResponse
    {
        $params = $request->validate([
            'projected_balance' => 'required|numeric|min:0',
            'monthly_expenses'  => 'required|numeric|min:0',
            'annual_rate'       => 'nullable|numeric|min:0|max:0.2',
        ]);

        return $this->success($this->service->retirementComfort($params));
    }
}
