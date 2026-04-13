import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private groupsUrl = `${environment.apiUrl}/groups`;

  /**
   * Obtiene el catálogo oficial de permisos desde la base de datos
   */
  async getAllPermissions(): Promise<ApiResponse<any[]>> {
    const obs$ = this.http.get<ApiResponse<any[]>>(`${this.groupsUrl}/permissions`);
    return firstValueFrom(obs$);
  }

  /**
   * Obtiene los permisos asociados a un grupo específico
   */
  async getGroupPermissions(groupId: string): Promise<ApiResponse<any[]>> {
    const obs$ = this.http.get<ApiResponse<any[]>>(`${this.groupsUrl}/${groupId}/permissions`);
    return firstValueFrom(obs$);
  }

  /**
   * Actualiza la lista de permisos de un grupo
   * @param groupId ID del grupo
   * @param permissions Lista de IDs de permisos
   */
  async updateGroupPermissions(groupId: string, permissions: string[]): Promise<ApiResponse> {
    const obs$ = this.http.post<ApiResponse>(`${this.groupsUrl}/${groupId}/permissions`, { permissions });
    return firstValueFrom(obs$);
  }
}
