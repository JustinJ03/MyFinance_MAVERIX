<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Services\BankAccountService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BankAccountController extends Controller
{
    use ApiResponse;

    public function __construct(private BankAccountService $service) {}

    public function index(Request $request): JsonResponse
    {
        $accounts = $this->service->listActive($request->user());
        return $this->success($accounts);
    }

    public function archived(Request $request): JsonResponse
    {
        $accounts = $this->service->listArchived($request->user());
        return $this->success($accounts);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nickname'         => 'required|string|max:100',
            'bank_name'        => 'required|string|max:100',
            'account_type'     => 'required|in:savings,current,credit_card,e_wallet,digital_bank',
            'last_four_digits' => 'nullable|digits:4',
            'initial_balance'  => 'required|numeric|min:0',
            'color'            => 'nullable|string|max:7',
            'hide_balance'     => 'boolean',
        ]);

        $account = $this->service->create($request->user(), $data);
        return $this->created($account, 'Account created');
    }

    public function show(Request $request, BankAccount $account): JsonResponse
    {
        $this->authorise($request, $account);
        return $this->success($account);
    }

    public function update(Request $request, BankAccount $account): JsonResponse
    {
        $this->authorise($request, $account);

        $data = $request->validate([
            'nickname'         => 'sometimes|string|max:100',
            'bank_name'        => 'sometimes|string|max:100',
            'account_type'     => 'sometimes|in:savings,current,credit_card,e_wallet,digital_bank',
            'last_four_digits' => 'nullable|digits:4',
            'color'            => 'nullable|string|max:7',
            'hide_balance'     => 'boolean',
        ]);

        $account = $this->service->update($account, $data);
        return $this->success($account, 'Account updated');
    }

    public function archive(Request $request, BankAccount $account): JsonResponse
    {
        $this->authorise($request, $account);
        $account = $this->service->archive($account);
        return $this->success($account, 'Account archived');
    }

    public function restore(Request $request, BankAccount $account): JsonResponse
    {
        $this->authorise($request, $account);
        $account = $this->service->restore($account);
        return $this->success($account, 'Account restored');
    }

    public function transactions(Request $request, BankAccount $account): JsonResponse
    {
        $this->authorise($request, $account);

        $txs = $account->transactions()
            ->with(['category.parent'])
            ->orderByDesc('actual_date')
            ->paginate(20);

        return $this->paginated($txs);
    }

    private function authorise(Request $request, BankAccount $account): void
    {
        abort_if($account->user_id !== $request->user()->id, 403, 'Forbidden');
    }
}
