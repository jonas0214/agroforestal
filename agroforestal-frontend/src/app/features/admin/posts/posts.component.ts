import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PostService } from '../../../core/services/post.service';
import { Post } from '../../../core/models/post.model';

@Component({
  selector: 'app-admin-posts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Blog</h1>
        <button (click)="openCreate()" class="btn-primary">+ Nueva entrada</button>
      </div>

      @if (showForm()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8">
            <h2 class="text-xl font-bold mb-6">{{ editingId() ? 'Editar' : 'Nueva' }} entrada</h2>
            <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input formControlName="title" type="text" class="input">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Resumen</label>
                <textarea formControlName="excerpt" rows="2" class="input resize-none"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Contenido *</label>
                <textarea formControlName="body" rows="8" class="input resize-none"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select formControlName="status" class="input">
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                </select>
              </div>
              <div class="flex gap-3 pt-2">
                <button type="submit" [disabled]="loading()" class="btn-primary flex-1 justify-center">{{ loading() ? 'Guardando...' : 'Guardar' }}</button>
                <button type="button" (click)="showForm.set(false)" class="btn-outline flex-1 text-center">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      }

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left px-6 py-3 text-gray-500 font-semibold">Título</th>
              <th class="text-left px-6 py-3 text-gray-500 font-semibold">Estado</th>
              <th class="text-left px-6 py-3 text-gray-500 font-semibold">Publicado</th>
              <th class="text-right px-6 py-3 text-gray-500 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (post of posts(); track post.id) {
              <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 font-medium text-gray-900">{{ post.title }}</td>
                <td class="px-6 py-4">
                  <span [class]="post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'" class="badge-status">
                    {{ post.status === 'published' ? 'Publicado' : 'Borrador' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-gray-500">{{ post.published_at | date:'dd/MM/yyyy' }}</td>
                <td class="px-6 py-4 text-right space-x-2">
                  <button (click)="openEdit(post)" class="text-brand-orange hover:underline text-xs font-semibold">Editar</button>
                  <button (click)="delete(post.id)" class="text-red-500 hover:underline text-xs font-semibold">Eliminar</button>
                </td>
              </tr>
            }
            @if (posts().length === 0) {
              <tr><td colspan="4" class="px-6 py-12 text-center text-gray-400">No hay entradas aún</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class PostsComponent implements OnInit {
  private postService = inject(PostService);
  private fb = inject(FormBuilder);

  posts = signal<Post[]>([]);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  loading = signal(false);

  form = this.fb.group({
    title:   ['', Validators.required],
    excerpt: [''],
    body:    ['', Validators.required],
    status:  ['draft'],
  });

  ngOnInit() { this.load(); }

  load() { this.postService.getPosts(1).subscribe(res => this.posts.set(res.data)); }

  openCreate() { this.editingId.set(null); this.form.reset({ status: 'draft' }); this.showForm.set(true); }

  openEdit(p: Post) { this.editingId.set(p.id); this.form.patchValue(p as any); this.showForm.set(true); }

  save() {
    if (this.form.invalid) return;
    this.loading.set(true);
    const req = this.editingId()
      ? this.postService.updatePost(this.editingId()!, this.form.value as any)
      : this.postService.createPost(this.form.value as any);
    req.subscribe(() => { this.loading.set(false); this.showForm.set(false); this.load(); });
  }

  delete(id: number) {
    if (!confirm('¿Eliminar esta entrada?')) return;
    this.postService.deletePost(id).subscribe(() => this.load());
  }
}
