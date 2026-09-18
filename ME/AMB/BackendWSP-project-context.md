# BackendWSP — Project Context สำหรับ AI (ฉบับสมบูรณ์ล่าสุด)

> เอกสารนี้สรุปสถานะปัจจุบันของโปรเจกต์ทั้งหมด ใช้เป็น context เริ่มต้นเวลาคุยกับ AI ตัวใหม่ (Claude, ChatGPT ฯลฯ) เพื่อให้ทำงานต่อได้ทันทีโดยไม่ต้องอธิบายใหม่ตั้งแต่ต้น — ไฟล์นี้แทนที่ไฟล์ context เก่าทั้งหมด (รวมทุกอย่างจนถึง Settings module)

---

## 1. ภาพรวมโปรเจกต์

- **ชื่อโปรเจกต์:** BackendWSP
- **ประเภท:** Backend REST API สำหรับระบบ Internal WEB POS (ใช้งานภายในร้าน ไม่เปิดสู่สาธารณะ)
- **Path:** `D:\BackendWSP` (Windows)
- **Frontend (แยกโปรเจกต์):** Vite + React + TypeScript, รันที่ `http://localhost:5173`
- **Backend:** รันที่ `http://localhost:3000/api` (มี global prefix `/api`)
- **สถานะ:** ✅ **ครบทุก module ตามแผนเดิมแล้ว** (Shifts ถูกข้ามไปโดยตั้งใจ เพราะร้านไม่ต้องการ)
- **ผู้พัฒนา:** เรียนรู้ไปพร้อมกับพัฒนา ต้องการคำอธิบาย what/why/how ทุกขั้นตอน ทำทีละ phase
- **ภาษาที่ใช้คุย:** ไทย (โค้ด/คำสั่ง/ศัพท์เทคนิคเป็นอังกฤษ)

## 2. Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | NestJS **12.0.1** (ตั้งใจไว้แต่แรกคือ 11 แต่เลื่อนขึ้นมาโดยไม่ตั้งใจ — ดูข้อ 3) |
| Language | TypeScript, ESM (`module: nodenext`, `moduleResolution: nodenext`) |
| Database | PostgreSQL ผ่าน Supabase |
| Auth | Supabase Auth + JWT verify ผ่าน JWKS (`jose` library) |
| ORM/Client | `@supabase/supabase-js` + PostgreSQL RPC functions (ไม่ใช้ ORM) |
| Validation | `class-validator` + `class-transformer` + NestJS `ValidationPipe` |
| Email | Resend (`resend`) — ใช้ test domain `onboarding@resend.dev` |
| Excel export | `exceljs` |
| Scheduling | `@nestjs/schedule` (cron) |
| Rate limiting | `@nestjs/throttler` (ติดตั้งด้วย `--legacy-peer-deps` เพราะ v12 ใหม่เกินไป) |
| Test runner | Vitest / Linter: oxlint |

## 3. ⚠️ หมายเหตุสำคัญ — เวอร์ชัน NestJS

โปรเจกต์ใช้ **NestJS 12.0.1** จริง (เลื่อนขึ้นมาจาก 11 โดยไม่ตั้งใจระหว่างติดตั้ง package อื่น) — **ตัดสินใจแล้วว่าจะอยู่กับ v12 ต่อ ไม่ downgrade** เพราะทดสอบทำงานได้ปกติทุกอย่าง แต่ third-party package บางตัวอาจยังไม่รองรับ v12 อย่างเป็นทางการ (v12 ออกเมื่อ 27 ส.ค. 2026 ใหม่มาก) — ถ้าเจอ `ERESOLVE` error ตอนติดตั้ง package ใหม่ในอนาคต ใช้ `--legacy-peer-deps` ได้เลย (มีเหตุผลรองรับชัดเจนแล้ว)

## 4. Coding Conventions ที่ต้องยึดตามเสมอ

1. **ESM imports ต้องมี `.js` ต่อท้าย relative path เสมอ** เช่น `from './app.service.js'`
2. **`import type { X }` สำหรับ type-only imports** (เช่น DTO ที่ใช้ใน Service, `Request` จาก express) — ยกเว้น DTO ที่ใช้กับ `@Body()` ใน Controller ต้อง import แบบ value ปกติ (ValidationPipe ต้องใช้ runtime)
3. **Database column และ API response ใช้ `snake_case` เสมอ** ไม่แปลง camelCase
4. **Response format มาตรฐาน:**
   - สำเร็จ (single): `{ "data": {...} }`
   - สำเร็จ (list): `{ "data": [...], "meta": { "total": N } }`
   - Error: `{ "statusCode", "message", "error", "timestamp", "path", ...extraFields }` — `HttpExceptionFilter` รองรับ field พิเศษเพิ่มเติมจาก exception object ด้วย (spread เข้าไปใน response)
5. **RESTful convention:** คำนามพหูพจน์, HTTP method บอก action, action พิเศษที่ไม่ใช่ CRUD ใช้ path ต่อท้าย เช่น `POST /api/sales/:id/cancel`
6. **Path parameter ที่เป็น UUID ต้องใช้ `@Param('id', ParseUUIDPipe)` เสมอ**
7. **ทุก Controller ต้องมี `@UseGuards(AuthGuard, RolesGuard)`** (ระดับ class) + `@Roles(...)` เฉพาะจุดที่จำกัดสิทธิ์
8. **ห้าม hardcode `created_by`/`cashier_id`/`cancelled_by`/`actorId`/`updated_by` จาก client** ต้องดึงจาก `request.user.id` เสมอ
9. **Logic ที่ต้อง atomic (insert หลายตารางพร้อมกัน) เขียนเป็น PostgreSQL RPC function** (`language plpgsql`, `security definer`) — ดูตัวอย่าง `create_sale`, `cancel_sale`, `create_inventory_movement`
10. **ทุกตารางเปิด RLS เสมอ**
11. **Error message จาก PostgreSQL function ใช้ prefix ชัดเจน** เช่น `INSUFFICIENT_STOCK:`, `ALREADY_CANCELLED:` เพื่อให้ Service แยกประเภทได้ด้วย `error.message.includes(...)`
12. **Audit Logs:** CREATE/DELETE ใช้ `@Audit('CREATE'|'DELETE', 'resource_type')` decorator (auto-capture ผ่าน global interceptor); UPDATE ต้อง log เองใน Service ด้วย `this.auditService.log({...})` (fire-and-forget, ไม่ await) เพราะต้องรู้ `old_value` ก่อนแก้
13. **Single-row config table** (เช่น `settings`) ใช้ pattern `id integer primary key default 1 check (id = 1)` บังคับมีแค่แถวเดียว
14. **field ที่เป็น JSON แบบ merge ได้ (เช่น `settings.extra`)** ต้อง merge กับของเดิมตอน update ไม่เขียนทับทั้งหมด

## 5. Environment Variables (`.env`)

```env
PORT=3000
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_JWKS_URL=
RESEND_API_KEY=
REPORT_EMAIL_TO=
```

- `.env` ไม่เคยหลุดเข้า git (ยืนยันแล้ว)
- `SUPABASE_SECRET_KEY` เคยหลุดในแชทและถูก regenerate ไปแล้วครั้งหนึ่ง — ระวังอย่า paste secret key ในแชทอีก
- JWT expiry ปรับเป็นค่ายาว (~24h) ชั่วคราวเพื่อ dev — **ต้องปรับกลับให้สั้นก่อน production** พร้อมทำ refresh token flow ที่ Frontend

## 6. Database Schema ทั้งหมด (schema `public`)

### `users`
1:1 กับ `auth.users` ผ่าน FK ที่ `id`
- `id` (uuid, PK, FK→auth.users.id, cascade), `email`, `full_name`, `role` (CHECK: `ADMIN`/`MANAGER`/`CASHIER`/`VIEWER`), `is_active`, `created_at`, `updated_at`
- Auto-provisioning: user ใหม่ login ครั้งแรก → สร้าง record นี้อัตโนมัติผ่าน `AuthGuard`, default role = `CASHIER`

### `categories`
- `id` (uuid, PK), `category_name`, `parent_id` (self-referencing FK, nullable, on delete set null — โครงสร้าง parent-child), `created_at`, `updated_at`

### `products`
- `id` (uuid, PK), `product_name`, `unit_price` (numeric(10,2), CHECK≥0), **`cost_price`** (numeric(10,2), NOT NULL, CHECK≥0 — เพิ่มตอนทำ Promotions), `stock_quantity` (cache, sync กับ inventory_movements), `category_id` (uuid, NOT NULL FK), `is_active`, `created_at`, `updated_at`
- ⚠️ สินค้าเก่า (โค้ก, เป๊ปซี่) มี `cost_price` เป็นค่าประมาณการชั่วคราว (backfill 70% ของ unit_price ตอน migrate) — ต้องแก้ให้ตรงต้นทุนจริงทีหลัง

### `inventory_movements`
- `id`, `product_id` (NOT NULL FK), `movement_type` (CHECK: `RECEIVE`/`ADJUSTMENT`/`SALE`), `quantity_change` (delta +/-), `reason` (nullable), `created_by` (NOT NULL FK→users), `created_at` — **immutable, ไม่มี updated_at**

### `sales`
- `id`, `cashier_id` (NOT NULL FK), **`customer_id`** (nullable FK→customers — เพิ่มตอนทำ Customers module), `total_amount` (คำนวณที่ RPC เสมอ), `payment_method` (CHECK: `CASH`/`TRANSFER`/`CARD`), `status` (CHECK: `COMPLETED`/`CANCELLED`, default COMPLETED), `cancelled_at`, `cancelled_by`, `created_at`

### `sale_items`
- `id`, `sale_id` (FK, **on delete cascade**), `product_id` (FK), `quantity` (CHECK>0), `unit_price` (**เก็บราคา ณ ตอนขาย** แยกจาก products.unit_price ปัจจุบัน), `subtotal`, `created_at`

### `customers` (เพิ่มตอนทำ Customers module)
- `id` (uuid, PK), `full_name` (NOT NULL), `phone` (nullable, indexed), `email` (nullable), `created_at`, `updated_at`

### `audit_logs` (เพิ่มตอนทำ Audit Logs module)
- `id`, `actor_id` (NOT NULL FK→users), `action` (CHECK: `CREATE`/`UPDATE`/`DELETE`), `resource_type` (text, ไม่ใช่ FK — รองรับได้ทุก resource), `resource_id` (nullable), `old_value`/`new_value` (jsonb, nullable), `created_at` — immutable

### `promotions` (เพิ่มตอนทำ Promotions module)
- `id`, `product_id` (NOT NULL FK), `sale_price` (numeric(10,2), CHECK≥0 — ราคาขายพิเศษตายตัว ไม่ใช่ % หรือลดเป็นบาท), `is_below_cost` (boolean, คำนวณตอนสร้างเทียบกับ cost_price), `is_active` (toggle, ไม่มีวันหมดอายุ), `created_by`, `created_at`, `updated_at`

### `settings` (เพิ่มตอนทำ Settings module — module สุดท้าย)
- **Single-row table** บังคับด้วย `id integer primary key default 1 check (id = 1)`
- `low_stock_threshold` (integer, default 10), `vat_rate` (numeric(5,2), 0-100, **ยังไม่ผูกเข้า Sales calculation** — เก็บไว้ใช้อนาคต), `extra` (jsonb, default `{}` — ช่องอิสระใส่ key-value อะไรก็ได้ เช่น shop_name, phone; merge กับของเดิมตอน update ไม่เขียนทับ), `updated_at`, `updated_by`

### PostgreSQL RPC Functions

| Function | หน้าที่ |
|---|---|
| `create_inventory_movement(p_product_id, p_movement_type, p_quantity_change, p_reason, p_created_by)` | Insert movement + update stock แบบ atomic |
| `create_sale(p_cashier_id, p_payment_method, p_items jsonb, p_customer_id uuid default null)` | ล็อก product rows (`FOR UPDATE`) → ตรวจสอบสต็อก/ราคาทุกรายการ → สร้าง sale+sale_items → หักสต็อก all-or-nothing; `p_customer_id` เป็นพารามิเตอร์สุดท้ายเสมอ (มี default) |
| `cancel_sale(p_sale_id, p_cancelled_by)` | คืนสต็อก (ผ่าน `ADJUSTMENT` movements) + status→CANCELLED, กันยกเลิกซ้ำ |
| `get_daily_sales_report(p_date date)` | คืน `total_sales`, `total_bills`, `top_products` (เฉพาะ `status='COMPLETED'`) |

## 7. RBAC — Roles และสิทธิ์

| Resource | ดู | สร้าง | แก้ไข | ลบ |
|---|---|---|---|---|
| Products/Categories | ทุก role | ADMIN, MANAGER | ADMIN, MANAGER | ADMIN, MANAGER |
| Inventory | ทุก role | ADMIN, MANAGER | — | — |
| Sales | ทุก role | **ADMIN, MANAGER, CASHIER** | — | cancel: ADMIN, MANAGER |
| Customers | ทุก role | **ทุก role** (cashier มักกรอกตอนขาย) | ADMIN, MANAGER | ADMIN, MANAGER |
| Promotions | ทุก role | ADMIN, MANAGER | ADMIN, MANAGER | — |
| Reports/Email | — | ADMIN, MANAGER เท่านั้น (ดูและส่งรายงาน) | — | — |
| Audit Logs | **ADMIN เท่านั้น** (ไม่ใช่ MANAGER) | (auto) | — | — |
| Settings | ทุก role | — | **ADMIN เท่านั้น** | — |

**หลักการ:** endpoint ไม่มี `@Roles(...)` = ทุก role ที่ login แล้วเข้าถึงได้

## 8. Module ทั้งหมด (path หลัก)

```
src/
├── main.ts                — bootstrap, CORS, ValidationPipe, HttpExceptionFilter, LoggingInterceptor
├── app.module.ts           — root (ThrottlerModule, ScheduleModule global)
├── supabase/                — SupabaseService (client wrapper)
├── auth/                     — AuthGuard (JWT+JWKS verify + auto-provision), GET /api/auth/me
├── users/                     — UsersService, UserRole type, UserProfile interface
├── common/
│   ├── filters/http-exception.filter.ts   — global error format + spreads extra exception fields + logs 500s
│   ├── interceptors/logging.interceptor.ts — logs ทุก HTTP request
│   ├── guards/roles.guard.ts
│   └── decorators/roles.decorator.ts
├── audit/                      — AuditService, @Audit() decorator, AuditInterceptor (APP_INTERCEPTOR), GET /api/audit-logs (ADMIN)
├── products/                    — CRUD, cost_price required, audit wired
├── categories/                   — CRUD, parent-child, audit wired
├── inventory/                     — POST /movements (RPC), GET /products/:id/movements
├── sales/                          — POST, GET /:id, POST /:id/cancel, rate-limited (10/min)
├── customers/                       — CRUD + search, audit wired
├── promotions/                       — POST/PATCH/GET, cost-price confirmation flow, audit wired
├── settings/                          — GET/PATCH single-row settings, extra merge logic
├── reports/
│   ├── reports.service.ts            — เรียก RPC get_daily_sales_report
│   ├── reports.controller.ts         — GET /daily-sales, POST /daily-sales/send
│   └── reports.scheduler.ts          — cron เที่ยงคืน ส่งรายงานของเมื่อวาน
└── email/                              — EmailService (Resend + exceljs)
```

**Circular dependency ที่ต้องจำ:** `EmailModule` ↔ `ReportsModule` ใช้ `forwardRef()` ทั้งสองฝั่ง

## 9. Infrastructure ที่ทำเสร็จแล้ว (ทั้งหมด)

Environment setup, Config, Supabase connection, JWT+JWKS Auth, Auto user-provisioning, RBAC (4 roles), CORS, Global error handling + ValidationPipe, Security review (`.env`/`node_modules` ไม่หลุด git), API convention (snake_case, `{data,meta}`), Application logging (request log + 500 error stack trace), Rate limiting (100/min global, 10/min บน sales)

## 10. Business Module ที่ทำเสร็จแล้ว (ทั้งหมด — ครบตามแผนเดิม)

✅ Products · ✅ Categories · ✅ Inventory · ✅ Sales+SaleItems (สร้าง/ยกเลิก, atomic) · ✅ Reports+Email (manual+scheduled, Excel attachment) · ✅ Customers (ผูกกับ Sales แบบ optional) · ✅ Audit Logs (Products/Categories/Customers wired) · ✅ Promotions (cost-price confirm flow) · ✅ Settings (low-stock threshold, VAT rate เตรียมไว้, extra JSON)

❌ Shifts — **ข้ามไปโดยตั้งใจ** (ร้านนี้ไม่ต้องการกระทบยอดเงินสด/แบ่งกะพนักงาน)

## 11. สิ่งที่ต้องทำก่อนขึ้น Production จริง (checklist ที่ค้างไว้)

- [ ] ลด Supabase JWT expiry กลับเป็นค่าสั้น + refresh token flow ที่ Frontend
- [ ] ซื้อ/verify domain จริงกับ Resend (ตอนนี้ใช้ test domain ส่งได้แค่ email ที่สมัคร Resend)
- [ ] แก้ `cost_price` ของสินค้าจริงทุกตัวให้ตรงกับต้นทุนจริง (ตอนนี้มีค่าประมาณการชั่วคราว)
- [ ] เปลี่ยนค่า CORS `origin` เป็น domain จริงของ Frontend
- [ ] ตัดสินใจว่าจะผูก `settings.vat_rate` เข้ากับการคำนวณใน `create_sale` RPC จริงหรือไม่ (ตอนนี้แค่เก็บค่าไว้)
- [ ] พิจารณา downgrade กลับ NestJS 11 ถ้าเจอ `--legacy-peer-deps` ซ้ำบ่อยกับ package ใหม่ในอนาคต
- [ ] อัปเดตสินค้าทดสอบ/ข้อมูลทดสอบทั้งหมดให้เป็นข้อมูลจริงก่อน launch (มี "Test Product", "โค้ก", "เป๊ปซี่" ทดสอบค้างอยู่)

## 12. Test User สำหรับ dev/testing

- `somchai@gmail.com` — role ปัจจุบัน `ADMIN`
- ขอ token: `POST https://[project-ref].supabase.co/auth/v1/token?grant_type=password` พร้อม `apikey: <publishable_key>` และ body `{"email","password"}`
- แนะนำ set เป็นตัวแปร CMD: `set TOKEN=<token>` แล้วใช้ `%TOKEN%` ในคำสั่งถัดไป

## 13. บทเรียน/Gotcha สำคัญที่เจอมา (กันเจอซ้ำ)

1. Nest CLI แปลงชื่อโปรเจกต์เป็น kebab-case เสมอ
2. `nodenext` บังคับ `.js` extension ทุก relative import
3. `isolatedModules`+`emitDecoratorMetadata` บังคับ `import type` สำหรับ type-only imports ที่อยู่ในบริบทมี decorator
4. NestJS module ไม่ re-export อัตโนมัติ — ต้อง export module ที่ import มาอย่างชัดเจนถ้า module อื่นต้องใช้ provider ข้างใน
5. Circular module dependency ต้องใช้ `forwardRef()` ทั้งสองฝั่ง
6. PostgreSQL แก้ CHECK constraint ต้อง DROP แล้ว ADD ใหม่ (ไม่มีคำสั่งแก้ตรงๆ)
7. เพิ่ม NOT NULL column ในตารางที่มีข้อมูลแล้ว: nullable→backfill→NOT NULL (3 ขั้น)
8. `FOR UPDATE` lock จำเป็นมากใน RPC function ที่แก้ไข stock เพื่อกัน race condition
9. Supabase `numeric` type ส่งผ่าน JSON เป็น string ต้อง `Number(...)` ก่อนใช้
10. curl บน Windows CMD มีปัญหากับ JSON ซับซ้อน (nested) — ใช้ `-d @filename.json` แทน
11. curl บน Windows CMD มีปัญหา encoding ภาษาไทยใน query string — ใช้ `-G --data-urlencode "key=ค่า"` แทน (แม้ `chcp 65001` ก็ไม่พอ)
12. `ParseUUIDPipe` ต้องใส่ทุกจุดที่รับ UUID path param ไม่งั้น invalid UUID จะเป็น 500 แทน 400
13. **ระวังไฟล์ที่ให้แก้มีบาง import/decorator ถูก comment ค้างโดยไม่ตั้งใจตอน copy-paste** — เจอหลายครั้ง (ThrottlerModule, @Throttle, ทั้ง audit.decorator.ts ที่หายไปทั้งไฟล์) วิธีเช็คคือ `type <file>` ดูเนื้อหาจริงเทียบกับที่ควรจะเป็นทุกครั้งที่ behavior ไม่ตรงกับที่คาด — **อย่าเชื่อว่าไฟล์ถูกสร้าง/แก้ไขแล้วจนกว่าจะยืนยันด้วย `type`/`dir` จริง**
14. `ConflictException`/exception อื่นๆ ส่ง object แทน string ได้ เพื่อแนบข้อมูลเพิ่มเติมในตัว error response — แต่ **`HttpExceptionFilter` แบบเดิมจะกรอง field พิเศษทิ้งถ้าไม่ได้ตั้งใจ spread เข้าไป** ต้องแก้ filter ให้เก็บ extra fields ไว้ด้วย (`...rest` จาก destructuring)
15. Single-row config table pattern: `id integer primary key default 1 check (id = 1)` + insert แถวแรกทันทีตอนสร้างตาราง
16. JSON field ที่ต้องการให้ "แก้ทีละ key ได้โดยไม่ลบ key อื่น" ต้อง merge (`{...old, ...new}`) ที่ Service ไม่ใช่เขียนทับตรงๆ

## 14. วิธีใช้เอกสารนี้

เปิดแชทใหม่ → วางเนื้อหาไฟล์นี้ทั้งหมด → บอก AI ว่าต้องการทำอะไรต่อ (เช่น แก้ bug, เพิ่มฟีเจอร์, เตรียม production) — AI จะเข้าใจโครงสร้าง, convention, และสถานะทั้งหมดทันที ไม่ต้องอธิบายใหม่ตั้งแต่ต้น
