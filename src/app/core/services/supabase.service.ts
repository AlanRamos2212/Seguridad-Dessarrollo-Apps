import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // ==========================================
  // AUTHENTICATION
  // ==========================================
  
  // Register a new user
  async registerUser(email: string, password: string, metadata: any) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata // Contains full_name, direccion, telefono, etc.
      }
    });
    if (error) throw error;
    return data;
  }

  // Login
  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  // Logout
  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  // Get current user session
  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  // Update password (must be logged in)
  async updatePassword(newPassword: string) {
    const { data, error } = await this.supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  }

  // ==========================================
  // PROFILES & PERMISSIONS (DATABASE)
  // ==========================================

  // Admin: Get all profiles
  async getAllProfiles() {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*');
    
    if (error) throw error;
    return data;
  }

  // Get profile of a specific user
  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Update profile
  async updateProfile(userId: string, updates: any) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data;
  }

  // Admin: Update user permissions array
  async updatePermissions(userId: string, permissions: string[]) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update({ permissions: permissions })
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data;
  }
}
