# BackendWSP — Project Context สำหรับ AI (ใช้ต่อในอนาคต)

> เอกสารนี้สรุปสถานะปัจจุบันของโปรเจกต์ทั้งหมด ใช้เป็น context เริ่มต้นเวลาคุยกับ AI ตัวใหม่ (Claude, ChatGPT ฯลฯ) เพื่อให้ทำงานต่อได้ทันทีโดยไม่ต้องอธิบายใหม่ตั้งแต่ต้น

---

## 1. ภาพรวมโปรเจกต์

- **ชื่อโปรเจกต์:** BackendWSP
- **ประเภท:** Backend REST API สำหรับระบบ Internal WEB POS (ใช้งานภายในร้าน ไม่เปิดสู่สาธารณะ)
- **Path:** `D:\BackendWSP` (Windows)
- **Frontend (แยกโปรเจกต์):** Vite + React + TypeScript, รันที่ `http://localhost:5173`
- **Backend:** รันที่ `http://localhost:3000/api` (มี global prefix `/api`)
- **ผู้พัฒนา:** เรียนรู้ไปพร้อมกับพัฒนา ต้องการคำอธิบาย what/why/how ทุกขั้นตอน ทำทีละ phase ไม่ทำทุกอย่างพร้อมกัน
- **ภาษาที่ใช้คุย:** ไทย (โค้ด/คำสั่ง/ศัพท์เทคนิคเป็นอังกฤษ)

## 2. Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | NestJS **12.0.1** (⚠️ ดูหมายเหตุสำคัญข้อ 3) |
| Language | TypeScript, ESM (`module: nodenext`, `moduleResolution: nodenext`) |
| Database | PostgreSQL ผ่าน Supabase |
| Auth | Supabase Auth + JWT verify ผ่าน JWKS (`jose` library) |
| ORM/Client | `@supabase/supabase-js` (ไม่ใช้ ORM แยก เขียน query ตรงผ่าน Supabase client + PostgreSQL RPC functions) |
| Validation | `class-validator` + `class-transformer` + NestJS `ValidationPipe` |
| Email | Resend (`resend` package) — ใช้ test domain `onboarding@resend.dev` (ยังไม่ verify domain จริง) |
| Excel export | `exceljs` |
| Scheduling | `@nestjs/schedule` (cron) |
| Rate limiting | `@nestjs/throttler` |
| Test runner | Vitest (ไม่ใช่ Jest — เป็น default ของ NestJS 11+) |
| Linter | oxlint (ไม่ใช่ ESLint) |

## 3. ⚠️ หมายเหตุสำคัญ — เวอร์ชัน NestJS

โปรเจกต์ตั้งใจ fix ไว้ที่ **NestJS 11** ตั้งแต่ต้น แต่ระหว่างพัฒนา (ติดตั้ง `@nestjs/config`, `@nestjs/mapped-types`, `@nestjs/schedule` โดยไม่ล็อกเวอร์ชัน) เวอร์ชันถูกขยับขึ้นเป็น **NestJS 12.0.1** โดยไม่ตั้งใจ (NestJS 12 เพิ่งออกวันที่ 27 ส.ค. 2026 เป็นเวอร์ชันที่ใหม่มาก)

**ผลกระทบ:** third-party package บางตัว (เช่น `@nestjs/throttler@6.5.0`) ยังไม่ประกาศรองรับ v12 อย่างเป็นทางการ (peer dependency ระบุแค่ v7-v11) ต้องติดตั้งด้วย `--legacy-peer-deps` — **ตัดสินใจแล้วว่าจะอยู่กับ NestJS 12 ต่อ ไม่ downgrade กลับ 11** (ทดสอบแล้วทำงานได้ปกติ) แต่ให้คาดหวังว่าอาจเจอปัญหา `ERESOLVE` แบบนี้อีกเวลาติดตั้ง package ใหม่ในอนาคต — ถ้าเจอให้ใช้ `--legacy-peer-deps` ได้เลย (มีเหตุผลรองรับชัดเจนแล้ว)

## 4. Coding Conventions ที่ต้องยึดตามเสมอ

1. **ESM imports ต้องมี `.js` ต่อท้าย relative path เสมอ** เช่น `import { AppService } from './app.service.js';` (แม้ไฟล์จริงเป็น `.ts`) — เพราะ tsconfig ใช้ `nodenext` module resolution
2. **`import type { X }` สำหรับ type-only imports** (เช่น `Request` จาก express, DTO ที่ใช้ใน Service แต่ไม่ใช้ decorator) — เพราะ `isolatedModules: true` + `emitDecoratorMetadata: true` บังคับแยกให้ชัดเจน (import แบบ value ปกติสำหรับ DTO ที่ใช้กับ `@Body()` ใน Controller เพราะ ValidationPipe ต้องใช้ runtime)
3. **Database column และ API response ใช้ `snake_case` เสมอ** ไม่แปลงเป็น camelCase (ตัดสินใจแล้วเพื่อความสม่ำเสมอ ลด bug จากการแปลงไปมา)
4. **Response format มาตรฐาน:**
   - สำเร็จ (single): `{ "data": {...} }`
   - สำเร็จ (list): `{ "data": [...], "meta": { "total": N } }`
   - Error: `{ "statusCode", "message", "error", "timestamp", "path" }` (มาจาก global `HttpExceptionFilter`)
5. **RESTful convention:** คำนามพหูพจน์, ใช้ HTTP method บอก action, ห้ามมีคำกริยาใน URL (ยกเว้น action พิเศษที่ไม่ใช่ CRUD ตรงๆ เช่น `POST /api/sales/:id/cancel`)
6. **Path parameter ที่เป็น UUID ต้องใช้ `@Param('id', ParseUUIDPipe)` เสมอ** ไม่งั้น invalid UUID จะหลุดไปเป็น `500` แทนที่จะเป็น `400`
7. **ทุก Controller endpoint ต้องมี `@UseGuards(AuthGuard, RolesGuard)`** (ระดับ class) และ `@Roles(...)` เฉพาะจุดที่ต้องจำกัดสิทธิ์ (ไม่ใส่ `@Roles()` = ทุก role ที่ login แล้วเข้าถึงได้)
8. **ห้าม hardcode ค่า `created_by`/`cashier_id`/`cancelled_by` จาก client** ต้องดึงจาก `request.user.id` (ที่ `AuthGuard` แนบไว้จาก JWT ที่ verify แล้ว) เสมอ
9. **Logic ที่ต้อง atomic (insert หลายตารางพร้อมกัน) ให้เขียนเป็น PostgreSQL RPC function** (`language plpgsql`, `security definer`) ไม่ทำ insert แยกหลายครั้งจาก NestJS Service เพราะเสี่ยง race condition/inconsistency — ดูตัวอย่างที่ `create_sale`, `cancel_sale`, `create_inventory_movement`
10. **ทุกตารางเปิด RLS เสมอ** ("Run and enable RLS" ตอนสร้างตารางใน Supabase SQL Editor) แม้ Backend จะใช้ secret key ที่ข้าม RLS ได้ก็ตาม (defense in depth)
11. **Error message จาก PostgreSQL function ใช้ prefix ชัดเจน** เช่น `raise exception 'INSUFFICIENT_STOCK: ...'` เพื่อให้ Service แยกประเภท error ได้ง่ายด้วย `error.message.includes('...')`

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

- ยืนยันแล้วว่า `.env` ไม่เคยหลุดเข้า git (`.gitignore` ครอบคลุมถูกต้อง)
- **`SUPABASE_SECRET_KEY` เคยหลุดในแชทและถูก regenerate ไปแล้วครั้งหนึ่ง** — ต้องระวังไม่ paste secret key ในแชทอีก
- JWT expiry ของ Supabase Auth ถูกปรับเป็นค่ายาว (~24h) ชั่วคราวเพื่อความสะดวกตอน dev — **ต้องปรับกลับให้สั้นลงก่อนขึ้น production** พร้อมทำ refresh token flow ที่ Frontend

## 6. Database Schema ปัจจุบัน (Supabase/PostgreSQL, schema `public`)

### `users`
เชื่อมกับ `auth.users` (Supabase Auth) แบบ 1:1 ผ่าน FK ที่ `id`
- `id` (uuid, PK, FK → auth.users.id, cascade delete)
- `email`, `full_name` (text, not null)
- `role` (text, CHECK IN `ADMIN`, `MANAGER`, `CASHIER`, `VIEWER`)
- `is_active` (boolean, default true)
- `created_at`, `updated_at`
- **Auto-provisioning:** user ใหม่ที่ login ครั้งแรกจะถูกสร้าง record นี้อัตโนมัติโดย `AuthGuard` (ผ่าน `UsersService.findOrCreateProfile`) ด้วย role default = `CASHIER`

### `categories`
- `id` (uuid, PK)
- `category_name` (text, not null)
- `parent_id` (uuid, FK → categories.id, self-referencing, nullable, on delete set null) — โครงสร้างลำดับชั้น (parent-child)
- `created_at`, `updated_at`

### `products`
- `id` (uuid, PK)
- `product_name` (text, not null)
- `unit_price` (numeric(10,2), CHECK >= 0)
- `stock_quantity` (integer, default 0, CHECK >= 0) — **hybrid design:** cache ที่อัปเดตพร้อมกับทุก inventory_movements เพื่อความเร็ว
- `category_id` (uuid, NOT NULL, FK → categories.id) — สินค้าทุกชิ้นบังคับต้องมี category
- `is_active` (boolean, default true)
- `created_at`, `updated_at`

### `inventory_movements`
- `id` (uuid, PK)
- `product_id` (uuid, NOT NULL, FK → products.id)
- `movement_type` (text, CHECK IN `RECEIVE`, `ADJUSTMENT`, `SALE`)
- `quantity_change` (integer, not null) — เก็บเป็น delta (+/-)
- `reason` (text, nullable)
- `created_by` (uuid, NOT NULL, FK → users.id)
- `created_at` — **ไม่มี updated_at เพราะ record นี้ immutable เสมอ**

### `sales`
- `id` (uuid, PK)
- `cashier_id` (uuid, NOT NULL, FK → users.id)
- `total_amount` (numeric(10,2), CHECK >= 0) — คำนวณที่ backend/RPC เสมอ ไม่เชื่อ client
- `payment_method` (text, CHECK IN `CASH`, `TRANSFER`, `CARD`)
- `status` (text, default `COMPLETED`, CHECK IN `COMPLETED`, `CANCELLED`)
- `cancelled_at`, `cancelled_by` (nullable)
- `created_at`

### `sale_items`
- `id` (uuid, PK)
- `sale_id` (uuid, NOT NULL, FK → sales.id, **on delete cascade**)
- `product_id` (uuid, NOT NULL, FK → products.id)
- `quantity` (integer, CHECK > 0)
- `unit_price` (numeric(10,2)) — **เก็บราคา ณ ตอนขาย แยกจาก products.unit_price ปัจจุบัน** (สำคัญมาก: ป้องกันประวัติผิดเพี้ยนเมื่อราคาสินค้าเปลี่ยนในอนาคต)
- `subtotal` (numeric(10,2)) — quantity × unit_price คำนวณที่ backend
- `created_at`

### PostgreSQL RPC Functions ที่สร้างไว้แล้ว

| Function | หน้าที่ |
|---|---|
| `create_inventory_movement(p_product_id, p_movement_type, p_quantity_change, p_reason, p_created_by)` | Insert movement + update products.stock_quantity แบบ atomic |
| `create_sale(p_cashier_id, p_payment_method, p_items jsonb)` | ตรวจสอบสต็อก/ราคาทุกรายการ (พร้อม `FOR UPDATE` lock ป้องกัน race condition) → สร้าง sale + sale_items → หักสต็อกผ่าน inventory_movements (`SALE` type) ทั้งหมดใน transaction เดียว all-or-nothing |
| `cancel_sale(p_sale_id, p_cancelled_by)` | คืนสต็อกทุกรายการ (ผ่าน `ADJUSTMENT` movements) + เปลี่ยน status เป็น `CANCELLED`, ป้องกันยกเลิกซ้ำ |
| `get_daily_sales_report(p_date date)` | คืน `total_sales`, `total_bills`, `top_products` (top 5) นับเฉพาะ `status = 'COMPLETED'` |

## 7. RBAC — Roles และสิทธิ์

| Role | Products/Categories | Inventory | Sales (สร้าง) | Sales (ยกเลิก) | Reports |
|---|---|---|---|---|---|
| ADMIN | จัดการเต็มที่ | จัดการเต็มที่ | ✅ | ✅ | ✅ |
| MANAGER | จัดการเต็มที่ | จัดการเต็มที่ | ✅ | ✅ | ✅ |
| CASHIER | ดูอย่างเดียว | ดูอย่างเดียว | ✅ | ❌ | ❌ |
| VIEWER | ดูอย่างเดียว | ดูอย่างเดียว | ❌ | ❌ | ❌ |

**หลักการ:** endpoint ที่ไม่มี `@Roles(...)` แปะไว้ = ทุก role ที่ login แล้วเข้าถึงได้ (GET ส่วนใหญ่เป็นแบบนี้) — endpoint ที่มี `@Roles(...)` จะจำกัดเฉพาะ role ที่ระบุเท่านั้น

## 8. Module ที่สร้างเสร็จแล้ว (พร้อม path หลัก)

```
src/
├── main.ts                    — bootstrap, CORS, ValidationPipe, HttpExceptionFilter, LoggingInterceptor
├── app.module.ts               — root module (มี ThrottlerModule, ScheduleModule ระดับ global)
├── supabase/                   — SupabaseService (client wrapper, สร้างตอน onModuleInit)
├── auth/                       — AuthGuard (verify JWT ผ่าน JWKS + auto-provision user), AuthService, GET /api/auth/me
├── users/                      — UsersService.findOrCreateProfile, UserRole type, UserProfile interface
├── common/
│   ├── filters/http-exception.filter.ts   — global error format + log 500s พร้อม stack trace
│   ├── interceptors/logging.interceptor.ts — log ทุก HTTP request (method, path, status, response time)
│   ├── guards/roles.guard.ts   — RolesGuard (อ่าน @Roles metadata เทียบกับ request.user.role)
│   └── decorators/roles.decorator.ts       — @Roles(...) decorator
├── products/                   — CRUD เต็ม, DTO validate category_id (required)
├── categories/                 — CRUD เต็ม, parent-child, ป้องกัน self-parent
├── inventory/                  — POST /movements (RPC), GET /products/:id/movements
├── sales/                      — POST (สร้างบิล), GET /:id (พร้อม items), POST /:id/cancel
├── reports/
│   ├── reports.service.ts      — เรียก RPC get_daily_sales_report
│   ├── reports.controller.ts   — GET /daily-sales, POST /daily-sales/send
│   └── reports.scheduler.ts    — cron ส่งรายงานอัตโนมัติเที่ยงคืน (ของเมื่อวาน)
└── email/                      — EmailService (Resend + exceljs สร้าง .xlsx แนบอีเมล)
```

**หมายเหตุ circular dependency:** `EmailModule` ↔ `ReportsModule` ต้องใช้ `forwardRef()` ทั้งสองฝั่ง (เจอปัญหานี้แล้วแก้สำเร็จ)

## 9. Infrastructure ที่ทำเสร็จแล้ว

- ✅ Environment check, NestJS project setup
- ✅ `@nestjs/config` + `.env`
- ✅ Supabase connection (SupabaseService)
- ✅ Authentication (JWT + JWKS verify)
- ✅ Auto user-provisioning
- ✅ RBAC (RolesGuard + @Roles decorator)
- ✅ CORS (จำกัดเฉพาะ `http://localhost:5173`)
- ✅ Global error handling (HttpExceptionFilter) + ValidationPipe (whitelist, forbidNonWhitelisted, transform)
- ✅ Security review (`.env` ไม่หลุด git, node_modules ไม่ถูก track)
- ✅ API convention (snake_case, {data, meta} format, RESTful)
- ✅ Application logging (LoggingInterceptor + error stack trace logging)
- ✅ Rate limiting (100 req/min global, 10 req/min บน POST /api/sales)

## 10. Business Module ที่ทำเสร็จแล้ว

- ✅ Products (CRUD + RBAC)
- ✅ Categories (parent-child hierarchy + RBAC)
- ✅ Inventory (RECEIVE/ADJUSTMENT movements, atomic stock update)
- ✅ Sales + Sale Items (สร้างบิล/ยกเลิกบิล, atomic, ตรวจสต็อก, คำนวณราคาที่ backend)
- ✅ Reports (สรุปยอดขายรายวัน) + Email (Resend, ส่งเองได้ + ส่งอัตโนมัติทุกเที่ยงคืน, แนบ Excel)

## 11. ยังไม่ได้ทำ (ตามแผนเดิม)

- ❌ **Customers** — ข้อมูลลูกค้า
- ❌ **Promotions** — โปรโมชั่น/ส่วนลด
- ❌ **Shifts** — กะการทำงานพนักงาน
- ❌ **Audit Logs** — บันทึกการกระทำสำคัญในระบบ (แยกจาก inventory_movements ที่ทำไปแล้ว)
- ❌ **Settings** — ค่าตั้งค่าระบบ

## 12. สิ่งที่ต้องทำก่อนขึ้น Production จริง (checklist ที่ค้างไว้)

- [ ] ลด Supabase JWT expiry กลับเป็นค่าสั้น (ปัจจุบันตั้งไว้ยาว ~24h เพื่อความสะดวกตอน dev) + implement refresh token flow ที่ Frontend
- [ ] ซื้อ/verify domain จริงกับ Resend (ตอนนี้ใช้ test domain `onboarding@resend.dev` ส่งได้แค่ email ที่สมัคร Resend เท่านั้น)
- [ ] พิจารณา downgrade กลับ NestJS 11 ถ้าเจอปัญหา `--legacy-peer-deps` ซ้ำบ่อยเกินไปกับ package ใหม่ๆ ในอนาคต
- [ ] เปลี่ยนค่า CORS `origin` จาก `localhost:5173` เป็น domain จริงของ Frontend
- [ ] พิจารณาทำ Audit Logs แยกสำหรับการกระทำที่ sensitive (ตอนนี้มีแค่ inventory audit trail)

## 13. Git

- Repo ใช้งานอยู่แล้ว (`git status` ทำงานได้), branch หลักคือ `master`
- `.gitignore` ครอบคลุม `.env`, `node_modules/`, `tsconfig.build.tsbuildinfo` (เคยแก้ปัญหาที่ 2 อย่างหลังหลุดเข้า tracking มาก่อน)

## 14. Test User ที่มีอยู่ (สำหรับ dev/testing)

- `somchai@gmail.com` — role ปัจจุบันคือ `ADMIN` (เคยปรับ role ผ่าน Supabase Table Editor เพื่อทดสอบ RBAC หลายรอบ)
- ขอ access token ผ่าน:
  ```
  POST https://[project-ref].supabase.co/auth/v1/token?grant_type=password
  headers: apikey: <publishable_key>
  body: {"email": "...", "password": "..."}
  ```

## 15. บทเรียน/Gotcha ที่เจอมาระหว่างพัฒนา (กันเจอซ้ำ)

1. **Nest CLI แปลงชื่อโปรเจกต์เป็น kebab-case เสมอ** (`BackendWSP` → โฟลเดอร์ `backend-wsp`) ต้องระวังตอน `cd` หลัง `nest new`
2. **`nodenext` module resolution บังคับ `.js` extension ในทุก relative import** — ลืมใส่จะ compile error
3. **`isolatedModules` + `emitDecoratorMetadata` บังคับ `import type` สำหรับ type-only imports** ที่ใช้ในบริบทที่มี decorator (เช่น `@Req() request: Request`)
4. **NestJS Module encapsulation ไม่ re-export อัตโนมัติ** — ถ้า ModuleA import ModuleB และ ModuleB มี provider ที่ ModuleC ต้องใช้ (ผ่าน ModuleA) ต้อง export ModuleB ออกจาก ModuleA อย่างชัดเจน
5. **Circular module dependency ต้องใช้ `forwardRef()`** ทั้งสองฝั่ง
6. **PostgreSQL ไม่มีคำสั่งแก้ CHECK constraint ตรงๆ** ต้อง DROP แล้ว ADD ใหม่
7. **เพิ่ม NOT NULL column ในตารางที่มีข้อมูลอยู่แล้ว** ต้องทำ 3 ขั้น: เพิ่มแบบ nullable → backfill ข้อมูลเก่า → ค่อยตั้ง NOT NULL
8. **`FOR UPDATE` lock ใน PostgreSQL function จำเป็นมาก** สำหรับป้องกัน race condition ตอนขายสินค้าที่สต็อกใกล้หมดพร้อมกันหลาย request
9. **Supabase `numeric` type ส่งผ่าน JSON มาเป็น string** ต้อง `Number(...)` ก่อนใช้งานฝั่ง TypeScript
10. **curl บน Windows CMD มีปัญหากับ JSON ที่ escape ซับซ้อน (nested object/array)** — แก้ด้วยการเขียน JSON ลงไฟล์แล้วใช้ `-d @filename.json` แทน
11. **`ParseUUIDPipe` ต้องใส่ทุกจุดที่รับ UUID เป็น path param** ไม่งั้น invalid UUID จะหลุดไปเป็น database error (500) แทนที่จะเป็น validation error (400)
12. **ระวังไฟล์โค้ดที่ให้มามีบาง import/logic ถูก comment ค้างโดยไม่ตั้งใจ** ตอน copy-paste — เจอปัญหานี้ 2 ครั้ง (ThrottlerModule ใน app.module.ts และ @Throttle ใน sales.controller.ts) วิธีเช็คคือ `type <file>` ดูเนื้อหาจริงเทียบกับที่ควรจะเป็นเสมอเมื่อ behavior ไม่ตรงกับที่คาด
