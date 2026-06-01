export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  cover_image?: string;
  author?: { id: number; name: string; avatar?: string };
  status: 'draft' | 'published';
  published_at?: string;
  created_at: string;
}
