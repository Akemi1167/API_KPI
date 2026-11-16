import { randomBytes } from 'crypto';

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SPECIAL = '!@#$%^&*-_=+';

/** Sinh mật khẩu mạnh đủ chữ hoa/thường/số/ký tự đặc biệt. */
export function generateStrongPassword(length = 16): string {
  const pools = [UPPER, LOWER, DIGITS, SPECIAL];
  const all = pools.join('');
  const chars: string[] = pools.map((pool) => pool[randomInt(pool.length)]);

  while (chars.length < length) {
    chars.push(all[randomInt(all.length)]);
  }

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

function randomInt(max: number) {
  return randomBytes(4).readUInt32BE(0) % max;
}
