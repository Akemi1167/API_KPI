# Tài liệu API quản lý KPI — NestJS & MongoDB

**Phiên bản tài liệu:** 2.0 (đồng bộ với codebase hiện tại)  
**Stack:** NestJS 11, MongoDB, Mongoose, JWT, Swagger  
**Mục tiêu:** Backend API quản lý KPI tối giản cho MVP — quản lý user, kỳ KPI, danh mục cộng/trừ điểm, nhập sự kiện KPI và tính kết quả.

> Tài liệu này mô tả **hệ thống đang triển khai**, không phải bản thiết kế lý thuyết. Chi tiết quy tắc viết code xem thêm tại `coding_rules.md`.

---

## 1. Phạm vi chức năng

| Nhóm | Mô tả | Quyền truy cập |
|------|--------|----------------|
| Health | Kiểm tra trạng thái API | Public |
| Auth | Đăng nhập JWT, xem profile | Login: Public; `/me`: JWT |
| Users | CRUD user, khóa/mở tài khoản | ADMIN |
| KPI Periods | Tạo/cập nhật/đóng/khóa kỳ KPI | ADMIN |
| KPI Event Types | Danh mục loại cộng/trừ điểm | ADMIN |
| KPI Events | Nhập/xóa sự kiện cộng/trừ điểm | ADMIN |
| KPI Results | Tính, xem, duyệt kết quả KPI | ADMIN |

**Ngoài phạm vi MVP:** task management, project, sprint, approval nhiều cấp, nhân viên tự xem KPI (`/me/kpi-results`).

---

## 2. Công nghệ & package

| Thành phần | Package / công cụ |
|------------|-------------------|
| Framework | `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` |
| Database | `@nestjs/mongoose`, `mongoose` |
| Config | `@nestjs/config` |
| Auth | `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt` |
| Validation | `class-validator`, `class-transformer`, `@nestjs/mapped-types` |
| API docs | `@nestjs/swagger` |
| Test | `jest`, `supertest` |

---

## 3. Cấu trúc thư mục

```txt
src/
  main.ts
  app.module.ts
  app.controller.ts
  app.service.ts
  common/
    config/
      swagger.config.ts
    decorators/
      current-user.decorator.ts
      roles.decorator.ts
      public.decorator.ts
      api-admin-auth.decorator.ts
    dto/
      pagination-query.dto.ts
    enums/
      user-role.enum.ts
      kpi-event-kind.enum.ts
      kpi-period-status.enum.ts
      kpi-rating.enum.ts
    filters/
      http-exception.filter.ts
    guards/
      jwt-auth.guard.ts
      roles.guard.ts
    interceptors/
      transform-response.interceptor.ts
    interfaces/
      current-user-payload.interface.ts
      paginated-result.interface.ts
    utils/
      pagination.util.ts
      kpi-calculate.util.ts
      jwt.util.ts
  auth/
    auth.module.ts
    auth.controller.ts
    auth.service.ts
    dto/login.dto.ts
    strategies/jwt.strategy.ts
  users/
    users.module.ts
    users.controller.ts
    users.service.ts
    dto/
    schemas/user.schema.ts
    utils/user.mapper.ts
  kpi/
    kpi.module.ts
    controllers/
    services/
    dto/
    schemas/
  scripts/
    seed-admin.ts
```

---

## 4. Biến môi trường

File mẫu: `.env.example`

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/kpi_management
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=1d
BCRYPT_SALT_ROUNDS=10
```

| Biến | Ý nghĩa | Mặc định |
|------|---------|----------|
| `PORT` | Port chạy API | `3000` |
| `MONGODB_URI` | Chuỗi kết nối MongoDB | — |
| `JWT_SECRET` | Secret ký JWT (bắt buộc) | — |
| `JWT_EXPIRES_IN` | Thời hạn token | `1d` |
| `BCRYPT_SALT_ROUNDS` | Vòng salt bcrypt | `10` |

> Không commit file `.env` thật lên Git.

---

## 5. Lệnh chạy dự án

```bash
# Cài dependencies
npm install

# Chạy development (watch mode)
npm run dev
# hoặc: npm run start:dev

# Build production
npm run build
npm run start:prod

# Seed dữ liệu
npm run seed:admin        # Tạo admin
npm run seed:event-types  # Tạo 22 loại cộng/trừ điểm
npm run seed:all          # Admin + event types
# Admin: admin@example.com | Admin@123

# Test
npm test              # unit test
npm run test:cov      # coverage
npm run test:e2e      # e2e (cần MongoDB)

# Lint
npm run lint
```

**URL sau khi chạy:**

| Mục đích | URL |
|----------|-----|
| API base | `http://localhost:3000/api` |
| Health check | `http://localhost:3000/api/health` |
| Swagger UI | `http://localhost:3000/api/docs` |
| OpenAPI JSON | `http://localhost:3000/api/docs-json` |

---

## 6. Quy ước API

### 6.1. Global prefix

Tất cả endpoint có prefix **`/api`**.

Ví dụ: `POST /api/auth/login`, `GET /api/users`.

### 6.2. Format response thành công

Mọi response thành công được bọc bởi `TransformResponseInterceptor`:

**Đơn lẻ:**
```json
{
  "data": {
    "id": "665f...",
    "fullName": "Nguyễn Văn A"
  }
}
```

**Danh sách có phân trang:**
```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 6.3. Format response lỗi

`HttpExceptionFilter` trả về:

```json
{
  "statusCode": 400,
  "message": "Kỳ KPI đã khóa hoặc đã đóng",
  "error": "Bad Request",
  "path": "/api/kpi-events",
  "timestamp": "2026-06-10T10:00:00.000Z"
}
```

### 6.4. Phân trang & lọc

Các endpoint danh sách hỗ trợ query chung (`PaginationQueryDto`):

| Query | Mặc định | Mô tả |
|-------|----------|--------|
| `page` | `1` | Trang hiện tại |
| `limit` | `20` | Số bản ghi/trang (tối đa `100`) |
| `sortBy` | `createdAt` | Trường sắp xếp |
| `sortOrder` | `desc` | `asc` hoặc `desc` |
| `keyword` | — | Từ khóa tìm kiếm (tùy module) |

### 6.5. Xác thực & phân quyền

- **JWT Bearer Token** — header: `Authorization: Bearer <token>`
- `JwtAuthGuard` được đăng ký **global** qua `APP_GUARD`
- Endpoint public dùng decorator `@Public()` (login, health)
- Endpoint ADMIN dùng `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)`
- Mọi user **active** có password hợp lệ đều đăng nhập được; endpoint quản trị yêu cầu role `ADMIN`

---

## 7. Enum dùng chung

```ts
// user-role.enum.ts
enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

// kpi-event-kind.enum.ts
enum KpiEventKind {
  BONUS = 'BONUS',
  PENALTY = 'PENALTY',
}

// kpi-period-status.enum.ts
enum KpiPeriodStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  LOCKED = 'LOCKED',
}

// kpi-rating.enum.ts
enum KpiRating {
  EXCELLENT = 'Xuất sắc',
  GOOD = 'Tốt',
  PASS = 'Đạt',
  NO_REWARD = 'Không thưởng',
}
```

---

## 8. MongoDB collections

| Collection (Mongoose model) | Vai trò |
|-----------------------------|---------|
| `users` | Admin và nhân viên |
| `kpiperiods` | Kỳ KPI (tháng/quý tùy cấu hình) |
| `kpieventtypes` | Danh mục loại cộng/trừ điểm |
| `kpievents` | Sự kiện KPI thực tế đã nhập |
| `kpiresults` | Kết quả KPI sau khi tính |

### 8.1. User

| Trường | Kiểu | Ghi chú |
|--------|------|---------|
| `employeeCode` | string | Unique, bắt buộc |
| `fullName` | string | Bắt buộc |
| `email` | string | Unique, lowercase, bắt buộc |
| `passwordHash` | string | Bắt buộc, `select: false` |
| `role` | UserRole | Mặc định `EMPLOYEE` |
| `positionName` | string | Tùy chọn |
| `departmentName` | string | Mặc định `Phòng Phát triển Phần mềm` |
| `managerId` | ObjectId → User | Tùy chọn |
| `isActive` | boolean | Mặc định `true` |
| `createdAt`, `updatedAt` | Date | Tự động (`timestamps`) |

**Index:** `employeeCode`, `email`

### 8.2. KpiPeriod

| Trường | Kiểu | Ghi chú |
|--------|------|---------|
| `code` | string | Unique, auto `KPI-{year}-{month}` nếu không truyền |
| `name` | string | Tên kỳ, bắt buộc |
| `year` | number | Auto từ `startDate` nếu không truyền |
| `month` | number | 1–12, auto từ `startDate` nếu không truyền |
| `startDate` | Date | Bắt buộc |
| `endDate` | Date | Bắt buộc |
| `status` | KpiPeriodStatus | Mặc định `OPEN` |
| `baseScore` | number | Điểm gốc kỳ, mặc định `100` |

**Index:** `{ year: 1, month: 1 }` unique, `{ status: 1, startDate: -1 }`

> Điểm gốc KPI lấy từ **`period.baseScore`**, không lưu trên User.

### 8.3. KpiEventType

| Trường | Kiểu | Ghi chú |
|--------|------|---------|
| `code` | string | Unique, bắt buộc |
| `name` | string | Bắt buộc |
| `description` | string | Tùy chọn |
| `eventKind` | KpiEventKind | `BONUS` hoặc `PENALTY` |
| `defaultPoints` | number | Điểm mặc định khi nhập event |
| `isActive` | boolean | Mặc định `true` |

**Index:** `{ eventKind: 1, isActive: 1 }`

### 8.4. KpiEvent

| Trường | Kiểu | Ghi chú |
|--------|------|---------|
| `userId` | ObjectId → User | Nhân viên được chấm |
| `periodId` | ObjectId → KpiPeriod | Kỳ KPI |
| `eventTypeId` | ObjectId → KpiEventType | Loại sự kiện |
| `eventKind` | KpiEventKind | Snapshot từ event type |
| `points` | number | Điểm mỗi lần |
| `quantity` | number | Mặc định `1`, min `1` |
| `totalPoints` | number | `points × quantity` |
| `occurredAt` | Date | Thời điểm xảy ra, mặc định `now` |
| `note` | string | Tối đa 1000 ký tự |
| `evidenceUrl` | string | URL bằng chứng |
| `createdBy` | ObjectId → User | Admin nhập |
| `eventTypeSnapshot` | object | `{ code, name }` tại thời điểm nhập |

**Index:** `{ userId: 1, periodId: 1 }`, `{ periodId: 1, eventKind: 1 }`

### 8.5. KpiResult

| Trường | Kiểu | Ghi chú |
|--------|------|---------|
| `userId` | ObjectId | Nhân viên |
| `periodId` | ObjectId | Kỳ KPI |
| `baseScore` | number | Từ period |
| `rawBonusPoints` | number | Tổng bonus trước khi cap |
| `bonusPoints` | number | Tổng điểm cộng (không giới hạn) |
| `penaltyPoints` | number | Tổng điểm trừ (số âm) |
| `finalScore` | number | Điểm cuối |
| `rating` | KpiRating | Xếp loại |
| `rewardPercent` | number | % thưởng (0–150) |
| `isApproved` | boolean | Mặc định `false` |
| `isLocked` | boolean | Mặc định `false` |
| `approvedBy` | ObjectId | Admin duyệt |
| `calculatedBy` | ObjectId | Admin tính |
| `lockedBy` | ObjectId | Admin khóa |
| `lockedAt` | Date | Thời điểm khóa |

**Index:** `{ userId: 1, periodId: 1 }` unique, `{ periodId: 1, finalScore: -1 }`

---

## 9. Danh sách API endpoints

### 9.1. Health

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| `GET` | `/api/health` | Public | Kiểm tra trạng thái API |

### 9.2. Auth

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| `POST` | `/api/auth/login` | Public | Đăng nhập, nhận JWT |
| `GET` | `/api/auth/me` | JWT | Thông tin tài khoản hiện tại |

**Login request:**
```json
{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

**Login response:**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "665f...",
      "employeeCode": "ADMIN001",
      "fullName": "System Admin",
      "email": "admin@example.com",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

### 9.3. Users (ADMIN)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `POST` | `/api/users` | Tạo user |
| `GET` | `/api/users` | Danh sách (phân trang, filter `role`, `keyword`) |
| `GET` | `/api/users/:id` | Chi tiết |
| `PATCH` | `/api/users/:id` | Cập nhật |
| `PATCH` | `/api/users/:id/activate` | Kích hoạt tài khoản |
| `PATCH` | `/api/users/:id/deactivate` | Khóa tài khoản |

**Create user body:**
```json
{
  "employeeCode": "NV001",
  "fullName": "Nguyễn Văn A",
  "email": "nva@example.com",
  "password": "123456",
  "role": "EMPLOYEE"
}
```

### 9.4. KPI Periods (ADMIN)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `POST` | `/api/kpi-periods` | Tạo kỳ KPI |
| `GET` | `/api/kpi-periods` | Danh sách (filter `status`, `keyword`) |
| `GET` | `/api/kpi-periods/:id` | Chi tiết |
| `PATCH` | `/api/kpi-periods/:id` | Cập nhật (chỉ khi `OPEN`) |
| `PATCH` | `/api/kpi-periods/:id/close` | Đóng kỳ (`OPEN` → `CLOSED`) |
| `PATCH` | `/api/kpi-periods/:id/lock` | Khóa kỳ (`LOCKED`) |

**Create period body:**
```json
{
  "name": "KPI Tháng 6/2026",
  "startDate": "2026-06-01",
  "endDate": "2026-06-30",
  "baseScore": 100
}
```

### 9.5. KPI Event Types (ADMIN)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `POST` | `/api/kpi-event-types` | Tạo loại cộng/trừ điểm |
| `GET` | `/api/kpi-event-types` | Danh sách (filter `eventKind`, `keyword`) |
| `GET` | `/api/kpi-event-types/:id` | Chi tiết |
| `PATCH` | `/api/kpi-event-types/:id` | Cập nhật |
| `PATCH` | `/api/kpi-event-types/:id/deactivate` | Vô hiệu hóa |

**Create event type body:**
```json
{
  "name": "Không cập nhật Task",
  "description": "Không cập nhật trạng thái task đúng hạn",
  "eventKind": "PENALTY",
  "defaultPoints": -2
}
```

### 9.6. KPI Events (ADMIN)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `POST` | `/api/kpi-events` | Nhập sự kiện cộng/trừ điểm |
| `GET` | `/api/kpi-events` | Danh sách (filter `userId`, `periodId`, `eventKind`) |
| `GET` | `/api/kpi-events/:id` | Chi tiết |
| `DELETE` | `/api/kpi-events/:id` | Xóa (chỉ khi kỳ `OPEN`) |

**Create event body:**
```json
{
  "userId": "665f...",
  "periodId": "6660...",
  "eventTypeId": "6661...",
  "quantity": 1,
  "note": "Hỗ trợ xử lý incident ngoài giờ",
  "evidenceUrl": "https://example.com/evidence/123"
}
```

### 9.7. KPI Results (ADMIN)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `POST` | `/api/kpi-results/calculate` | Tính/tính lại KPI cho 1 user trong 1 kỳ |
| `POST` | `/api/kpi-results/calculate-period/:periodId` | Tính KPI cho tất cả nhân viên active trong kỳ |
| `GET` | `/api/kpi-results` | Danh sách (filter `userId`, `periodId`) |
| `GET` | `/api/kpi-results/:id` | Chi tiết |
| `PATCH` | `/api/kpi-results/:id/approve` | Duyệt kết quả |
| `PATCH` | `/api/kpi-results/:id/lock` | Khóa kết quả (không tính lại/duyệt) |

### 9.8. My KPI (JWT — nhân viên hoặc admin)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `GET` | `/api/me/kpi-results` | Xem kết quả KPI của chính mình (filter `periodId`) |

**Calculate body:**
```json
{
  "userId": "665f...",
  "periodId": "6660..."
}
```

**Calculate response:**
```json
{
  "data": {
    "id": "6670...",
    "userId": "665f...",
    "periodId": "6660...",
    "baseScore": 100,
    "rawBonusPoints": 12,
    "bonusPoints": 10,
    "penaltyPoints": -5,
    "finalScore": 105,
    "rating": "Xuất sắc",
    "rewardPercent": 150,
    "isApproved": false,
    "calculatedBy": "665e...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## 10. Logic tính KPI

Logic nằm trong `src/common/utils/kpi-calculate.util.ts`, được gọi từ `KpiResultsService`.

### 10.1. Công thức

```
rawBonusPoints  = tổng totalPoints của events có eventKind = BONUS
bonusPoints     = rawBonusPoints
penaltyPoints   = tổng totalPoints của events có eventKind = PENALTY (số âm)
finalScore      = period.baseScore + bonusPoints + penaltyPoints
```

### 10.2. Bảng xếp loại & thưởng

| finalScore | rating | rewardPercent |
|------------|--------|---------------|
| ≥ 100 | Xuất sắc | 150 |
| ≥ 95 | Tốt | 120 |
| ≥ 90 | Đạt | 100 |
| ≥ 80 | Đạt | 50 |
| < 80 | Không thưởng | 0 |

### 10.3. Validate điểm khi nhập event

| eventKind | Ràng buộc points |
|-----------|-----------------|
| `BONUS` | Không được âm (`points >= 0`) |
| `PENALTY` | Không được dương (`points <= 0`) |

Nếu request không truyền `points`, hệ thống dùng `defaultPoints` từ `KpiEventType`.

### 10.4. Ràng buộc nghiệp vụ

| Hành động | Điều kiện |
|-----------|-----------|
| Tạo/xóa KPI event | Kỳ phải ở trạng thái `OPEN` |
| Cập nhật kỳ KPI | Kỳ phải ở trạng thái `OPEN` |
| Tính lại KPI result | Kỳ **không** được `LOCKED` |
| Duyệt KPI result | Kỳ **không** được `LOCKED` |
| Tính lại KPI | Reset `isApproved = false`, xóa `approvedBy` |

---

## 11. Luồng nghiệp vụ khuyến nghị

```
1. npm run seed:all            → Tạo admin + danh mục cộng/trừ điểm
2. POST /api/auth/login        → Lấy JWT
3. POST /api/users             → Tạo nhân viên
4. POST /api/kpi-periods       → Tạo kỳ KPI (OPEN)
5. POST /api/kpi-event-types     → Tạo danh mục cộng/trừ điểm
6. POST /api/kpi-events          → Nhập sự kiện cho nhân viên
7. POST /api/kpi-results/calculate → Tính KPI
8. PATCH /api/kpi-results/:id/approve → Duyệt kết quả
9. PATCH /api/kpi-periods/:id/close  → Đóng kỳ
10. PATCH /api/kpi-periods/:id/lock  → Khóa kỳ (không tính lại được)
```

---

## 12. Seed data đề xuất (chưa tự động)

Script hiện có: `npm run seed:admin` — chỉ tạo tài khoản admin.

Danh mục cộng/trừ điểm khuyến nghị (tạo thủ công qua API hoặc bổ sung script seed):

| Tên | eventKind | defaultPoints |
|-----|-----------|---------------|
| Hoàn thành Sprint trước hạn | BONUS | 3 |
| Hỗ trợ sự cố ngoài giờ | BONUS | 3 |
| Xử lý Incident Production | BONUS | 3 |
| Hỗ trợ đào tạo nhân sự mới | BONUS | 2 |
| Review code chất lượng cao | BONUS | 2 |
| Tối ưu hiệu năng hệ thống | BONUS | 5 |
| Tối ưu chi phí hạ tầng | BONUS | 5 |
| Ý tưởng được triển khai thực tế | BONUS | 5 |
| Được khách hàng/quản lý khen thưởng | BONUS | 3 |
| Không cập nhật Task | PENALTY | -2 |
| Không tham gia họp | PENALTY | -2 |
| Không review code được giao | PENALTY | -2 |
| Deploy không thông báo | PENALTY | -5 |
| Không cập nhật tài liệu | PENALTY | -2 |
| Vi phạm quy trình release | PENALTY | -5 |
| Vi phạm bảo mật | PENALTY | -10 |
| Gây downtime hệ thống | PENALTY | -10 |
| Tự ý thay đổi môi trường Production | PENALTY | -10 |
| Không báo cáo sự cố kịp thời | PENALTY | -5 |
| Vi phạm bảo mật dữ liệu | PENALTY | -20 |
| Gây mất dữ liệu | PENALTY | -20 |
| Cố tình che giấu lỗi | PENALTY | -20 |

---

## 13. Bảo mật

| Quy tắc | Triển khai |
|---------|------------|
| Hash password | `bcrypt` qua `UsersService.hashPassword()` |
| Không trả passwordHash | Schema `select: false` + `user.mapper` |
| Bảo vệ endpoint ADMIN | `JwtAuthGuard` + `RolesGuard` + `@Roles(ADMIN)` |
| JWT secret | Biến môi trường `JWT_SECRET` |
| Chặn tài khoản khóa | `AuthService` + `JwtStrategy` kiểm tra `isActive` |
| Log đăng nhập thất bại | `AuthService` logger |
| Log thao tác KPI | `KpiEventsService`, `KpiResultsService` logger |

---

## 14. Swagger

Swagger UI tích hợp sẵn tại `/api/docs`.

**Cách test nhanh:**
1. Mở `http://localhost:3000/api/docs`
2. Gọi `POST /api/auth/login`
3. Bấm **Authorize** → nhập token (hoặc `Bearer <token>`)
4. Gọi các endpoint ADMIN

DTO schema tự sinh từ `class-validator` nhờ Swagger plugin trong `nest-cli.json`.

---

## 15. Testing

| Lệnh | Mô tả |
|------|--------|
| `npm test` | Unit test (logic tính KPI, health controller) |
| `npm run test:cov` | Coverage report |
| `npm run test:e2e` | E2E test (cần MongoDB chạy) |

**Unit test hiện có:**
- `src/app.controller.spec.ts`
- `src/common/utils/kpi-calculate.util.spec.ts` — cover: không event, cap bonus 10, penalty, kết hợp, dưới ngưỡng thưởng

---

## 16. Tính năng đã bổ sung (v2.1)

| Tính năng | Endpoint / Script |
|-----------|-------------------|
| Tính KPI hàng loạt | `POST /api/kpi-results/calculate-period/:periodId` |
| Khóa kết quả KPI | `PATCH /api/kpi-results/:id/lock` |
| Nhân viên xem KPI | `GET /api/me/kpi-results` |
| Seed event types | `npm run seed:event-types` hoặc `npm run seed:all` |
| Audit log | Collection `auditlogs` — ghi tự động khi tạo/xóa event, tính/duyệt/khóa result, khóa user |
| `occurredAt`, `eventTypeSnapshot` | Có trên `KpiEvent` |
| Field HR trên User | `positionName`, `departmentName`, `managerId` |
| `code`, `year`, `month` trên KpiPeriod | Unique index `{ year, month }` và `code` |

### Backlog còn lại

| Tính năng | Ghi chú |
|-----------|---------|
| Chỉ ADMIN được login | Hiện ADMIN và EMPLOYEE đều login được; EMPLOYEE chỉ truy cập `/me/*` |
| API xem audit logs | Chưa có endpoint query `auditlogs` |
| E2E test cập nhật | File `test/app.e2e-spec.ts` cần cập nhật |

---

## 17. Tài liệu liên quan

| File | Nội dung |
|------|----------|
| `coding_rules.md` | Tiêu chuẩn viết code, review checklist |
| `.env.example` | Biến môi trường mẫu |
| `http://localhost:3000/api/docs` | API reference tương tác (khi server chạy) |

---

## 18. References

- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Mongoose](https://docs.nestjs.com/techniques/mongodb)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [NestJS OpenAPI (Swagger)](https://docs.nestjs.com/openapi/introduction)
- [Mongoose Schemas](https://mongoosejs.com/docs/guide.html)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
