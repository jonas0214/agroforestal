import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PostService } from '../../core/services/post.service';
import { Post } from '../../core/models/post.model';
import { PaginatedResponse } from '../../core/models/product.model';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './blog.component.html',
})
export class BlogComponent implements OnInit {
  posts = signal<Post[]>([]);
  pagination = signal<Partial<PaginatedResponse<any>>>({});
  loading = signal(true);
  currentPage = 1;

  constructor(private postService: PostService) {}

  ngOnInit() { this.loadPosts(); }

  loadPosts() {
    this.loading.set(true);
    this.postService.getPosts(this.currentPage).subscribe(res => {
      this.posts.set(res.data);
      this.pagination.set(res);
      this.loading.set(false);
    });
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
