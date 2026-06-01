import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PostService } from '../../../core/services/post.service';
import { Post } from '../../../core/models/post.model';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    @if (post()) {
      <article class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <a routerLink="/blog" class="inline-flex items-center gap-2 text-gray-500 hover:text-brand-orange mb-8 transition-colors">← Volver al blog</a>
        @if (post()!.cover_image) {
          <img [src]="post()!.cover_image" [alt]="post()!.title" class="w-full h-80 object-cover rounded-2xl mb-8">
        }
        <h1 class="text-4xl font-extrabold text-gray-900 mb-4">{{ post()!.title }}</h1>
        <div class="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-100">
          @if (post()!.author) {
            <span>Por {{ post()!.author!.name }}</span>
          }
          <span>{{ post()!.published_at | date:'d MMMM yyyy':'':'es' }}</span>
        </div>
        <div class="prose prose-lg max-w-none text-gray-700 leading-relaxed" [innerHTML]="post()!.body"></div>
      </article>
    }
  `,
})
export class PostDetailComponent implements OnInit {
  post = signal<Post | null>(null);

  constructor(private postService: PostService, private route: ActivatedRoute) {}

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.postService.getPost(id).subscribe(p => this.post.set(p));
  }
}
