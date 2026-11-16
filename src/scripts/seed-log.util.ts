import { getAdminUserSeed } from './seed-data/admin-user.data';

const line = '─'.repeat(52);

export function printSeedAdminResult(input: {
  created: boolean;
  email: string;
  password: string;
  passwordGenerated?: boolean;
}) {
  console.log('');
  console.log(line);
  console.log(
    `  Seed admin — ${input.created ? 'đã tạo mới' : 'đã tồn tại, đã đồng bộ mật khẩu'}`,
  );
  console.log(line);
  console.log(`  Email     ${input.email}`);
  console.log(`  Password  ${input.password}`);
  if (input.passwordGenerated) {
    console.log('  (mật khẩu được sinh tự động — hãy lưu lại ngay)');
  }
  console.log(line);
  console.log('');
}

export function printResetAdminResult(input: {
  created: boolean;
  email: string;
  password: string;
  passwordGenerated?: boolean;
}) {
  console.log('');
  console.log(line);
  console.log('  RESET ADMIN — hoàn tất (đã mở khóa đăng nhập)');
  console.log(line);
  console.log(
    `  Trạng thái  ${input.created ? 'đã tạo mới' : 'đã cập nhật mật khẩu + mở khóa'}`,
  );
  console.log(`  Email       ${input.email}`);
  console.log(`  Password    ${input.password}`);
  if (input.passwordGenerated) {
    console.log('  ⚠ Mật khẩu sinh tự động — lưu ngay, sẽ không hiện lại.');
  }
  console.log(line);
  console.log('  Gợi ý bảo mật:');
  console.log('  - Đặt ADMIN_PASSWORD trong .env trước khi reset lần sau');
  console.log('  - Đổi JWT_SECRET nếu nghi lộ token');
  console.log('  - Không commit mật khẩu vào git');
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

export function printSeedAllResult(
  adminCreated: boolean,
  eventTypesCreated: number,
) {
  const seed = getAdminUserSeed();
  console.log('');
  console.log(line);
  console.log('  Seed all — hoàn tất');
  console.log(line);
  console.log(
    `  Admin         ${adminCreated ? 'đã tạo mới' : 'đã tồn tại, đã đồng bộ mật khẩu'}`,
  );
  console.log(`  Event types   ${eventTypesCreated} bản ghi mới`);
  console.log(line);
  console.log(`  Đăng nhập: ${seed.email} / ${seed.password}`);
  console.log(line);
  console.log('');
}
