
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createClient,
  SupabaseClient,
} from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL');

    const supabaseKey =
      this.configService.get<string>(
        'SUPABASE_PUBLISHABLE_KEY',
      );

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Supabase environment variables are missing',
      );
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

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    return {
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    };
  }
}

