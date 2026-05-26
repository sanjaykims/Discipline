export interface Habit {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
}

export interface Completion {
  id: string;
  habit_id: string;
  completed_date: string;
  created_at: string;
}
