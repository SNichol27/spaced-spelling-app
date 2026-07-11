export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Class {
  id: string;
  user_id: string;
  name: string;
  weeks: number;
  created_at: string;
}

export interface SpellingList {
  id: string;
  class_id: string;
  words: string[];
  week_introduced: number;
  created_at: string;
}

export interface ReviewSchedule {
  id: string;
  spelling_list_id: string;
  review_week: number;
  status: 'pending' | 'completed';
}
