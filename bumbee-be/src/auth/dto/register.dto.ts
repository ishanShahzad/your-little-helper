import { IsEmail, IsString, MinLength, IsDateString, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsDateString() dob: string;
  @IsString() @MinLength(6) password: string;
  @IsOptional() @IsString() referralCode?: string;
}
