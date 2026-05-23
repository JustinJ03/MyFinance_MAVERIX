<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecurringTemplate;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecurringTemplateController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $templates = $request->user()->recurringTemplates()
            ->with(['category', 'account'])
            ->orderBy('name')
            ->get();
        return $this->success($templates);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type'          => 'required|in:expense,income',
            'name'          => 'required|string|max:200',
            'default_amount'=> 'required|numeric|min:0.01',
            'category_id'   => 'nullable|exists:categories,id',
            'account_id'    => 'required|exists:bank_accounts,id',
            'frequency'     => 'required|in:daily,weekly,monthly,yearly',
            'scheduled_day' => 'nullable|integer|min:1|max:31',
            'next_due_date' => 'required|date',
            'start_date'    => 'required|date',
            'end_date'      => 'nullable|date|after:start_date',
            'remarks'       => 'nullable|string',
        ]);

        $template = $request->user()->recurringTemplates()->create($data);
        return $this->created($template->load(['category', 'account']), 'Recurring template created');
    }

    public function show(Request $request, RecurringTemplate $recurringTemplate): JsonResponse
    {
        $this->authorise($request, $recurringTemplate);
        return $this->success($recurringTemplate->load(['category', 'account']));
    }

    public function update(Request $request, RecurringTemplate $recurringTemplate): JsonResponse
    {
        $this->authorise($request, $recurringTemplate);

        $data = $request->validate([
            'name'           => 'sometimes|string|max:200',
            'default_amount' => 'sometimes|numeric|min:0.01',
            'category_id'    => 'nullable|exists:categories,id',
            'account_id'     => 'sometimes|exists:bank_accounts,id',
            'frequency'      => 'sometimes|in:daily,weekly,monthly,yearly',
            'scheduled_day'  => 'nullable|integer|min:1|max:31',
            'next_due_date'  => 'sometimes|date',
            'end_date'       => 'nullable|date',
            'remarks'        => 'nullable|string',
        ]);

        $recurringTemplate->update($data);
        return $this->success($recurringTemplate->fresh(['category', 'account']), 'Template updated');
    }

    public function pause(Request $request, RecurringTemplate $recurringTemplate): JsonResponse
    {
        $this->authorise($request, $recurringTemplate);
        $recurringTemplate->update(['status' => 'paused']);
        return $this->success($recurringTemplate, 'Template paused');
    }

    public function resume(Request $request, RecurringTemplate $recurringTemplate): JsonResponse
    {
        $this->authorise($request, $recurringTemplate);
        $recurringTemplate->update(['status' => 'active']);
        return $this->success($recurringTemplate, 'Template resumed');
    }

    public function destroy(Request $request, RecurringTemplate $recurringTemplate): JsonResponse
    {
        $this->authorise($request, $recurringTemplate);
        $recurringTemplate->update(['status' => 'ended']);
        return $this->success(null, 'Template ended');
    }

    private function authorise(Request $request, RecurringTemplate $template): void
    {
        abort_if($template->user_id !== $request->user()->id, 403, 'Forbidden');
    }
}
