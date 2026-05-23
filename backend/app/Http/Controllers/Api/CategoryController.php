<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Category::where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', $user->id));

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        return $this->success($query->with('children')->orderBy('name')->get());
    }

    public function parents(Request $request): JsonResponse
    {
        $user = $request->user();
        $categories = Category::whereNull('parent_id')
            ->where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', $user->id))
            ->with('children')
            ->orderBy('name')
            ->get();

        return $this->success($categories);
    }

    public function children(Request $request, Category $category): JsonResponse
    {
        $user = $request->user();
        $children = $category->children()
            ->where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', $user->id))
            ->get();

        return $this->success($children);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'parent_id' => 'required|exists:categories,id',
            'name'      => 'required|string|max:100',
            'type'      => 'required|in:expense,income',
        ]);

        $category = $request->user()->categories()->create([
            ...$data,
            'is_system' => false,
        ]);

        return $this->created($category, 'Category created');
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        abort_if($category->user_id !== $request->user()->id || $category->is_system, 403);

        $data = $request->validate(['name' => 'required|string|max:100']);
        $category->update($data);

        return $this->success($category, 'Category updated');
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        abort_if($category->user_id !== $request->user()->id || $category->is_system, 403);
        $category->delete();

        return $this->success(null, 'Category deleted');
    }
}
