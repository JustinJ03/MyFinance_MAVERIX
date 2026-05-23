export interface Category {
  id: number;
  user_id: number | null;
  parent_id: number | null;
  name: string;
  type: 'expense' | 'income';
  is_system: boolean;
  children?: Category[];
  created_at: string;
  updated_at: string;
}

export interface StoreCategoryPayload {
  parent_id: number;
  name: string;
  type: 'expense' | 'income';
}
