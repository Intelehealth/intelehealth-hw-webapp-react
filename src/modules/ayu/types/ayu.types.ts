export interface AyuQuestion {
  id: string;
  title: string;
  input_type: 'text' | 'select' | 'radio';
  placeholder?: string;
  options?: string[];
}

export interface AyuSchema {
  questions: AyuQuestion[];
}
