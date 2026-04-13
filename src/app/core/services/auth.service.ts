import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { firstValueFrom, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  // Registrar usuario
  async register(userData: any): Promise<ApiResponse> {
    const obs$ = this.http.post<ApiResponse>(`${this.apiUrl}/register`, userData);
    return firstValueFrom(obs$);
  }

  // Login
  async login(credentials: any): Promise<ApiResponse> {
    const obs$ = this.http.post<ApiResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        // En tu backend el token viene directamente en data[0].token
        if (res.data && res.data[0]?.token) {
          localStorage.setItem('supabase_token', res.data[0].token);
        }
      })
    );
    return firstValueFrom(obs$);
  }

  // Mi Perfil
  async getMe(): Promise<ApiResponse> {
    const obs$ = this.http.get<ApiResponse>(`${this.apiUrl}/me`);
    return firstValueFrom(obs$);
  }

  async updateMyProfile(data: any): Promise<ApiResponse> {
    const obs$ = this.http.put<ApiResponse>(`${this.apiUrl}/me`, data);
    return firstValueFrom(obs$);
  }

  // Logout
  logout() {
    localStorage.removeItem('supabase_token');
  }

  // Verificar si está logueado
  isLoggedIn(): boolean {
    return !!localStorage.getItem('supabase_token');
  }

  // ─── Rutas Administrativas ────────────────────────────────────────────────
  
  getUsersAdmin(): Promise<ApiResponse<any[]>> {
    const obs$ = this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/admin/users`);
    return firstValueFrom(obs$);
  }

  adminCreateUser(userData: any): Promise<ApiResponse> {
    const obs$ = this.http.post<ApiResponse>(`${this.apiUrl}/admin/users`, userData);
    return firstValueFrom(obs$);
  }

  deleteUser(userId: string): Promise<ApiResponse> {
    const obs$ = this.http.delete<ApiResponse>(`${this.apiUrl}/admin/users/${userId}`);
    return firstValueFrom(obs$);
  }

  adminUpdateUser(userId: string, userData: any): Promise<ApiResponse> {
    const obs$ = this.http.patch<ApiResponse>(`${this.apiUrl}/admin/users/${userId}`, userData);
    return firstValueFrom(obs$);
  }
}
