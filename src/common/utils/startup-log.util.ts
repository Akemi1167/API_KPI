import { ADMIN_USER_SEED } from '../../scripts/seed-data/admin-user.data';

export function printStartupLog(port: number) {
  const baseUrl = `http://localhost:${port}`;
  const line = '─'.repeat(52);

  console.log('');
  console.log(line);
  console.log('  API KPI Management — sẵn sàng');
  console.log(line);
  console.log(`  API       ${baseUrl}/api`);
  console.log(`  Swagger   ${baseUrl}/api/docs`);
  console.log(`  Health    ${baseUrl}/api/health`);
  console.log(line);
  console.log('  Đăng nhập admin (sau npm run seed:all):');
  console.log(`    Email     ${ADMIN_USER_SEED.email}`);
  console.log(`    Password  ${ADMIN_USER_SEED.password}`);
  console.log(line);
  console.log('  Lệnh hữu ích:');
  console.log('    npm run seed:all        — tạo admin + danh mục KPI');
  console.log('    npm run seed:admin      — chỉ tạo admin');
  console.log('    npm run seed:event-types — chỉ tạo danh mục KPI');
  console.log(line);
  console.log('');
}
