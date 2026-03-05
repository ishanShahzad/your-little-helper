import { IsEmail, IsString, MinLength, IsDateString, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsDateString()
  dob: string;

  @IsOptional()
  @IsString()
  referralCode?: string;
}
