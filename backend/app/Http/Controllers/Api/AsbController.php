<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AsbDividend;
use App\Models\AsbFund;
use App\Models\AsbTransaction;
use App\Services\AsbService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AsbController extends Controller
{
    use ApiResponse;

    public function __construct(private AsbService $service) {}

    // --- Funds ---

    public function index(Request $request): JsonResponse
    {
        $funds = $request->user()->asbFunds()->with(['dividends' => fn ($q) => $q->latest('year')->limit(1)])->get();
        return $this->success($funds);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fund_name'  => 'required|in:ASB,ASB2,ASM,ASM2_Wawasan,ASM3',
            'units_held' => 'nullable|numeric|min:0',
        ]);

        $unitCeiling = AsbFund::UNIT_CEILINGS[$data['fund_name']] ?? 200000;
        $fund = $request->user()->asbFunds()->create([
            'fund_name'   => $data['fund_name'],
            'units_held'  => $data['units_held'] ?? 0,
            'unit_ceiling'=> $unitCeiling,
        ]);

        return $this->created($fund, 'ASB fund registered');
    }

    public function showFund(Request $request, AsbFund $asbFund): JsonResponse
    {
        $this->authoriseFund($request, $asbFund);
        return $this->success($asbFund->load(['transactions', 'dividends']));
    }

    public function destroyFund(Request $request, AsbFund $asbFund): JsonResponse
    {
        $this->authoriseFund($request, $asbFund);
        $asbFund->delete();
        return $this->success(null, 'Fund removed');
    }

    // --- Transactions ---

    public function transactions(Request $request, AsbFund $asbFund): JsonResponse
    {
        $this->authoriseFund($request, $asbFund);
        return $this->success($asbFund->transactions()->orderByDesc('date')->get());
    }

    public function storeTransaction(Request $request, AsbFund $asbFund): JsonResponse
    {
        $this->authoriseFund($request, $asbFund);

        $data = $request->validate([
            'transaction_type' => 'required|in:deposit,withdrawal',
            'date'             => 'required|date',
            'amount'           => 'required|numeric|min:0.01',
            'remarks'          => 'nullable|string',
        ]);

        $tx = $data['transaction_type'] === 'deposit'
            ? $this->service->addDeposit($asbFund, $data)
            : $this->service->addWithdrawal($asbFund, $data);

        return $this->created($tx, 'Transaction recorded');
    }

    public function destroyTransaction(Request $request, AsbFund $asbFund, AsbTransaction $asbTransaction): JsonResponse
    {
        $this->authoriseFund($request, $asbFund);
        $this->service->deleteTransaction($asbTransaction);
        return $this->success(null, 'Transaction deleted');
    }

    // --- Dividends ---

    public function dividends(Request $request, AsbFund $asbFund): JsonResponse
    {
        $this->authoriseFund($request, $asbFund);
        return $this->success($asbFund->dividends()->orderByDesc('year')->get());
    }

    public function storeDividend(Request $request, AsbFund $asbFund): JsonResponse
    {
        $this->authoriseFund($request, $asbFund);

        $data = $request->validate([
            'year'           => 'required|integer|min:2000|max:2099',
            'dividend_rate'  => 'required|numeric|min:0|max:100',
            'dividend_amount'=> 'required|numeric|min:0',
            'bonus_rate'     => 'nullable|numeric|min:0|max:100',
            'bonus_amount'   => 'nullable|numeric|min:0',
            'total_payout'   => 'nullable|numeric|min:0',
        ]);

        // Derive total_payout if not sent
        $data['total_payout'] ??= ($data['dividend_amount'] + ($data['bonus_amount'] ?? 0));

        $dividend = $this->service->addDividend($asbFund, $data);
        return $this->created($dividend, 'Dividend recorded');
    }

    public function destroyDividend(Request $request, AsbFund $asbFund, AsbDividend $asbDividend): JsonResponse
    {
        $this->authoriseFund($request, $asbFund);
        $asbFund->decrement('units_held', $asbDividend->total_payout);
        $asbDividend->delete();
        return $this->success(null, 'Dividend deleted');
    }

    // --- Analytics & Calculator ---

    public function analytics(Request $request, AsbFund $asbFund): JsonResponse
    {
        $this->authoriseFund($request, $asbFund);

        $txHistory = $asbFund->transactions()->orderBy('date')->get()->map(function ($tx) use (&$running) {
            static $running = 0;
            $running += $tx->transaction_type === 'deposit' ? $tx->amount : -$tx->amount;
            return ['date' => $tx->date->format('d/m/Y'), 'balance' => round($running, 2)];
        });

        return $this->success([
            'balance_over_time' => $txHistory,
            'dividends'         => $asbFund->dividends()->orderBy('year')->get(),
        ]);
    }

    public function calculator(Request $request, AsbFund $asbFund): JsonResponse
    {
        $this->authoriseFund($request, $asbFund);

        $params = $request->validate([
            'monthly_top_up' => 'nullable|numeric|min:0',
            'annual_rate'    => 'nullable|numeric|min:0|max:1',
            'years'          => 'nullable|integer|min:1|max:50',
        ]);

        return $this->success($this->service->growthProjection($asbFund, $params));
    }

    private function authoriseFund(Request $request, AsbFund $fund): void
    {
        abort_if($fund->user_id !== $request->user()->id, 403, 'Forbidden');
    }
}
