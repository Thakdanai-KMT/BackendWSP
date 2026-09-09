import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

@Injectable()
export class AuthService {
  private jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly configService: ConfigService) {
    const jwksUrl = this.configService.get<string>('SUPABASE_JWKS_URL');

    if (!jwksUrl) {
      throw new Error('Missing SUPABASE_JWKS_URL in environment variables');
    }

    // createRemoteJWKSet จะดึง public key จาก URL นี้มา cache ไว้อัตโนมัติ
    this.jwks = createRemoteJWKSet(new URL(jwksUrl));
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    const { payload } = await jwtVerify(token, this.jwks);
    return payload;
  }
}