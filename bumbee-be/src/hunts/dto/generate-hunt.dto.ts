import { IsNumber, IsString, IsArray, IsOptional } from 'class-validator';

export class GenerateHuntDto {
  @IsNumber() lat: number;
  @IsNumber() lng: number;
  @IsString() theme: string;
  @IsString() mood: string;
  @IsArray() ages: number[];
  @IsOptional() preferences?: Record<string, any>;
}
