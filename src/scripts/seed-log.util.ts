import { ADMIN_USER_SEED } from './seed-data/admin-user.data';

const line = '─'.repeat(52);

export function printSeedAdminResult(created: boolean) {
  console.log('');
  console.log(line);
  console.log(
    `  Seed admin — ${created ? 'đã tạo mới' : 'đã tồn tại, đã đồng bộ mật khẩu'}`,
  );
  console.log(line);
  console.log(`  Email     ${ADMIN_USER_SEED.email}`);
  console.log(`  Password  ${ADMIN_USER_SEED.password}`);
  console.log(line);
  console.log('');
}

export function printSeedEventTypesResult(created: number, skipped: number) {
  console.log('');
  console.log(line);
  console.log('  Seed event types — hoàn tất');
  console.log(line);
  console.log(`  Đã tạo mới    ${created}`);
  console.log(`  Đã bỏ qua     ${skipped}`);
  console.log(line);
  console.log('');
}

export function printSeedAllResult(adminCreated: boolean, eventTypesCreated: number) {
  console.log('');
  console.log(line);
  console.log('  Seed all — hoàn tất');
  console.log(line);
  console.log(
    `  Admin         ${adminCreated ? 'đã tạo mới' : 'đã tồn tại, đã đồng bộ mật khẩu'}`,
  );
  console.log(`  Event types   ${eventTypesCreated} bản ghi mới`);
  console.log(line);
  console.log(`  Đăng nhập: ${ADMIN_USER_SEED.email} / ${ADMIN_USER_SEED.password}`);
  console.log(line);
  console.log('');
}
