import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL');

    const supabaseKey =
      this.configService.get<string>('SUPABASE_PUBLISHABLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables are missing');
    }

    this.supabase = createClient(
      supabaseUrl,
      supabaseKey,
    );
  }

  async login(email: string, password: string) {
    const { data, error } =
      await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    return {
      user: data.user,
      session: data.session,
    };
  }
}