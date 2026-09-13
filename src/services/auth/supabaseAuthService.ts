/**
 * Gym OS - Supabase Authentication & Admin Client
 * Handles real Supabase Auth session, JWT tokens, and Super Admin role enforcement.
 * Adheres strictly to security standards: service role key and private keys are never exposed.
 */

import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';

const STORAGE_KEY_SUPABASE_CONFIG = 'gym_os_supabase_admin_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface SuperAdminProfile {
  id: string;
  email?: string;
  fullName?: string;
  role: 'super_admin' | string;
}

class SupabaseAuthService {
  private client: SupabaseClient | null = null;
  private currentSession: Session | null = null;
  private currentUser: User | null = null;
  private currentProfile: SuperAdminProfile | null = null;
  private authListeners: Set<(session: Session | null, profile: SuperAdminProfile | null) => void> = new Set();
  private isChecking = false;

  constructor() {
    this.initClient();
  }

  /**
   * Reads Supabase configuration from environment variables or saved admin settings.
   */
  public getConfig(): SupabaseConfig {
    const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.SUPABASE_URL || '';
    const envAnon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.SUPABASE_ANON_KEY || '';

    if (envUrl && envAnon) {
      return { url: envUrl.trim(), anonKey: envAnon.trim() };
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUPABASE_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.url && parsed?.anonKey) {
          return { url: parsed.url.trim(), anonKey: parsed.anonKey.trim() };
        }
      }
    } catch {
      // ignore
    }

    return { url: '', anonKey: '' };
  }

  public saveConfig(config: SupabaseConfig): void {
    try {
      localStorage.setItem(STORAGE_KEY_SUPABASE_CONFIG, JSON.stringify(config));
      this.initClient(config);
    } catch (e) {
      console.error('Failed to save Supabase config:', e);
    }
  }

  public initClient(overrideConfig?: SupabaseConfig): SupabaseClient | null {
    const config = overrideConfig || this.getConfig();
    if (!config.url || !config.anonKey) {
      this.client = null;
      return null;
    }

    try {
      this.client = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'gym_os_supabase_auth_token',
        },
      });

      // Listen to auth state changes
      this.client.auth.onAuthStateChange(async (_event, session) => {
        this.currentSession = session;
        this.currentUser = session?.user || null;
        if (session?.user) {
          await this.fetchUserProfile(session.user);
        } else {
          this.currentProfile = null;
        }
        this.notifyListeners();
      });

      return this.client;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      this.client = null;
      return null;
    }
  }

  public getClient(): SupabaseClient | null {
    if (!this.client) {
      return this.initClient();
    }
    return this.client;
  }

  public getAccessToken(): string | null {
    return this.currentSession?.access_token || null;
  }

  public getCurrentSession(): Session | null {
    return this.currentSession;
  }

  public getCurrentProfile(): SuperAdminProfile | null {
    return this.currentProfile;
  }

  public isSuperAdmin(): boolean {
    if (!this.currentProfile) return false;
    return this.currentProfile.role === 'super_admin';
  }

  /**
   * Initializes session on application/console mount
   */
  public async checkSession(): Promise<{ session: Session | null; profile: SuperAdminProfile | null; isSuperAdmin: boolean }> {
    const client = this.getClient();
    if (!client) {
      return { session: null, profile: null, isSuperAdmin: false };
    }

    try {
      this.isChecking = true;
      const { data, error } = await client.auth.getSession();
      if (error || !data.session) {
        this.currentSession = null;
        this.currentUser = null;
        this.currentProfile = null;
        this.notifyListeners();
        return { session: null, profile: null, isSuperAdmin: false };
      }

      this.currentSession = data.session;
      this.currentUser = data.session.user;
      await this.fetchUserProfile(data.session.user);
      this.notifyListeners();

      return {
        session: this.currentSession,
        profile: this.currentProfile,
        isSuperAdmin: this.isSuperAdmin(),
      };
    } catch (err) {
      console.error('Session check error:', err);
      return { session: null, profile: null, isSuperAdmin: false };
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Fetches user profile from profiles table or extracts from JWT metadata
   */
  private async fetchUserProfile(user: User): Promise<SuperAdminProfile | null> {
    const client = this.getClient();
    let role = user.app_metadata?.role || user.user_metadata?.role || 'staff';
    let fullName = user.user_metadata?.full_name || user.email || 'Super Admin';

    if (client) {
      try {
        const { data, error } = await client
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data) {
          role = data.role || role;
          fullName = data.full_name || fullName;
        }
      } catch (err) {
        console.warn('Profile fetch error, using token metadata:', err);
      }
    }

    this.currentProfile = {
      id: user.id,
      email: user.email,
      fullName,
      role,
    };

    return this.currentProfile;
  }

  /**
   * Sign In via Supabase Auth with real password verification
   */
  public async signIn(email: string, password: string):Promise<{ success: boolean; error?: string; isSuperAdmin?: boolean }> {
    const client = this.getClient();
    if (!client) {
      return {
        success: false,
        error: 'آدرس و کلید عمومی Supabase هنوز تنظیم نشده است. لطفاً ابتدا اتصال Supabase را پیکربندی کنید.',
      };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.session) {
        return {
          success: false,
          error: error?.message || 'نام کاربری یا رمز عبور اشتباه است.',
        };
      }

      this.currentSession = data.session;
      this.currentUser = data.user;
      const profile = await this.fetchUserProfile(data.user);

      if (profile?.role !== 'super_admin') {
        // Sign out immediately if not super_admin
        await client.auth.signOut();
        this.currentSession = null;
        this.currentUser = null;
        this.currentProfile = null;
        this.notifyListeners();
        return {
          success: false,
          error: 'دسترسی غیرمجاز: حساب شما فاقد سطح دسترسی راهبر ارشد (super_admin) برای مدیریت لایسنس است.',
          isSuperAdmin: false,
        };
      }

      this.notifyListeners();
      return {
        success: true,
        isSuperAdmin: true,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'خطای شبکه در برقراری ارتباط با Supabase Auth',
      };
    }
  }

  /**
   * Sign Out from Supabase Auth
   */
  public async signOut(): Promise<void> {
    const client = this.getClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn('SignOut error:', err);
      }
    }
    this.currentSession = null;
    this.currentUser = null;
    this.currentProfile = null;
    this.notifyListeners();
  }

  public subscribe(listener: (session: Session | null, profile: SuperAdminProfile | null) => void): () => void {
    this.authListeners.add(listener);
    // Initial call
    listener(this.currentSession, this.currentProfile);
    return () => {
      this.authListeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.authListeners.forEach(fn => {
      try {
        fn(this.currentSession, this.currentProfile);
      } catch (err) {
        console.error('Auth listener error:', err);
      }
    });
  }
}

export const supabaseAuthService = new SupabaseAuthService();
