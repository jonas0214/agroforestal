import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Post } from '../models/post.model';
import { PaginatedResponse } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class PostService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getPosts(page = 1) {
    return this.http.get<PaginatedResponse<Post>>(`${this.api}/posts?page=${page}`);
  }

  getPost(id: number) {
    return this.http.get<Post>(`${this.api}/posts/${id}`);
  }

  createPost(data: Partial<Post>) {
    return this.http.post<Post>(`${this.api}/admin/posts`, data);
  }

  updatePost(id: number, data: Partial<Post>) {
    return this.http.patch<Post>(`${this.api}/admin/posts/${id}`, data);
  }

  deletePost(id: number) {
    return this.http.delete(`${this.api}/admin/posts/${id}`);
  }
}
