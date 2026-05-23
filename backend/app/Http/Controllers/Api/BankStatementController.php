<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\BankStatement;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BankStatementController extends Controller
{
    use ApiResponse;

    public function index(Request $request, BankAccount $account): JsonResponse
    {
        $this->authorise($request, $account);
        $statements = $account->statements()->orderByDesc('created_at')->get();
        return $this->success($statements);
    }

    public function store(Request $request, BankAccount $account): JsonResponse
    {
        $this->authorise($request, $account);

        $data = $request->validate([
            'statement'    => 'required|file|mimes:pdf,jpg,jpeg,png|max:20480',
            'period_label' => 'nullable|string|max:50',
        ]);

        $file      = $request->file('statement');
        $path      = $file->store("statements/{$request->user()->id}/{$account->id}", 'local');
        $fileName  = $file->getClientOriginalName();
        $fileSize  = $file->getSize();

        $statement = BankStatement::create([
            'bank_account_id' => $account->id,
            'user_id'         => $request->user()->id,
            'file_name'       => $fileName,
            'file_path'       => $path,
            'period_label'    => $data['period_label'] ?? null,
            'file_size'       => $fileSize,
        ]);

        return $this->created($statement, 'Bank statement uploaded');
    }

    public function download(Request $request, BankAccount $account, BankStatement $statement)
    {
        $this->authorise($request, $account);
        abort_if($statement->bank_account_id !== $account->id, 404);
        abort_if(!Storage::disk('local')->exists($statement->file_path), 404, 'File not found');
        return Storage::disk('local')->response($statement->file_path, $statement->file_name);
    }

    public function destroy(Request $request, BankAccount $account, BankStatement $statement): JsonResponse
    {
        $this->authorise($request, $account);
        abort_if($statement->bank_account_id !== $account->id, 404);

        Storage::disk('local')->delete($statement->file_path);
        $statement->delete();

        return $this->success(null, 'Bank statement deleted');
    }

    private function authorise(Request $request, BankAccount $account): void
    {
        abort_if($account->user_id !== $request->user()->id, 403, 'Forbidden');
    }
}
