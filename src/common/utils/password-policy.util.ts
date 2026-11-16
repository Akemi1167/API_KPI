import { applyDecorators, BadRequestException } from '@nestjs/common';
import { Matches, MinLength } from 'class-validator';

/** Ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt. */
export const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const STRONG_PASSWORD_MESSAGE =
  'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt';

export function IsStrongPassword() {
  return applyDecorators(
    MinLength(8, { message: STRONG_PASSWORD_MESSAGE }),
    Matches(STRONG_PASSWORD_REGEX, { message: STRONG_PASSWORD_MESSAGE }),
  );
}

export function assertStrongPassword(password: string) {
  if (!STRONG_PASSWORD_REGEX.test(password)) {
    throw new BadRequestException(STRONG_PASSWORD_MESSAGE);
  }
}
