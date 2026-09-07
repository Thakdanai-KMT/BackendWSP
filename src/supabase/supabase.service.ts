    import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client: SupabaseClient;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('SUPABASE_URL');
    const secretKey = this.configService.get<string>('SUPABASE_SECRET_KEY');

    if (!url || !secretKey) {
      throw new Error(
        'Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment variables',
      );
    }

    this.client = createClient(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}