<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Services\TransactionService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    use ApiResponse;

    public function __construct(private TransactionService $service) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['type', 'account_id', 'category_id', 'status', 'from', 'to']);
        $paginator = $this->service->paginate($request->user(), $filters);
        return $this->paginated($paginator);
    }

    public function pending(Request $request): JsonResponse
    {
        $txs = $request->user()->transactions()
            ->with(['category.parent', 'account', 'recurringTemplate'])
            ->where('status', 'pending')
            ->orderBy('scheduled_date')
            ->get();
        return $this->success($txs);
    }

    public function summary(Request $request): JsonResponse
    {
        $year  = (int) ($request->year  ?? now()->year);
        $month = (int) ($request->month ?? now()->month);
        return $this->success($this->service->monthlySummary($request->user(), $year, $month));
    }

    public function show(Request $request, Transaction $transaction): JsonResponse
    {
        $this->authorise($request, $transaction);
        return $this->success($transaction->load(['category.parent', 'account', 'toAccount']));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type'                  => 'required|in:expense,income,transfer',
            'name'                  => 'required|string|max:200',
            'amount'                => 'required|numeric|min:0.01',
            'category_id'           => 'nullable|exists:categories,id',
            'account_id'            => 'required|exists:bank_accounts,id',
            'to_account_id'         => 'nullable|exists:bank_accounts,id',
            'recurring_template_id' => 'nullable|exists:recurring_templates,id',
            'asb_fund_id'           => 'nullable|exists:asb_funds,id',
            'actual_date'           => 'required|date',
            'status'                => 'in:pending,confirmed',
            'remarks'               => 'nullable|string',
            'epf_account_number'    => 'nullable|in:1,2,3',
        ]);

        $data['user_id'] = $request->user()->id;
        $data['status']  = $data['status'] ?? 'confirmed';

        $transaction = $this->service->create($request->user(), $data);
        return $this->created($transaction, 'Transaction created');
    }

    public function update(Request $request, Transaction $transaction): JsonResponse
    {
        $this->authorise($request, $transaction);

        $data = $request->validate([
            'name'               => 'sometimes|string|max:200',
            'amount'             => 'sometimes|numeric|min:0.01',
            'category_id'        => 'nullable|exists:categories,id',
            'account_id'         => 'sometimes|exists:bank_accounts,id',
            'actual_date'        => 'sometimes|date',
            'remarks'            => 'nullable|string',
            'epf_account_number' => 'nullable|in:1,2,3',
            'asb_fund_id'        => 'nullable|exists:asb_funds,id',
        ]);

        $transaction = $this->service->update($transaction, $data);
        return $this->success($transaction, 'Transaction updated');
    }

    public function destroy(Request $request, Transaction $transaction): JsonResponse
    {
        $this->authorise($request, $transaction);
        $this->service->delete($transaction);
        return $this->success(null, 'Transaction deleted');
    }

    public function confirm(Request $request, Transaction $transaction): JsonResponse
    {
        $this->authorise($request, $transaction);

        $data = $request->validate([
            'actual_date' => 'sometimes|date',
            'amount'      => 'sometimes|numeric|min:0.01',
            'account_id'  => 'sometimes|exists:bank_accounts,id',
        ]);

        if (!empty($data)) {
            $transaction->update($data);
        }

        $transaction = $this->service->confirm($transaction->fresh());
        return $this->success($transaction, 'Transaction confirmed');
    }

    public function skip(Request $request, Transaction $transaction): JsonResponse
    {
        $this->authorise($request, $transaction);
        $transaction = $this->service->skip($transaction);
        return $this->success($transaction, 'Transaction skipped');
    }

    private function authorise(Request $request, Transaction $transaction): void
    {
        abort_if($transaction->user_id !== $request->user()->id, 403, 'Forbidden');
    }
}
