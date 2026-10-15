import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const PASSWORD_MESSAGE =
  "La contraseña debe tener al menos 8 caracteres, una letra y un número";

export class RegisterDto {
  @ApiProperty({ example: "ana@harbor.dev" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Ana" })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  firstName!: string;

  @ApiProperty({ example: "Ruiz" })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  lastName!: string;

  @ApiProperty({ example: "User12345" })
  @IsString()
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: "admin@harbor.dev" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Admin123!" })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty()
  @IsString()
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  newPassword!: string;
}

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: [String], example: ["ADMIN"] })
  roles!: string[];
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ example: 900 })
  expiresIn!: number;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
