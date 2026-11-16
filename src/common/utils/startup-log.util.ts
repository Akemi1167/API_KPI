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
  console.log('  Bảo mật đăng nhập:');
  console.log('    - Khóa tạm sau nhiều lần sai mật khẩu');
  console.log('    - Rate limit endpoint /auth/login');
  console.log(line);
  console.log('  Lệnh hữu ích:');
  console.log('    npm run reset:admin     — reset/mở khóa admin (khẩn cấp)');
  console.log('    npm run seed:admin      — tạo/đồng bộ admin');
  console.log('    npm run seed:all        — admin + danh mục KPI');
  console.log('    npm run seed:event-types');
  console.log(line);
  console.log('');
}
