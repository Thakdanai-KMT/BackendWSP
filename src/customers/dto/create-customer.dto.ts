import { IsEmail, IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(1)
  full_name: string;

  @IsPhoneNumber('TH')
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}