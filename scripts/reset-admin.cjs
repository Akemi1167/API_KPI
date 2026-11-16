#!/usr/bin/env node
/**
 * Reset admin không cần Nest build / ts-node.
 * Chạy trên server:
 *   ADMIN_PASSWORD='MatKhauMoi!2026Xx' npm run reset:admin
 *   ADMIN_PASSWORD='MatKhauMoi!2026Xx' node scripts/reset-admin.cjs
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function generateStrongPassword(length = 16) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%^&*-_=+';
  const all = upper + lower + digits + special;
  const picks = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    digits[crypto.randomInt(digits.length)],
    special[crypto.randomInt(special.length)],
  ];
  while (picks.length < length) {
    picks.push(all[crypto.randomInt(all.length)]);
  }
  for (let i = picks.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }
  return picks.join('');
}

async function main() {
  loadEnvFile();

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Thiếu MONGODB_URI trong .env hoặc môi trường.');
    process.exit(1);
  }

  const email = (process.env.ADMIN_EMAIL || 'admin@example.com')
    .trim()
    .toLowerCase();
  const employeeCode =
    (process.env.ADMIN_EMPLOYEE_CODE || 'ADMIN001').trim() || 'ADMIN001';
  const fullName = (process.env.ADMIN_FULL_NAME || 'System Admin').trim();
  const positionName = (
    process.env.ADMIN_POSITION_NAME || 'Quản trị hệ thống'
  ).trim();
  const departmentName = (
    process.env.ADMIN_DEPARTMENT_NAME || 'Phòng Phát triển Phần mềm'
  ).trim();

  let password = (process.env.ADMIN_PASSWORD || '').trim();
  let passwordGenerated = false;
  if (!password) {
    password = generateStrongPassword(16);
    passwordGenerated = true;
  }

  function requireDep(name, hint) {
    try {
      return require(name);
    } catch (error) {
      if (error && error.code === 'MODULE_NOT_FOUND') {
        console.error(
          `Thiếu module '${name}'. Chạy trên server:\n  npm install ${hint || name} --omit=dev\nhoặc vào đúng thư mục có node_modules / container API.`,
        );
        process.exit(1);
      }
      throw error;
    }
  }

  // bcryptjs (pure JS) ưu tiên — không cần native build như bcrypt
  let bcrypt;
  try {
    bcrypt = require('bcryptjs');
  } catch {
    bcrypt = requireDep('bcrypt', 'bcryptjs');
  }
  const mongoose = requireDep('mongoose');
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  await mongoose.connect(mongoUri);
  const users = mongoose.connection.collection('users');
  const now = new Date();

  const existing = await users.findOne({ email });
  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      {
        $set: {
          passwordHash,
          fullName,
          employeeCode,
          role: 'ADMIN',
          positionName,
          departmentName,
          isActive: true,
          failedLoginAttempts: 0,
          lockUntil: null,
          updatedAt: now,
        },
      },
    );
  } else {
    await users.insertOne({
      employeeCode,
      fullName,
      email,
      passwordHash,
      role: 'ADMIN',
      positionName,
      departmentName,
      isActive: true,
      failedLoginAttempts: 0,
      lockUntil: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  const line = '─'.repeat(52);
  console.log('');
  console.log(line);
  console.log('  RESET ADMIN — hoàn tất (đã mở khóa đăng nhập)');
  console.log(line);
  console.log(
    `  Trạng thái  ${existing ? 'đã cập nhật mật khẩu + mở khóa' : 'đã tạo mới'}`,
  );
  console.log(`  Email       ${email}`);
  console.log(`  Password    ${password}`);
  if (passwordGenerated) {
    console.log('  ⚠ Mật khẩu sinh tự động — lưu ngay, sẽ không hiện lại.');
  }
  console.log(line);
  console.log('  Gợi ý: đặt ADMIN_PASSWORD trong .env; không commit mật khẩu.');
  console.log(line);
  console.log('');

  await mongoose.disconnect();
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Reset admin failed:', message);
  if (/EAI_AGAIN|ENOTFOUND|getaddrinfo/i.test(message)) {
    console.error('');
    console.error(
      'Không resolve được host Mongo (MONGODB_URI dùng hostname Docker `mongodb`).',
    );
    console.error('Chạy trên host (Swarm overlay thường không attachable):');
    console.error('  CID=$(docker ps -q -f name=kpi_api_api | head -n1)');
    console.error('  docker cp scripts/reset-admin.cjs "$CID":/app/scripts/reset-admin.cjs');
    console.error(
      "  docker exec -e ADMIN_PASSWORD='MatKhauMoi!2026Xx' \"\$CID\" node scripts/reset-admin.cjs",
    );
  }
  process.exit(1);
});

