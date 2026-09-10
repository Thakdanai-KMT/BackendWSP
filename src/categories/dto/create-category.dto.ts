import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  category_name: string;

  @IsUUID()
  @IsOptional()
  parent_id?: string;
}   