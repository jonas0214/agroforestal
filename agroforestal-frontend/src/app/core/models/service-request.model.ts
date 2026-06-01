export interface ServiceRequest {
  id: number;
  user_id?: number;
  name: string;
  email: string;
  phone?: string;
  equipment_brand?: string;
  equipment_model?: string;
  problem_description: string;
  service_type: 'maintenance' | 'repair' | 'diagnosis' | 'other';
  status: 'pending' | 'in_review' | 'in_progress' | 'completed' | 'cancelled';
  admin_notes?: string;
  created_at: string;
}

export interface Quote {
  id: number;
  user_id?: number;
  name: string;
  email: string;
  phone?: string;
  items: { product_id: number; quantity: number; product?: any }[];
  notes?: string;
  status: 'pending' | 'reviewed' | 'sent' | 'accepted' | 'rejected';
  created_at: string;
}
