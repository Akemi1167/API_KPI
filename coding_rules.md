# Tiêu chuẩn Code API cho dự án NestJS và MongoDB

**Tài liệu áp dụng cho:** API quản lý KPI xây dựng bằng **NestJS**, **MongoDB**, **Mongoose**, **JWT Authentication** và **Admin Authorization**.  
**Mục tiêu:** thống nhất cách viết code, cách tổ chức module, cách đặt tên, chuẩn response, chuẩn validate dữ liệu, xử lý lỗi, bảo mật và logging để dự án dễ bảo trì, dễ review và dễ mở rộng.

## 1. Nguyên tắc chung

Code API phải ưu tiên **rõ ràng, nhất quán, dễ kiểm thử và dễ bảo trì**. Một API tốt không chỉ chạy đúng nghiệp vụ, mà còn phải có cấu trúc dễ đọc, xử lý lỗi nhất quán, validate đầu vào đầy đủ và không làm lộ dữ liệu nhạy cảm. NestJS hỗ trợ mô hình module, controller, provider và dependency injection, vì vậy dự án nên tận dụng các thành phần này để tách biệt trách nhiệm rõ ràng.[1]

> Mỗi file, class, method và endpoint chỉ nên phục vụ một mục đích chính. Nếu một service hoặc controller bắt đầu chứa quá nhiều logic, cần tách nhỏ thành service phụ, helper hoặc module riêng.

| Nguyên tắc | Tiêu chuẩn áp dụng |
|---|---|
| Rõ trách nhiệm | Controller nhận request và trả response; Service xử lý nghiệp vụ; Repository/Model thao tác database. |
| Không lặp code | Logic dùng chung phải đưa vào helper, decorator, guard, pipe hoặc service dùng chung. |
| Validate đầu vào | Tất cả request body và query quan trọng phải có DTO và `class-validator`. |
| Không lộ dữ liệu nhạy cảm | Không trả về `passwordHash`, secret, token nội bộ hoặc thông tin hệ thống. |
| Xử lý lỗi nhất quán | Dùng exception chuẩn của NestJS như `BadRequestException`, `UnauthorizedException`, `NotFoundException`. |
| Có log cần thiết | Log lỗi hệ thống, hành động admin quan trọng và các thao tác ảnh hưởng KPI. |

## 2. Cấu trúc thư mục chuẩn

Dự án phải tổ chức theo module nghiệp vụ. Mỗi module có controller, service, DTO và schema riêng. Các phần dùng chung như guard, decorator, enum, filter, interceptor được đặt trong thư mục `common`.

```txt
src/
  main.ts
  app.module.ts
  common/
    decorators/
    enums/
    filters/
    guards/
    interceptors/
    pipes/
    utils/
  auth/
    auth.module.ts
    auth.controller.ts
    auth.service.ts
    dto/
    strategies/
  users/
    users.module.ts
    users.controller.ts
    users.service.ts
    dto/
    schemas/
  kpi/
    kpi.module.ts
    controllers/
    services/
    dto/
    schemas/
```

| Thư mục | Quy định |
|---|---|
| `common/decorators` | Chứa decorator dùng chung như `@CurrentUser()` và `@Roles()`. |
| `common/guards` | Chứa guard xác thực và phân quyền như `JwtAuthGuard`, `RolesGuard`. |
| `common/enums` | Chứa enum dùng chung như `UserRole`, `KpiEventKind`, `KpiPeriodStatus`. |
| `auth` | Chỉ xử lý đăng nhập, JWT strategy, xác thực và thông tin tài khoản hiện tại. |
| `users` | Quản lý user, admin, nhân viên, trạng thái tài khoản. |
| `kpi` | Quản lý kỳ KPI, danh mục cộng/trừ điểm, KPI event và KPI result. |

## 3. Quy tắc đặt tên

Tên file, class, method và biến phải nhất quán. Tên phải thể hiện đúng mục đích, tránh viết tắt khó hiểu. Tên API endpoint phải dùng danh từ số nhiều và tuân thủ RESTful convention.

| Thành phần | Quy tắc | Ví dụ đúng | Ví dụ không nên dùng |
|---|---|---|---|
| File | Dùng kebab-case. | `create-kpi-event.dto.ts` | `CreateKpiEventDTO.ts` |
| Class | Dùng PascalCase. | `KpiEventsService` | `kpi_events_service` |
| Method | Dùng camelCase, bắt đầu bằng động từ. | `calculateForUser()` | `kpiCalc()` |
| Biến | Dùng camelCase. | `finalScore` | `final_score` |
| Enum value | Dùng UPPER_SNAKE_CASE. | `ADMIN`, `PENALTY` | `Admin`, `penalty` |
| Endpoint | Dùng kebab-case và danh từ số nhiều. | `/kpi-events` | `/kpiEvent` |

## 4. Chuẩn thiết kế Controller

Controller chỉ làm nhiệm vụ nhận request, gọi service và trả response. Controller không được chứa logic tính KPI, không hash password trực tiếp, không query database trực tiếp và không xử lý nghiệp vụ phức tạp.

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('kpi-events')
export class KpiEventsController {
  constructor(private readonly kpiEventsService: KpiEventsService) {}

  @Post()
  create(@Body() dto: CreateKpiEventDto, @CurrentUser() admin: CurrentUserPayload) {
    return this.kpiEventsService.create(dto, admin.id);
  }

  @Get()
  findAll(@Query() query: FindKpiEventsQueryDto) {
    return this.kpiEventsService.findAll(query);
  }
}
```

| Nên làm | Không nên làm |
|---|---|
| Dùng DTO cho `@Body()` và `@Query()`. | Nhận `any` hoặc object không rõ kiểu. |
| Gọi service để xử lý nghiệp vụ. | Viết logic tính toán KPI trong controller. |
| Dùng guard và role decorator. | Kiểm tra role thủ công bằng `if` lặp lại ở từng method. |
| Trả dữ liệu đã được service chuẩn hóa. | Trả trực tiếp document có dữ liệu nhạy cảm. |

## 5. Chuẩn thiết kế Service

Service là nơi xử lý nghiệp vụ chính. Với dự án KPI, service phải kiểm tra kỳ KPI có đang mở không, user có tồn tại không, event type có hợp lệ không, điểm cộng/trừ có đúng dấu không và kết quả KPI có được phép tính lại không.

```ts
async create(dto: CreateKpiEventDto, adminId: string) {
  const period = await this.kpiPeriodModel.findById(dto.periodId);
  if (!period) {
    throw new NotFoundException('Không tìm thấy kỳ KPI');
  }

  if (period.status !== KpiPeriodStatus.OPEN) {
    throw new BadRequestException('Kỳ KPI đã khóa hoặc đã đóng');
  }

  const eventType = await this.kpiEventTypeModel.findById(dto.eventTypeId);
  if (!eventType || !eventType.isActive) {
    throw new NotFoundException('Loại cộng/trừ điểm không hợp lệ');
  }

  const points = dto.points ?? eventType.defaultPoints;
  this.validateEventPoints(eventType.eventKind, points);

  return this.kpiEventModel.create({
    ...dto,
    points,
    quantity: dto.quantity ?? 1,
    totalPoints: points * (dto.quantity ?? 1),
    eventKind: eventType.eventKind,
    createdBy: adminId,
  });
}
```

Service không nên trả dữ liệu raw nếu dữ liệu đó có trường nhạy cảm hoặc không cần thiết. Nếu response cần format riêng, nên dùng mapper hoặc hàm serialize riêng để tránh lặp code.

## 6. Chuẩn DTO và Validation

Mọi API nhận dữ liệu từ client phải có DTO. DTO dùng `class-validator` để kiểm tra kiểu dữ liệu, độ dài, enum, ObjectId và các trường bắt buộc. NestJS hỗ trợ validation pipe để tự động validate DTO trước khi vào controller.[2]

```ts
export class CreateKpiEventDto {
  @IsMongoId()
  userId: string;

  @IsMongoId()
  periodId: string;

  @IsMongoId()
  eventTypeId: string;

  @IsOptional()
  @IsNumber()
  points?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsUrl()
  evidenceUrl?: string;
}
```

| Loại dữ liệu | Decorator nên dùng |
|---|---|
| MongoDB ObjectId | `@IsMongoId()` |
| Email | `@IsEmail()` |
| Enum | `@IsEnum()` |
| Chuỗi | `@IsString()`, `@MinLength()`, `@MaxLength()` |
| Số | `@IsNumber()`, `@IsInt()`, `@Min()`, `@Max()` |
| Ngày tháng | `@IsDateString()` |
| Trường không bắt buộc | `@IsOptional()` |

Trong `main.ts`, cần bật global validation pipe để loại bỏ các trường không khai báo trong DTO và tự động transform kiểu dữ liệu khi cần.

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

## 7. Chuẩn Schema Mongoose

Schema Mongoose phải khai báo rõ required field, enum, default value, index và timestamp. Không nên để schema quá lỏng lẻo vì dữ liệu KPI ảnh hưởng đến thưởng/phạt. Mongoose hỗ trợ định nghĩa schema, model, middleware và validation ở tầng application.[3]

```ts
@Schema({ timestamps: true })
export class KpiEvent {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'KpiPeriod', required: true })
  periodId: Types.ObjectId;

  @Prop({ enum: KpiEventKind, required: true })
  eventKind: KpiEventKind;

  @Prop({ required: true })
  points: number;

  @Prop({ default: 1, min: 1 })
  quantity: number;

  @Prop({ required: true })
  totalPoints: number;
}

export const KpiEventSchema = SchemaFactory.createForClass(KpiEvent);
KpiEventSchema.index({ userId: 1, periodId: 1 });
KpiEventSchema.index({ periodId: 1, eventKind: 1 });
```

| Quy tắc | Lý do |
|---|---|
| Dùng `timestamps: true` | Tự động có `createdAt` và `updatedAt`. |
| Đặt index cho query thường dùng | Tối ưu truy vấn theo user, kỳ KPI và loại event. |
| Dùng enum cho trạng thái | Tránh lưu dữ liệu sai như `opened`, `Open`, `active_period`. |
| Dùng `select: false` cho `passwordHash` | Tránh trả password hash ra API. |
| Không lạm dụng nested object | Dễ làm dữ liệu khó query và khó migrate. |

## 8. Chuẩn API Response

API nên trả response nhất quán để frontend dễ xử lý. Với các endpoint trả dữ liệu đơn, response nên có `data`. Với danh sách phân trang, response nên có `data` và `meta`. Với lỗi, response nên có `statusCode`, `message`, `error` và `path` nếu dùng exception filter.

### 8.1. Response thành công

```json
{
  "data": {
    "id": "6660...",
    "employeeCode": "NV001",
    "fullName": "Nguyễn Văn A"
  }
}
```

### 8.2. Response danh sách

```json
{
  "data": [
    {
      "id": "6660...",
      "employeeCode": "NV001",
      "fullName": "Nguyễn Văn A"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 8.3. Response lỗi

```json
{
  "statusCode": 400,
  "message": "Kỳ KPI đã khóa hoặc đã đóng",
  "error": "Bad Request",
  "path": "/kpi-events",
  "timestamp": "2026-06-10T10:00:00.000Z"
}
```

## 9. Chuẩn phân trang, lọc và sắp xếp

Các endpoint danh sách phải hỗ trợ phân trang. Không nên trả toàn bộ dữ liệu nếu collection có khả năng tăng lớn như `kpi_events`. Query mặc định nên giới hạn `limit = 20` và tối đa `limit = 100`.

| Query | Ý nghĩa | Giá trị mặc định |
|---|---|---:|
| `page` | Trang hiện tại. | `1` |
| `limit` | Số bản ghi mỗi trang. | `20` |
| `sortBy` | Trường sắp xếp. | `createdAt` |
| `sortOrder` | Thứ tự sắp xếp. | `desc` |
| `keyword` | Từ khóa tìm kiếm. | Không có |

```ts
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
```

## 10. Chuẩn xử lý lỗi

Không được dùng `throw new Error()` cho lỗi nghiệp vụ. NestJS đã cung cấp các HTTP exception phù hợp để trả status code đúng ngữ cảnh.[4]

| Tình huống | Exception nên dùng | HTTP status |
|---|---|---:|
| Dữ liệu đầu vào sai | `BadRequestException` | `400` |
| Chưa đăng nhập hoặc token sai | `UnauthorizedException` | `401` |
| Không đủ quyền | `ForbiddenException` | `403` |
| Không tìm thấy dữ liệu | `NotFoundException` | `404` |
| Dữ liệu trùng unique | `ConflictException` | `409` |
| Lỗi hệ thống không mong muốn | `InternalServerErrorException` | `500` |

Thông báo lỗi cho client nên rõ ràng nhưng không làm lộ chi tiết hệ thống. Ví dụ, không trả stack trace, connection string, secret hoặc nội dung query nội bộ.

## 11. Chuẩn Authentication và Authorization

Tất cả endpoint quản trị phải yêu cầu JWT và role `ADMIN`. Endpoint public duy nhất trong giai đoạn MVP nên là `POST /auth/login`. Password phải được hash bằng bcrypt trước khi lưu. JWT payload chỉ nên chứa thông tin tối thiểu như user id, email và role.

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('kpi-results')
export class KpiResultsController {
  // Admin-only endpoints
}
```

| Quy tắc bảo mật | Yêu cầu |
|---|---|
| Password | Bắt buộc hash, không lưu plain text. |
| JWT secret | Lưu trong biến môi trường, không commit lên Git. |
| Admin endpoint | Bắt buộc dùng `JwtAuthGuard` và `RolesGuard`. |
| Response user | Không trả `passwordHash`. |
| Tài khoản bị khóa | Không cho đăng nhập hoặc thao tác. |
| Token hết hạn | Client phải đăng nhập lại hoặc dùng refresh token nếu có thiết kế thêm. |

## 12. Chuẩn tính KPI

Logic tính KPI phải nằm trong `KpiResultsService`, không đặt trong controller. Điểm cộng phải giới hạn tối đa 10 điểm/tháng theo quy chế. Điểm phạt là số âm và được cộng trực tiếp vào điểm cuối cùng.

```ts
const rawBonus = events
  .filter((event) => event.eventKind === KpiEventKind.BONUS)
  .reduce((sum, event) => sum + event.totalPoints, 0);

const bonusPoints = Math.min(rawBonus, 10);

const penaltyPoints = events
  .filter((event) => event.eventKind === KpiEventKind.PENALTY)
  .reduce((sum, event) => sum + event.totalPoints, 0);

const finalScore = baseScore + bonusPoints + penaltyPoints;
```

| Điều kiện | Kết quả |
|---|---|
| `finalScore >= 100` | Xếp loại `Xuất sắc`, thưởng `150%`. |
| `finalScore >= 95` | Xếp loại `Tốt`, thưởng `120%`. |
| `finalScore >= 90` | Xếp loại `Đạt`, thưởng `100%`. |
| `finalScore >= 80` | Xếp loại `Đạt`, thưởng `50%`. |
| `finalScore < 80` | Không thưởng. |

## 13. Chuẩn logging và audit

Các hành động admin ảnh hưởng đến KPI cần có log hoặc audit trail. Tối thiểu nên lưu `createdBy`, `updatedBy`, `approvedBy`, `createdAt` và `updatedAt` trong các collection quan trọng. Nếu hệ thống có yêu cầu kiểm toán cao hơn, nên tạo thêm collection `audit_logs`.

| Hành động | Cần log |
|---|---|
| Admin đăng nhập thất bại nhiều lần | Có |
| Tạo, sửa, xóa KPI event | Có |
| Tính lại KPI | Có |
| Duyệt hoặc khóa kết quả KPI | Có |
| Khóa hoặc mở tài khoản user | Có |

Log kỹ thuật nên ghi vào logger của backend. Audit nghiệp vụ nên lưu trong database để truy vết. Không nên lưu password, token hoặc thông tin nhạy cảm trong log.

## 14. Chuẩn transaction và tính nhất quán dữ liệu

MongoDB hỗ trợ transaction cho các thao tác cần tính nguyên tử trên nhiều document hoặc nhiều collection.[5] Trong MVP, việc tạo một `kpi_event` và tính lại `kpi_result` có thể tách thành hai bước. Tuy nhiên, nếu muốn sau khi nhập event hệ thống tự động cập nhật result ngay, nên dùng transaction để tránh tình trạng event được tạo nhưng result chưa cập nhật.

| Trường hợp | Có nên dùng transaction không? |
|---|---|
| Chỉ tạo một KPI event | Không bắt buộc. |
| Tạo KPI event và cập nhật KPI result cùng lúc | Nên dùng. |
| Khóa kỳ KPI và khóa toàn bộ result trong kỳ | Nên dùng. |
| Import hàng loạt KPI event | Nên dùng batch processing và có log lỗi. |

## 15. Chuẩn môi trường và cấu hình

Tất cả cấu hình phải lấy từ environment variables. Không được commit file `.env` thật lên Git. Có thể commit `.env.example` để hướng dẫn cấu hình môi trường.

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/kpi_management
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=1d
BCRYPT_SALT_ROUNDS=10
```

| File | Quy định |
|---|---|
| `.env` | Chứa cấu hình thật, không commit. |
| `.env.example` | Chứa cấu hình mẫu, được phép commit. |
| `ConfigModule` | Nên bật `isGlobal: true`. |
| Secret | Không hard-code trong source code. |

## 16. Chuẩn format code

Dự án nên dùng ESLint và Prettier để thống nhất style. Không merge code nếu còn lỗi lint hoặc format. Code phải ưu tiên type rõ ràng, hạn chế dùng `any`.

| Quy tắc | Tiêu chuẩn |
|---|---|
| Indent | 2 spaces. |
| Quote | Single quote. |
| Semicolon | Có semicolon. |
| Kiểu dữ liệu | Hạn chế `any`; ưu tiên interface, type hoặc class. |
| Function | Không nên quá dài; nếu dài nên tách nhỏ. |
| Comment | Chỉ comment khi logic nghiệp vụ khó hiểu, không comment những điều hiển nhiên. |

## 17. Chuẩn Git và Pull Request

Mỗi pull request nên nhỏ, tập trung một mục tiêu. Trước khi tạo PR, developer cần chạy test, lint và kiểm tra API cơ bản. Commit message nên rõ ý nghĩa.

| Loại commit | Ví dụ |
|---|---|
| Feature | `feat(kpi): add create kpi event api` |
| Fix bug | `fix(auth): prevent inactive admin login` |
| Refactor | `refactor(users): extract user mapper` |
| Docs | `docs(api): update kpi endpoint specification` |
| Test | `test(kpi): add calculate score unit tests` |

Checklist PR nên gồm các mục: code đã lint, DTO đã validate, endpoint đã có guard nếu cần, không trả dữ liệu nhạy cảm, đã test case chính và đã cập nhật tài liệu API nếu có thay đổi.

## 18. Chuẩn testing

Service chứa logic nghiệp vụ phải có unit test. Các API quan trọng như login, tạo KPI event, tính KPI và khóa kỳ KPI nên có integration test hoặc e2e test. NestJS hỗ trợ testing utilities để tạo testing module và mock provider.[6]

| Loại test | Nên áp dụng cho |
|---|---|
| Unit test | Service tính KPI, service auth, mapper, helper. |
| Integration test | API tạo event, API tính KPI, API đăng nhập. |
| E2E test | Luồng admin đăng nhập, nhập event, tính KPI, xem kết quả. |

Các case tính KPI tối thiểu cần test gồm: không có event, chỉ có điểm cộng, điểm cộng vượt 10, chỉ có điểm trừ, vừa cộng vừa trừ, user không tồn tại và kỳ KPI bị khóa.

## 19. Checklist review code API

Trước khi merge code, reviewer cần kiểm tra cả nghiệp vụ, bảo mật và chất lượng code. Checklist này nên được dùng thống nhất trong team để tránh lỗi lặp lại.

| Hạng mục | Câu hỏi kiểm tra |
|---|---|
| Controller | Controller có mỏng không, có logic nghiệp vụ không? |
| Service | Service có validate nghiệp vụ đầy đủ không? |
| DTO | Request body/query có DTO và validator chưa? |
| Auth | Endpoint quản trị đã có guard và role admin chưa? |
| Security | Có trả password hash, token hoặc secret không? |
| Error handling | Có dùng exception đúng loại không? |
| Database | Schema có index phù hợp chưa? |
| KPI logic | Điểm cộng đã giới hạn tối đa 10 chưa? |
| Testing | Logic quan trọng đã có test chưa? |
| Documentation | Nếu thay đổi API, tài liệu đã cập nhật chưa? |

## 20. References

[1]: https://docs.nestjs.com/modules "NestJS Modules Documentation"  
[2]: https://docs.nestjs.com/techniques/validation "NestJS Validation Documentation"  
[3]: https://mongoosejs.com/docs/guide.html "Mongoose Schemas Documentation"  
[4]: https://docs.nestjs.com/exception-filters "NestJS Exception Filters Documentation"  
[5]: https://www.mongodb.com/docs/manual/core/transactions/ "MongoDB Transactions Documentation"  
[6]: https://docs.nestjs.com/fundamentals/testing "NestJS Testing Documentation"
