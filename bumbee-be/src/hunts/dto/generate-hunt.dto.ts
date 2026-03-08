import { IsNumber, IsString, IsArray, IsOptional, IsEnum } from 'class-validator';

export class GenerateHuntDto {
  @IsOptional() @IsNumber() lat?: number;    // optional — fallback if location unavailable
  @IsOptional() @IsNumber() lng?: number;
  @IsOptional() @IsString() theme?: string;
  @IsOptional() @IsString() mood?: string;
  @IsOptional() @IsArray() ages?: number[];
  @IsOptional() @IsNumber() durationMinutes?: number;
  @IsOptional() @IsNumber() radius?: number;
  @IsOptional() preferences?: Record<string, any>;
  
  // New fields for budget and transport mode
  @IsOptional() @IsNumber() budget?: number; // in dollars
  @IsOptional() @IsEnum(['walking', 'car']) transportMode?: 'walking' | 'car';
  @IsOptional() @IsEnum(['indoor', 'outdoor', 'mixed']) environment?: 'indoor' | 'outdoor' | 'mixed';
}
