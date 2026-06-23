import type { StringValue } from 'ms';

export function getJwtExpiresIn(value: string): StringValue {
  return value as StringValue;
}
