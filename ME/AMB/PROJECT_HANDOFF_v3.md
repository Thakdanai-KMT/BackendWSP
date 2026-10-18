# Wpos Star Shop — Project Handoff v3 (อัปเดตล่าสุด 2026-10-17)

เอกสารนี้แทนที่ `PROJECT_HANDOFF_v2.md` (ซึ่งต่อจาก `PROJECT_HANDOFF.md` ฉบับแรก) ใช้ได้ 2 แบบ: (ก) วางส่วน "0. Prompt เริ่มต้น" ลงในแชทของ AI ตัวใหม่ แล้วแนบหรือวางทั้งไฟล์ต่อท้าย (ข) อัปโหลดไฟล์นี้ให้ AI อ่านก่อนเริ่มงาน

**สิ่งที่เพิ่มจาก v2:** ระบบขายเชื่อ/ลูกหนี้ (ฐานข้อมูล backend หน้าขายสินค้า หน้าลูกค้า แผงรายละเอียดเครดิตรายลูกค้า), กระดิ่งแจ้งเตือนสต็อกใกล้หมด, ปรับหน้าลูกค้าให้สวยขึ้น, คู่มือการใช้งาน PDF, แก้บั๊กล็อกอิน (`AuthContext`), สคริปต์ตั้งสต็อกเริ่มต้น, แผนเชื่อม LINE (พักไว้) และสถานะการทดสอบล่าสุด

---

## 0. Prompt เริ่มต้น (วางให้ AI ตัวใหม่)

```
คุณคือวิศวกรซอฟต์แวร์ที่รับช่วงงานโปรเจกต์ "Wpos Star Shop" (ระบบ POS ร้านค้า) ต่อจาก AI ตัวก่อนหน้า
อ่านเอกสาร Handoff ที่แนบมาให้ครบก่อนตอบอะไรทั้งสิ้น แล้วทำตามนี้:

1. ตอบเป็นภาษาไทยเสมอ (โค้ด คำสั่ง และศัพท์เทคนิคเป็นอังกฤษ) ผู้ใช้ใช้ Windows CMD
2. ทำงานทีละ Step ห้ามทำหลายเรื่องพร้อมกัน ทุก error ต้องหา root cause ก่อนแก้ ห้ามเดา
3. ก่อนแก้ไฟล์ใดๆ ให้ขอดูเนื้อหาไฟล์จริงจากผู้ใช้ก่อนเสมอ ห้ามสันนิษฐานว่าไฟล์ถูกแก้แล้ว
4. เมื่อให้คำสั่ง CMD ให้ใส่ทีละบรรทัดในบล็อกแยก (ผู้ใช้วางหลายคำสั่งแล้วบรรทัดมักถูกต่อกัน) และใช้ `/c:"..."` กับ findstr ที่ค้นหลายวลี
5. เอกสารมีหัวข้อ 5 "สถานะ" ที่แยกสิ่งที่ยืนยันแล้วกับสิ่งที่ยังไม่ยืนยัน ให้เริ่มจากการถามผู้ใช้เพื่อยืนยันรายการที่ค้างก่อนเริ่มฟีเจอร์ใหม่ โดยเฉพาะข้อ "เว็บในเครื่องยังเรียก backend บน Render" (หัวข้อ 2)
6. อย่าพูดเกินจริง ถ้าเรื่องไหนยังไม่ได้ทดสอบ ให้บอกตรงๆ ว่ายังไม่ยืนยัน
7. ห้ามขอหรือรับรหัสผ่าน token หรือ secret key ในแชท ถ้าผู้ใช้วางมา ให้แจ้งเตือนให้เปลี่ยนทันที
```

---

## 1. ภาพรวมโปรเจกต์

ระบบ POS สำหรับร้านค้า (ร้านชื่อ **WhanWhan**) ประกอบด้วย 2 โปรเจกต์:

| โปรเจกต์ | ชื่อ | Path local (ดูหมายเหตุหัวข้อ 2) | เทคโนโลยี | Deploy |
|---|---|---|---|---|
| Backend | **BackendWSP** | `C:\BackendWSP` (เอกสารเดิมเขียน `D:\BackendWSP`) | NestJS 12 + TypeScript + Supabase | Render free (`backendwsp.onrender.com`) |
| Frontend | **Wpos_star_shop** | `D:\Wpos_star_shop` | Vite 8 + React 19 + TS + Tailwind v4 | Vercel (`wpos-star-shop-evgz.vercel.app`) |

- Dev local: Backend `http://localhost:3000/api`, Frontend `http://localhost:5173` (Vite)
- Frontend repo: GitHub `Thakdanai-KMT/Wpos_star_shop` branch `main` (Vercel auto-deploy เมื่อ push)
- Test accounts: `somchai@gmail.com` (ADMIN), มีบัญชี VIEWER สำหรับทดสอบ
- ผู้ใช้เรียนรู้ไปพร้อมกับการพัฒนา ชอบให้อธิบายเหตุผลและทำทีละ Step

### กติกาที่ยึดถือมาตลอด
- พัฒนาทีละ Phase/Step เสมอ
- หา root cause ก่อนแก้ ห้ามเดา ห้าม `--force` โดยไม่มีเหตุผล
- ถ้าโค้ด Backend ถูกแล้ว behavior ไม่เปลี่ยน ให้สงสัยว่า dev server ยังไม่ restart เต็มรูปแบบ (`Ctrl+C` แล้ว `npm run start:dev`) หรือมี process เก่าค้างที่ port 3000 (`netstat -ano | findstr :3000`)
- ผู้ใช้รายงานปัญหากว้างๆ ให้ถามตัวเลือกแคบลงก่อนแก้
- Windows CMD: ห้ามใช้ `< >` ในคำสั่งจริง, `%` ตัวเดียวใน CMD (`%%` ใช้ได้เฉพาะไฟล์ .bat — เคยทำให้ `curl -w "%{http_code}"` ผิดมาแล้ว), JSON ซับซ้อนให้เขียนลงไฟล์แล้ว `-d @file.json`, ข้อความไทยเพี้ยนใน CMD (`Ó©...`) เป็นปัญหา codepage ของการแสดงผล ไม่ใช่ไฟล์เสีย
- ตัวแปร token ใน CMD: `set ADMIN_TOKEN=eyJ...` (ไม่มีเว้นวรรครอบ `=`, ไม่มีเครื่องหมายคำพูด) ได้จาก DevTools → Application → Local Storage → คีย์ `sb-...-auth-token` → `access_token`; token Supabase อายุสั้น (~1 ชม.) `401 Invalid or expired token` เกือบทุกครั้งมาจาก token หมดอายุหรือยังไม่ได้ `set` ในหน้าต่างนั้น
- **ห้ามวาง secret key / service_role key / token ในแชท** (publishable key เปิดเผยได้)

---

---

## 2. หมายเหตุเรื่อง path และสภาพแวดล้อม

- คำสั่งฝั่ง backend ล่าสุดรันที่ `C:\BackendWSP` และไฟล์ใหม่ยืนยันว่าอยู่ใน `C:\BackendWSP\src\...` ส่วนฝั่ง frontend ไฟล์ใหม่ยืนยันที่ `D:\Wpos_star_shop` (เคยรันคำสั่งผิดที่ `C:\Wpos_star_shop` มาครั้งหนึ่ง) **ก่อนสั่งอะไรให้ถามหรือสังเกต path ที่ผู้ใช้รันอยู่เสมอ** และยืนยันว่าแพ็กเกจกับโค้ดอยู่โปรเจกต์เดียวกัน
- เคยเจอ error `Invalid hook call` ตอนเรียก `useState` นอกฟังก์ชันคอมโพเนนต์ (บรรทัดซ้ำใน `ReportsPage.tsx`) ก่อนสงสัยเรื่อง React ซ้ำ ให้ดูเลขบรรทัดใน stack trace ก่อน
- ผลลัพธ์ `npm audit` มี 3 vulnerabilities หลังติดตั้ง `exceljs` (ยังไม่ได้ตรวจรายละเอียด) ห้ามรัน `npm audit fix --force` โดยไม่ดูก่อน

---

### ปัญหาที่ยังไม่แก้: เว็บในเครื่องเรียก backend บน Render (ผู้ใช้สั่งข้ามไปก่อน)
- อาการ: Console ขึ้น `GET https://backendwsp.onrender.com/api/customers/balances 400` ทั้งที่ไฟล์ `.env` ของผู้ใช้เป็น `VITE_API_BASE_URL=http://localhost:3000/api`
- สาเหตุของ 400: backend บน Render เป็นโค้ดเก่า ไม่มี route `balances` เลยถูกตีเป็น `@Get(':id')` ที่ตรวจ UUID (นี่คือรูปแบบอาการเมื่อ route ใหม่ยังไม่อยู่บนเซิร์ฟเวอร์ปลายทาง)
- ที่ยังไม่ทราบว่า ตัวไหนแย่งชนะค่าใน `.env`: ไฟล์ `.env.local`/`.env.development*` (ชื่อมี `.local` ชนะ), ตัวแปร `VITE_API_BASE_URL` ของ Windows (ชนะทุกไฟล์), dev server ยังไม่รีสตาร์ต, เปิด `npm run preview`, หรือเปิดหน้าจากโดเมน Vercel แทน `localhost:5173` ชุดคำสั่งตรวจอยู่ในบทสนทนา (findstr ทุกไฟล์ `.env*`, `echo %VITE_API_BASE_URL%`, ใส่ `console.log(API_BASE_URL)` ชั่วคราวใน `api-client.ts`)
- ผลที่ตามมา: ฟีเจอร์ใหม่ที่ต้องใช้ endpoint ใหม่ (ยอดค้างลูกค้า แผงเครดิต รายงานช่วงวันที่) จะใช้งานบนเว็บไม่ได้จนกว่าจะแก้ข้อนี้ หรือ deploy backend ขึ้น Render (ฐานข้อมูลเป็นชุดเดียวกัน การเปลี่ยนฐานข้อมูลมีผลแล้ว ขายเงินสดบน Render เก่ายังทำงานได้เพราะ `create_sale` ตัวใหม่รับการเรียกแบบ 4 พารามิเตอร์)
- git: เคยเจอ `Recv failure: Connection was reset` ตอน push/fetch (ปัญหาเครือข่ายชั่วคราว ลอง push ซ้ำผ่าน) ถ้าเกิดซ้ำ: `git config --global http.version HTTP/1.1`

---

## 3. Backend — BackendWSP

### 3.1 Stack
NestJS 12, Supabase (Postgres + Auth), JWT ผ่าน JWKS, Vitest, Oxlint, rate limit global 100/min และ `POST /api/sales` = 10/min (per IP โดยปริยาย), Email ด้วย Resend (domain ทดสอบ) + exceljs, Render free tier (cold start 30-50 วินาทีหลัง idle ~15 นาที) ไฟล์ import ใน TS ใช้นามสกุล `.js` (ESM)

CORS อ่านจาก env `CORS_ORIGINS` (comma-separated) fallback `http://localhost:5173`

### 3.2 Roles (RBAC) และโหมด VIEWER (ใหม่)
Roles: `ADMIN`, `MANAGER`, `CASHIER`, `VIEWER` (auto-provision ตอน login ครั้งแรก default `CASHIER`)

**VIEWER = บัญชีโหมดดูตัวอย่าง** (ผู้ใช้ต้องการให้ลูกค้าที่สนใจซื้อระบบมาดูก่อนซื้อ): เห็นทุกอย่างที่ ADMIN เห็น แต่ห้ามบันทึกข้อมูลทุกกรณี

การทำงานที่ทำและทดสอบแล้ว:
- `AuthGuard` (`src/auth/guards/auth.guard.ts`): หลังโหลด profile ถ้า `role === 'VIEWER'` และ method ไม่ใช่ `GET/HEAD/OPTIONS` → `ForbiddenException('บัญชีนี้เป็นโหมดดูตัวอย่าง ไม่สามารถบันทึกหรือแก้ไขข้อมูลได้')` **โยนนอก try/catch** เพื่อไม่ถูกแปลงเป็น 401 (frontend signOut อัตโนมัติเมื่อเจอ 401)
- `RolesGuard`: ถ้า `role === 'VIEWER'` ผ่านทุก endpoint ที่มี `@Roles` (การเขียนถูกบล็อกที่ AuthGuard แล้ว) ทำให้ VIEWER อ่าน endpoint ที่เดิมเป็น ADMIN/MANAGER ได้ (Audit Logs, Reports, Users, Settings)
- ทุก controller ใช้ `@UseGuards(AuthGuard, RolesGuard)` ระดับคลาส ยกเว้น `app.controller` (มีแค่ `GET /health`) และ `auth.controller` (มีแค่ `GET /me` ใส่ guard ระดับ method) — **controller ใหม่ต้องใส่ AuthGuard ระดับคลาสเสมอ ไม่เช่นนั้นกฎ VIEWER จะไม่ทำงาน**
- ผลทดสอบ curl ด้วย token VIEWER: GET users/settings/sales/audit-logs/reports = 200; POST sales/products/customers/reports-send, PATCH settings, DELETE products, POST cancel = 403

### 3.3 ความปลอดภัยฐานข้อมูล (ตรวจแล้ว)
- **RLS เปิดครบทั้ง 11 ตาราง ไม่มี policy เลย** (`pg_policies` = 0 แถว) frontend คุยกับ Supabase เฉพาะ Auth, อ่านเขียนข้อมูลทั้งหมดผ่าน backend ที่ใช้ service role (ข้าม RLS) **นโยบายคือไม่ต้องเขียน policy แยก role** ตารางใหม่ต้อง `enable row level security` ทุกครั้ง
- ฟังก์ชัน RPC เป็น `SECURITY DEFINER` และเคยเรียกตรงได้จาก anon/authenticated (ผ่าน `/rest/v1/rpc/...`) → ถอนสิทธิ์แล้ว ยืนยันด้วย `has_function_privilege`: `create_sale` (ตัวเดียว 6 พารามิเตอร์ หลังเพิ่มขายเชื่อ), `cancel_sale`, `create_inventory_movement`, `get_daily_sales_report`, `get_sales_summary`, `get_customer_balances`, `get_customer_credit_bills` = anon false / authenticated false / service_role true
- **กฎ: ฟังก์ชันใหม่ทุกตัวต้องรัน `revoke execute ... from public, anon, authenticated` และ `grant execute ... to service_role` ทันที** (ดู SQL หัวข้อ 9)
- ทดสอบตรงเข้า Supabase ด้วย token VIEWER: INSERT เข้า `users` ได้ 42501, เรียก `cancel_sale` ได้ `permission denied for function`, อ่าน/แก้ตารางได้ผลว่างหรือถูกปฏิเสธ
- ทดสอบ ADMIN หลังถอนสิทธิ์: ขาย, ยกเลิกบิล, ปรับสต็อก, เปิดรายงาน ผ่านไม่มี error

### 3.4 Response Convention
- เดี่ยว `{ "data": {...} }`, list `{ "data": [...], "meta": { "total": N } }`, error `{ statusCode, message, error, timestamp, path }` ผ่าน `HttpExceptionFilter` (spread field พิเศษด้วย เช่น `requires_confirmation`), snake_case ทั้งระบบ

### 3.5 Endpoints

| Module | Endpoints | RBAC (VIEWER อ่านได้ทุก GET เขียนไม่ได้) |
|---|---|---|
| Auth | `GET /api/auth/me` | ทุก role |
| Users | `GET /api/users` | ADMIN |
| Products | `GET/POST/PATCH/DELETE /api/products` | GET ทุก role, เขียน ADMIN/MANAGER |
| Categories | `GET/POST/PATCH/DELETE /api/categories` | GET ทุก role, เขียน ADMIN/MANAGER |
| Inventory | `POST /api/inventory/movements`, `GET /api/products/:id/movements` | POST ADMIN/MANAGER |
| Sales | `POST /api/sales` (`payment_method` = CASH/TRANSFER/CARD/**CREDIT**, ใหม่: `due_date` YYYY-MM-DD, `credit_note`), `GET /api/sales`, `GET /api/sales/top-products?from&to&limit`, `GET /api/sales/:id`, `POST /api/sales/:id/cancel` | POST: ADMIN/MANAGER/CASHIER แต่ **CREDIT เฉพาะ ADMIN/MANAGER** (403 จาก controller + ฐานข้อมูลตรวจซ้ำ), cancel: ADMIN/MANAGER |
| Customers | `GET/POST/PATCH/DELETE /api/customers?search=` | PATCH/DELETE ADMIN/MANAGER |
| Customers (ลูกหนี้, ใหม่) | `GET /api/customers/balances`, `GET /api/customers/:id/ledger`, `GET /api/customers/:id/credit`, `POST /api/customers/:id/payments`, `POST /api/customers/:id/payments/:paymentId/void` | ทั้งหมด ADMIN/MANAGER (CASHIER ไม่เห็นยอดค้าง) |
| Promotions | `GET/POST/PATCH /api/promotions?product_id=` | POST/PATCH ADMIN/MANAGER |
| Reports | `GET /api/reports/daily-sales?date=`, `GET /api/reports/sales-summary?from&to`, `POST /api/reports/daily-sales/send?date=` | ADMIN/MANAGER |
| Audit Logs | `GET /api/audit-logs?resource_type=` | ADMIN |
| Settings | `GET/PATCH /api/settings` | GET ทุก role, PATCH ADMIN |
| Health | `GET /api/health` | ไม่ต้อง login |

route order: path คงที่ (`top-products`, `me`, `balances`) ต้องประกาศก่อน `@Get(':id')`

### 3.6 ระบบแพ็กสินค้า (เสร็จสมบูรณ์)
สินค้าแพ็กไม่มีสต็อกของตัวเอง คำนวณ `floor(สต็อกฐาน / bundle_quantity)` ขายแพ็กหักสต็อกฐานตามขนาด ปรับสต็อกแพ็กตรงๆ ไม่ได้ ห้ามแพ็กซ้อนแพ็ก คอลัมน์ `products.bundle_of_product_id`, `products.bundle_quantity` (CHECK ต้องมีทั้งคู่หรือไม่มีเลย) `create_sale` เหลือตัวเดียว (ลบ 2 overload เดิมทิ้งตอนเพิ่มขายเชื่อ ดูหัวข้อ 3.10) `sale_items` เก็บ product_id ของตัวแพ็ก ส่วน `inventory_movements` เก็บที่สินค้าฐาน `ProductsService.remove` ตรวจสาเหตุจริงก่อนลบ (bundle children → sale_items → inventory_movements → promotions) FK ที่ชี้ `products.id`: `inventory_movements`, `sale_items`, `promotions`, `products.bundle_of_product_id`

### 3.7 รายงานช่วงวันที่ (ใหม่) — `sales-summary`
- SQL function `public.get_sales_summary(p_from date, p_to date) returns jsonb` ใช้เวลา `Asia/Bangkok` ตลอด มีวันที่ยอด 0 ครบทุกวันในช่วง นับเฉพาะบิล `COMPLETED` ในยอดขาย แยก `cancelled_bills`/`cancelled_amount` ผลลัพธ์: `{ from, to, total_sales, total_bills, cancelled_bills, cancelled_amount, daily:[{day,bills,sales}], payments:[{payment_method,bills,amount}], top_products:[{product_name,quantity_sold,revenue}] (10 อันดับตามรายได้) }`
- ฝั่ง NestJS: `ReportsService.getSalesSummary(from,to)` ตรวจ วันที่จริง (`isValidIsoDate`), `from <= to`, ช่วงไม่เกิน 366 วัน → `400`; `src/common/utils/thai-date.ts` (`todayInThailand`, `isValidIsoDate`, `daysInclusive`); `src/reports/dto/sales-summary-query.dto.ts`
- `get_daily_sales_report` ถูกแก้ให้ใช้เวลาไทยแล้ว (เดิมใช้ `created_at::date` = UTC); `daily-sales` และ `daily-sales/send` ใช้ `todayInThailand()` เป็นค่าเริ่มต้น
- ตั้งค่าร้านเก็บใน `settings.extra` (JSON): `shop_name` ("WhanWhan"), `shop_address`, `shop_phone`, `tax_id` (ไม่บังคับ — รายงานแสดงเฉพาะเมื่อมีค่า) JSON ต้องไม่มี trailing comma ไม่เช่นนั้นหน้า Settings จะบันทึกไม่ได้

### 3.8 จุดออกแบบอื่นๆ
Promotions ราคาต่ำกว่าทุน → `409` + `requires_confirmation` → ส่งซ้ำด้วย `confirm_below_cost: true`; Audit Logs CREATE/DELETE อัตโนมัติผ่าน `@Audit()` + `AuditInterceptor`, UPDATE log เองใน Service; Reports อีเมล manual + cron เที่ยงคืน; `AuthModule` ↔ `UsersModule` ใช้ `forwardRef`

### 3.9 Database Tables
`users`, `products` (`cost_price`, `bundle_*`), `categories`, `inventory_movements` (`movement_type` CHECK = `RECEIVE`/`ADJUSTMENT`/`SALE`; `cancel_sale` ใช้ `ADJUSTMENT`), `sales` (`total_amount`, `status` COMPLETED/CANCELLED, `payment_method` CHECK = `CASH`/`TRANSFER`/`CARD`/`CREDIT`, `customer_id`, **`due_date`**, **`credit_note`**, `cancelled_at/by`), `sale_items` (`quantity`, `unit_price`, `subtotal`), `customers` (`full_name`, `phone`, `email`, **`credit_limit`**), **`customer_payments`** (ใหม่), `promotions`, `audit_logs`, `settings` (single row id=1: `low_stock_threshold`, `vat_rate`, `extra`), และ `monitor_status` (ยังไม่ได้ดูโครงสร้าง)

หมายเหตุ: ระบบไม่มีวิธีชำระ `PROMPTPAY` ใน `sales` (พร้อมเพย์ที่หน้าขายสินค้าบันทึกเป็น `TRANSFER`) และไม่มีหน้าจอแก้บทบาทผู้ใช้ (ปรับใน DB)

### 3.10 ระบบขายเชื่อ / ลูกหนี้ (ใหม่ — ฝั่งฐานข้อมูลและ backend)

**การตัดสินใจของผู้ใช้:** ขายเชื่อได้เฉพาะ ADMIN และ MANAGER (CASHIER ขายเชื่อไม่ได้) ส่วนการรับชำระ ผู้ช่วยตั้งค่าเริ่มต้นเป็น ADMIN/MANAGER ด้วย (ผู้ใช้ยังไม่ได้ปฏิเสธ)

**แนวคิด:** บิลขายเชื่อ = บิลที่หักสต็อกแล้วแต่ยังไม่รับเงิน ยอดขายนับตอนของออก (รวมบิลเชื่อ) ส่วน "เงินที่ได้รับจริง" นับเมื่อบันทึกรับชำระ ยอดค้างคำนวณทุกครั้งจาก (ผลรวมบิล CREDIT ที่ COMPLETED) − (ผลรวมรับชำระสถานะ ACTIVE) ระดับ **ลูกค้า** ไม่ผูกทีละบิล และสถานะรายบิล/เลยกำหนดคำนวณด้วยการตัดยอด **บิลเก่าก่อน (FIFO)** ยอดติดลบ = ลูกค้ามีเครดิตคงเหลือ (เช่น ยกเลิกบิลหลังจ่ายแล้ว) ห้ามบันทึกขายเชื่อเป็นเงินสด และห้ามไม่บันทึกบิล

**ฐานข้อมูล (รันแล้ว ผ่านทดสอบแบบ rollback):**
- เพิ่ม `customers.credit_limit numeric(12,2)` (ว่าง = ไม่จำกัด), `sales.due_date date`, `sales.credit_note text`
- `sales_payment_method_check` เพิ่มค่า `CREDIT`
- ตาราง `customer_payments` (`amount > 0`, `method` CASH/TRANSFER/CARD, `paid_at`, `note`, `received_by`, `status` ACTIVE/VOIDED พร้อม `voided_at/by/void_reason`) **ห้ามลบ ยกเลิกด้วยการเปลี่ยนสถานะ** เปิด RLS ไม่มี policy
- `get_customer_balances(p_customer_id default null)` → `credit_total, paid_total, balance, overdue_amount, oldest_due_date`
- `get_customer_credit_bills(p_customer_id)` → รายบิลพร้อม `payment_status` (PAID/PARTIAL/UNPAID/CANCELLED), `paid_amount`, `remaining`, `is_overdue`, `days_overdue`, `settled_at`, `items` (jsonb) ผ่านทดสอบ (PAID/PARTIAL/UNPAID/CANCELLED ได้ตามคาด)
- `create_sale` เหลือตัวเดียว: `(p_cashier_id, p_payment_method, p_items, p_customer_id default null, p_due_date default null, p_credit_note default null)` ลบ overload 3 และ 4 พารามิเตอร์ทิ้ง (เพราะ overload ที่มี default ทำให้ PostgREST เลือกฟังก์ชันกำกวม) backend เดิมที่ส่ง 4 พารามิเตอร์ยังใช้ได้ กติกาขายเชื่อบังคับในฐานข้อมูลเอง: `CREDIT_NOT_ALLOWED` (ตรวจ `users.role` ของ cashier ต้อง ADMIN/MANAGER), `CREDIT_REQUIRES_CUSTOMER`, `CUSTOMER_NOT_FOUND` (ล็อกแถวลูกค้า `FOR UPDATE` กันขายเชื่อพร้อมกันเกินวงเงิน), `INVALID_DUE_DATE` (วันที่อดีตตามเวลาไทย), `CREDIT_LIMIT_EXCEEDED` (เมื่อมี credit_limit: ยอดค้าง + บิลนี้ > วงเงิน) ส่วนตรวจสต็อก/แพ็ก/หักสต็อกคัดลอกจากเดิมทุกบรรทัด
- `cancel_sale` ไม่ต้องแก้: ยกเลิกบิลเชื่อแล้วยอดค้างลดลงเองเพราะคำนวณจากสถานะบิล
- ฟังก์ชันใหม่ทุกตัวถอนสิทธิ์ anon/authenticated และให้ service_role แล้ว (ยืนยัน `create_sale`, `get_customer_balances`; `get_customer_credit_bills` ใส่คำสั่งถอนสิทธิ์ในสคริปต์สร้าง แต่ยังไม่ได้รัน query ตรวจซ้ำ)

**Backend (NestJS):**
- `CreateSaleDto`: `payment_method` รับ CREDIT, เพิ่ม `due_date` (regex YYYY-MM-DD), `credit_note` (≤ 500) — ต้องมีใน DTO เพราะ ValidationPipe ใช้ whitelist/forbidNonWhitelisted
- `SalesController.create`: CREDIT โดยผู้ใช้ที่ไม่ใช่ ADMIN/MANAGER → 403; `SalesService.create`: ตรวจต้องมีลูกค้า + `isValidIsoDate(due_date)` ก่อนเรียก RPC และส่ง `p_due_date/p_credit_note` เฉพาะเมื่อเป็น CREDIT; `handleSaleError` แปลง error ใหม่เป็นข้อความไทย (CREDIT_NOT_ALLOWED→403, อื่นๆ→400)
- `CustomersService`: `getBalances`, `getBalance`, `getLedger` (รายการเคลื่อนไหว+ยอดสะสม), **`getCreditOverview`** (summary + stats พฤติกรรมการชำระ + bills + payments พร้อมชื่อผู้รับ), `addPayment` (ห้ามวันที่อนาคต > 5 นาที; รับเกินยอดค้าง → `ConflictException({message, requires_confirmation: true, outstanding})` ต้องส่ง `confirm_overpay: true` ซ้ำ — **ต้องตรวจว่า HttpExceptionFilter ส่งฟิลด์ `requires_confirmation` ออกไปด้วย ยังไม่เคยเห็นไฟล์ filter**), `voidPayment` (บังคับเหตุผล ≥ 3 ตัวอักษร) บันทึก Audit Log (`customer_payment` CREATE/UPDATE) ด้วย `AuditService.log` เอง
- `UpdateCustomerDto` เพิ่ม `credit_limit?: number | null` (0–10,000,000) เฉพาะตอนแก้ไข ไม่ใส่ใน Create เพื่อไม่ให้พนักงานขายตั้งวงเงินเองได้ (PATCH จำกัด ADMIN/MANAGER อยู่แล้ว)
- `stats` ใน `getCreditOverview`: `credit_bills_total, paid_bills, open_bills, overdue_bills, overdue_amount, max_days_overdue, paid_on_time, paid_late, avg_days_to_settle, ever_overdue, first_credit_at, last_payment_at` (นับเลยกำหนดเฉพาะบิลที่ตั้ง `due_date`)

**ทดสอบแล้ว (rollback DO block ใน SQL editor):** ขายเชื่อ → ยอดค้างเท่ากับบิล, บิลที่สองเกินวงเงินถูกบล็อก, รับชำระเต็ม → 0, ยกเลิกบิลหลังชำระ → −ยอด (เครดิต) ฟังก์ชันรายบิลให้ผลถูก ส่วนการบล็อก CASHIER (E) ยังไม่ได้ทดสอบเพราะไม่มีผู้ใช้ CASHIER (มีบล็อกทดสอบที่เปลี่ยนบทบาทชั่วคราวภายใน transaction ที่ถูกย้อนกลับให้แล้ว ไม่แน่ใจว่าผู้ใช้รันหรือยัง)

---

## 4. Frontend — Wpos_star_shop

### 4.1 Stack (ตาม package.json)
Vite ^8.3, React ^19.2, TypeScript ~6.0, Tailwind ^4.3 (`@theme` ใน CSS), react-router-dom ^7, `@supabase/supabase-js` ^2 (publishable key เท่านั้น), recharts ^3, `promptpay-qr`, `qrcode.react`, Oxlint; **เพิ่มใหม่:** `exceljs` 4.4.0 และ `pdfmake` (ติดตั้งแบบ `pdfmake@0.2` + `@types/pdfmake` — ชนิดข้อมูลที่ติดตั้งเป็นรูปแบบ 0.3 ทำให้ `createPdf` 4 อาร์กิวเมนต์ error TS2554 โค้ดจึงเขียนรองรับทั้ง 0.2 และ 0.3 โดยตรวจ `addFonts`/`addVirtualFileSystem`) `tsconfig` เปิด `noUnusedLocals` (import ที่ไม่ใช้ = build error)

### 4.2 Auth Flow
Login ผ่าน Supabase Auth → `access_token` → `Authorization: Bearer` → `GET /api/auth/me` เพื่อ role จริง (ห้ามเชื่อ role จาก JWT) `api-client` signOut + redirect `/login` เมื่อเจอ 401 เท่านั้น 403 จะถูกโยนเป็น `ApiError` พร้อมข้อความจาก backend (หน้าต่างๆ แสดง `err.message`)

### 4.3 Structure (หลัก)
```
src/
├── lib/{supabase,api-client,promptpay,roles,thai-date,report-format,export-sales-excel,print-sales-report,export-sales-pdf}.ts
├── contexts/AuthContext.tsx
├── components/
│   ├── layout/{Sidebar,AppLayout,DemoBanner,NotificationBell}.tsx
│   ├── ui/{Button,Card,Input,LoadingScreen}.tsx
│   ├── reports/SalesSummarySection.tsx
│   └── customers/CustomerCreditDrawer.tsx        ← ใหม่
├── hooks/ (useProducts, useSales, useSettings, useCustomers, useSalesSummary, useDailySalesReport,
│          useLowStockAlerts, useCustomerBalances, useCustomerCredit ...)
├── pages/, types/ (auth, product, sale, customer, settings, report, sales-summary, ...), routes.tsx
public/fonts/  ← ต้องมี Sarabun-Regular.ttf และ Sarabun-Bold.ttf สำหรับ PDF
```
`roles.ts` มี `isDemoUser`, `canManageData`, `canEditSettings`, `canSeeStockAlerts` (ADMIN/MANAGER/VIEWER), `canUseCredit` (ADMIN/MANAGER/VIEWER — VIEWER เห็นเพื่อดูตัวอย่าง บันทึกไม่ได้)

### 4.4 Design System
โทนกรมท่า-ทอง (`brand-900 #1b2340`, `gold-500 #e8a33d`), ฟอนต์ IBM Plex Sans Thai, การ์ดขอบมน 8px ไม่มีเงา, `Button` (primary/secondary/danger/ghost), `Card`, `Input`/`Select`/`Textarea` modal: `fixed inset-0 bg-black/40 p-4` + `rounded-xl shadow-xl` (wrapper ที่ `stopPropagation` ต้องกำหนดความกว้างตรงเนื้อหา) restyle แล้ว: ทุกหน้าที่ฝั่งเดิมระบุ ยกเว้น **POS** และ **Customers**

### 4.5 โหมด VIEWER ฝั่ง frontend (ใหม่)
- `src/lib/roles.ts`: `isDemoUser(role)`, `canManageData(role)` (ADMIN/MANAGER/VIEWER), `canEditSettings(role)` (ADMIN/VIEWER)
- Categories, Customers, Inventory, Products, Promotions ใช้ `canManage = canManageData(user?.role)`, SalesHistory ใช้ `canCancel = canManageData(...)`, Settings ใช้ `canEdit = canEditSettings(...)` (ยืนยันด้วย findstr แล้ว)
- `Sidebar.tsx`: ทุกเมนูมี VIEWER (11 บรรทัด ยืนยันแล้ว)
- `DemoBanner.tsx` (แถบ "โหมดดูตัวอย่าง") สร้างแล้วแต่ **ยังไม่ได้เสียบใน `AppLayout.tsx`** (ยังไม่เคยเห็นไฟล์นั้น)
- ผลของการออกแบบนี้: VIEWER กดปุ่มบันทึกได้ แต่ backend ตอบ 403 ข้อความภาษาไทย (ยังไม่ได้ตรวจว่าแต่ละหน้าแสดงข้อความนี้สวยพอหรือไม่)

### 4.6 Dropdown (`Select` ใน `src/components/ui/Input.tsx`)
ปรับ `Select` ตัวกลางตัวเดียว: `appearance-none`, ลูกศร chevron เป็น background-image (data URI) ชิดขวา, `pr-10`, `py-2.5`, `bg-surface`, hover/focus สีทอง, prop `error` ใหม่ props เดิม (`label`, `id`, `className`, `children`, attributes) ใช้ได้เหมือนเดิม ทุกหน้าใช้ `Select` ตัวกลาง (ไม่มี `<select>` ดิบ): Products ×3, Audit Logs, Inventory, POS, Promotions **ส่งโค้ดให้แล้ว ยังไม่ได้รับผลทดสอบหน้าตา**

### 4.7 หน้า Reports และการส่งออกไฟล์ (ใหม่)
- `SalesSummarySection.tsx` ใส่ใน `ReportsPage.tsx` (ใต้คำอธิบาย): เลือกช่วงวันที่ + ปุ่ม "เดือนนี้/เดือนที่แล้ว", การ์ดสรุป 4 ช่อง, ปุ่ม **ดาวน์โหลด Excel**, **ดาวน์โหลด PDF**, ลิงก์ "หรือพิมพ์รายงาน" ดึงข้อมูลผ่าน `useSalesSummary(from,to)` → `GET /reports/sales-summary` ข้อมูลร้านอ่านจาก `settings.extra`
- `lib/export-sales-excel.ts`: `exceljs` โหลดแบบ dynamic import, 4 ชีต (สรุป, รายวัน, วิธีชำระเงิน, สินค้าขายดี), หัวสีกรมท่า-ทอง, แถวสลับสี, แถว "รวม" เป็นสูตร `SUM` จริง, ตรึงหัวตาราง, ตั้งค่าหน้ากระดาษ A4 (ยังไม่มีชีต "รายการบิลรายใบ" เพราะต้องพึ่งตัวกรองวันที่ของ `GET /sales`)
- `lib/export-sales-pdf.ts`: `pdfmake` ดาวน์โหลดตรง, ฟอนต์ Sarabun โหลดจาก `/fonts/` ตอนกดปุ่ม (ถ้าไม่พบไฟล์ throw `FONT_MISSING` → ข้อความแจ้ง), แถบหัวชื่อร้าน, การ์ด KPI, ตารางรายวัน/วิธีชำระ/สินค้าขายดี, เลขหน้า ข้อจำกัด: pdfmake ตัดบรรทัดข้อความไทยที่ไม่มีเว้นวรรคไม่ได้
- `lib/print-sales-report.ts`: ทางสำรอง เปิดหน้าต่างพิมพ์ (ให้ผู้ใช้เลือก "บันทึกเป็น PDF" เอง) ภาษาไทยถูกต้องสมบูรณ์เพราะเบราว์เซอร์เรนเดอร์เอง
- `lib/report-format.ts` มีตาราง `PAYMENT_LABEL` (CASH, TRANSFER, PROMPTPAY, QR, CARD) **ซึ่งเป็นการเดา ต้องตรวจให้ตรงกับค่าจริงของ `sales.payment_method`** (ค่าที่ไม่รู้จักจะแสดงตามเดิม)
- `SalesSummarySection.tsx` ใช้ `user?.full_name ?? user?.email` เป็นชื่อผู้ออกรายงาน (ตรวจชื่อฟิลด์จริงใน `AuthUser`)
- `ReportsPage.tsx`: แก้ `todayString()` (UTC) เป็น `todayInThailand()` แล้ว

### 4.8 Dashboard
เลือกช่วงวันที่ + ปุ่มลัด รวมยอดจาก `GET /api/sales` ฝั่ง client (`useMemo`, วันที่ท้องถิ่นด้วย `getFullYear/getMonth/getDate` ไม่ใช่ `toISOString()`), บิล CANCELLED ไม่นับ, 4 KPI + % เทียบช่วงก่อนหน้า, `AreaChart` + `PieChart`, สินค้าขายดี 5 อันดับจาก `GET /api/sales/top-products`

### 4.9 ระบบแพ็กสินค้าฝั่ง frontend (เสร็จสมบูรณ์)
checkbox "สินค้านี้เป็นแพ็กของสินค้าอื่น" ใน `ProductsPage.tsx`, badge "แพ็ก N × ชื่อฐาน", `InventoryPage.tsx` ซ่อนฟอร์มปรับสต็อกถ้าเป็นแพ็ก

---

### 4.10 กระดิ่งแจ้งเตือนสต็อกใกล้หมด (ใหม่)
- `hooks/useLowStockAlerts.ts`: ดึง `/products` และ `/settings` เงียบๆ ทุก 60 วินาทีและเมื่อสลับกลับมาที่แท็บ (ไม่ใช้ `useProducts` เพราะตั้ง isLoading ทุกครั้งทำให้หน้ากะพริบ) แจ้งเฉพาะสินค้า `is_active`, ไม่ใช่แพ็ก, สต็อก ≤ `low_stock_threshold` ระดับ OUT (0) / LOW
- `components/layout/NotificationBell.tsx`: ไอคอนกระดิ่ง ป้ายตัวเลข (แดงเมื่อมีสินค้าหมด ทองเมื่อใกล้หมด `9+`) กล่องรายการเรียงสต็อกน้อยสุด กดไปหน้าสต็อก ปิดด้วยคลิกข้างนอก/Esc
- `AppLayout.tsx` ใส่กระดิ่ง (เฉพาะ `canSeeStockAlerts`) และ `<DemoBanner />` (เห็นเฉพาะ VIEWER) — **ส่งโค้ดให้แล้ว ผู้ใช้ยังไม่ได้รายงานผลทดสอบ**
- ข้อจำกัด: อัปเดตช้าสุด ~1 นาที, ยังไม่มีปุ่มรับทราบ, ยังไม่มีแจ้งเตือนลูกหนี้เลยกำหนด

### 4.11 หน้าขายสินค้า (POS) — ตัวเลือกขายเชื่อ (ใหม่)
- ช่องเลือกลูกค้า (ใช้ได้ทุกวิธีชำระ ไม่บังคับ ยกเว้นขายเชื่อ) — เดิมไม่มีช่องนี้เลย
- ตัวเลือก "ขายเชื่อ (ค้างชำระ)" เห็นเฉพาะ `canUseCredit`; เมื่อเลือก: ลูกค้าบังคับ, ปุ่มเป็น "บันทึกขายเชื่อ", ซ่อน QR, ช่องกำหนดชำระ (ปุ่มลัด 7/15/30 วัน ใช้ `addDaysThai`), หมายเหตุ, **กล่องสรุปหนี้** (ยอดค้างเดิม/เครดิตคงเหลือ + บิลนี้ + ยอดหลังบิลนี้ + วงเงิน, คำเตือนเกินวงเงิน/เลยกำหนด — ฝั่งเว็บเป็นข้อมูลประกอบ ตัวตัดสินคือฐานข้อมูล), ถามยืนยัน (`window.confirm`) ก่อนบันทึก
- หลังขายสำเร็จ: ล้างตะกร้า/ลูกค้า/กำหนดชำระ, **รีเซ็ตวิธีชำระกลับเป็นเงินสด**, ดึงสต็อกและยอดค้างใหม่ (`refetch`, `refresh`)
- `types/sale.ts`: `PaymentMethod` เพิ่ม `CREDIT`, `Sale` มี `due_date`, `credit_note` — **ไฟล์ที่มีตาราง `Record<PaymentMethod, string>` (เช่น SalesHistoryPage, `PAYMENT_LABEL` ใน `report-format.ts`) ต้องเพิ่ม `CREDIT: 'ขายเชื่อ'` ไม่เช่นนั้น build จะ error** (ใน `report-format.ts` แจ้งให้เพิ่มแล้ว ส่วนหน้าอื่นยังไม่ยืนยัน)

### 4.12 หน้าลูกค้า (ปรับใหม่ + เครดิต)
- ปรับดีไซน์ให้เข้ากับหน้าอื่น (การ์ด ฟอร์ม 3 คอลัมน์ ช่องค้นหามีไอคอน ตาราง วงกลมชื่อย่อ แถวที่กำลังแก้ไขไฮไลต์ ข้อความ "ยังไม่มีลูกค้า/ไม่พบ") ตรรกะ เพิ่ม/แก้/ลบ/ค้นหาเหมือนเดิม
- สำหรับ `canUseCredit`: แถบสรุป "ยอดค้างชำระรวมทั้งร้าน", ตัวกรอง (ลูกค้าทั้งหมด / มียอดค้าง / เลยกำหนด / เคยขายเชื่อ พร้อมตัวเลข), คอลัมน์ "ยอดค้างชำระ" และ "สถานะเครดิต" (เลยกำหนด/มียอดค้าง/มีเครดิต/เคยขายเชื่อ), กดชื่อเพื่อเปิดแผงรายละเอียด
- `CustomerCreditDrawer.tsx` (แผงเลื่อนจากขวา, Esc/คลิกนอกแผงปิด, ล็อกการเลื่อนหน้าหลัง): การ์ดสรุป 4 ช่อง (ยอดค้าง/เครดิต, เลยกำหนด, บิลที่ยังจ่ายไม่ครบ, วงเงินที่เหลือ), **ประวัติการชำระ** (ข้อสรุปสั้นๆ "เคยติดไหม" + สถิติ จ่ายตรงกำหนด/ช้า, เฉลี่ยกี่วันกว่าจะจ่าย, เลยกำหนดนานสุด, ขายเชื่อครั้งแรก, ชำระล่าสุด, หมายเหตุถ้ามีบิลที่ไม่ได้ตั้งกำหนดชำระ), **รายการบิลพร้อมตัวกรอง** (ทั้งหมด/ยังไม่ชำระ/ชำระบางส่วน/ชำระแล้ว/เลยกำหนด พร้อมจำนวน กดบิลขยายดูสินค้า จ่ายแล้ว วันที่ชำระครบ หมายเหตุ) + ยอดรวมตามตัวกรอง (ไม่นับบิลยกเลิก), **ประวัติรับชำระ** (วิธี ผู้รับ หมายเหตุ รายการยกเลิกพร้อมเหตุผล)
- ตอนนี้เป็นอ่านอย่างเดียว **ยังไม่มีปุ่มรับชำระ / ยกเลิกการรับชำระ / ตั้งวงเงิน / ใบแจ้งยอด** (รอบถัดไป 3ข-2ข)
- ข้อมูลทั้งหมดต้องใช้ `GET /customers/balances` และ `/customers/:id/credit` (ADMIN/MANAGER; VIEWER ผ่าน; CASHIER ไม่เรียกเลย)

### 4.13 คู่มือการใช้งาน (PDF)
ไฟล์ `WPOS_คู่มือการใช้งาน.pdf` (27 หน้า ปก สารบัญ 19 บท) สร้างจาก HTML → PDF ด้วย Chromium + ฟอนต์ Loma (สคริปต์อยู่ในเครื่องมือของ AI ตัวก่อน ไม่ได้อยู่ใน repo) เขียนจากฟังก์ชันของระบบ ณ ต้นเดือน ต.ค.: ครอบคลุมจนถึงรายงาน/ตั้งค่า/กระดิ่ง/VIEWER แต่ **ยังไม่มีเรื่องขายเชื่อ ตัวเลือกลูกค้าในหน้าขาย และแผงเครดิตลูกค้า** และชื่อปุ่มบางจุดเดาจากโค้ด ยังไม่ได้เทียบกับหน้าจอจริง ต้องอัปเดตก่อนแจกพนักงาน

---

## 5. สถานะงาน (แยก "ยืนยันแล้ว" กับ "ยังไม่ยืนยัน")

| งาน | สถานะ | หลักฐาน / สิ่งที่ต้องตรวจต่อ |
|---|---|---|
| VIEWER อ่านอย่างเดียวที่ backend + RLS ทุกตาราง + ถอนสิทธิ์ RPC | ✅ ยืนยัน | ดูหัวข้อ 3.2-3.3 (ผลจากผู้ใช้) |
| แก้บั๊กล็อกอิน `AuthContext` (ขาด `catch` ทำให้ user ถูกล้างเป็น null) | ✅ แก้แล้ว | ผู้ใช้ทดสอบเว็บ (ล็อกอิน ขายเงินสด ยกเลิกบิล เพิ่ม/แก้/ค้นหาลูกค้า รายงาน VIEWER เขียนไม่ได้) รายงานว่า "ผ่าน" (ตอนนั้นอาจยิง Render อยู่ ซึ่งยังใช้ได้เพราะ `create_sale` ใหม่รองรับการเรียกเดิม) |
| push frontend ขึ้น GitHub | ✅ | `b427f6b..dac22b7 main -> main` (หลังลองซ้ำ) ยังไม่ทราบสถานะ Vercel build, backend repo ยังไม่ทราบว่า push แล้วหรือไม่ |
| ขายเชื่อ ฝั่งฐานข้อมูล (ตาราง ฟังก์ชัน `create_sale` ใหม่) | ✅ ผ่านทดสอบ rollback | ขายเชื่อ, วงเงินบล็อก, รับชำระ, ยกเลิกบิลหลังชำระ ผลถูกทุกข้อ; เหลือ 1 ข้อ E (CASHIER ถูกบล็อก) ยังไม่ได้รัน |
| `get_customer_credit_bills` | ✅ ผ่านทดสอบ rollback | PAID/PARTIAL/UNPAID/CANCELLED + overdue ถูกต้อง |
| backend ขายเชื่อ + endpoint รับชำระ (Step 2) | ✅ คอมไพล์ผ่านหลังชุดแรก (`Found 0 errors`) | ยังไม่ได้ทดสอบเรียกจริง; หลังจากนั้นเพิ่ม `credit_limit` ใน `UpdateCustomerDto` และ `getCreditOverview` **ยังไม่ได้รายงานผลคอมไพล์** |
| frontend: POS ขายเชื่อ, Customers + แผงเครดิต, types/hooks ใหม่ | ⚠️ ส่งโค้ดแล้ว ยังไม่ยืนยัน | ยังไม่ได้ผล `npm run build` และต้องแก้ `Record<PaymentMethod,string>` ที่อื่น (หัวข้อ 4.11) |
| ทดสอบวงจรขายเชื่อบนเว็บ | ⏳ ถูกบล็อก | ปัญหา env หัวข้อ 2 (เว็บเรียก Render) |
| Render deploy โค้ด backend ใหม่ | ⏳ | Render ยังเป็นโค้ดเก่า (ไม่มี `/customers/balances` ฯลฯ) |
| กระดิ่งแจ้งเตือนสต็อก + `DemoBanner` ใน `AppLayout` | ⚠️ ยังไม่ยืนยัน | หัวข้อ 4.10 |
| `Select` สวยขึ้น (`Input.tsx`) | ⚠️ ยังไม่ยืนยัน | ตรวจหน้าตาทุกหน้า |
| ส่งออก Excel/PDF (หัวข้อ 4.7) | ⚠️ ติดตั้งไลบรารี ✓ แก้ TS2554 ในไฟล์ ✓ | ยังไม่ได้ยืนยัน build, ฟอนต์ Sarabun ใน `public/fonts`, ผลไฟล์จริง, และ `PAYMENT_LABEL` เทียบค่าจริง |
| `GET /reports/sales-summary` end-to-end | ⚠️ | ฟังก์ชัน SQL ผ่าน, endpoint เคยได้ 401 (token หมดอายุ) ยังไม่เคยได้ 200 จาก curl |
| สต็อกเริ่มต้น 50 ชิ้นของ 14 สินค้า (เรียก `create_inventory_movement` ประเภท `RECEIVE` เหตุผล "ยอดยกมาเริ่มต้น") | ⚠️ ส่งสคริปต์แล้ว | ผู้ใช้ขายเงินสดได้ จึงน่าจะมีสต็อก แต่ยังไม่ได้รายงานผล 3 คำสั่งตรวจ (หัวข้อ 9.7) |
| คู่มือ PDF | ⚠️ ส่งไฟล์แล้ว | ต้องเทียบหน้าจอจริงและเพิ่มเรื่องขายเชื่อ |
| เปลี่ยนรหัสผ่านบัญชี ADMIN ที่หลุดในแชท (อีเมลเป็นรหัสผ่านเอง เดาง่าย) | ⏳ ยังไม่ยืนยัน | ควรยืนยันก่อนเปิดใช้งานจริง |
| ตัวกรองวันที่/pagination `GET /sales` (`from,to,limit,offset`) | ⏸️ พัก | ไม่ทราบว่าใส่โค้ดหรือยัง |
| ชุดโปรหลายสินค้า (`bundle_items`) | ⏸️ พัก | ดีไซน์ในหัวข้อ 6 ข้อ 9, SQL ในหัวข้อ 9.4 |
| `unit_cost` + กราฟกำไร Dashboard | ⏳ ยังไม่เริ่ม | หัวข้อ 6 ข้อ 6 |
| เชื่อม LINE ดูข้อมูลร้าน | ⏸️ พัก (ผู้ใช้ให้ข้ามไปก่อน) | ดีไซน์ในหัวข้อ 6 ข้อ 10 |
| ค้างตั้งแต่เอกสารเดิม: soft delete สินค้า, กรอง `is_active` ใน POS, restyle POS, Vercel build Error | ⏳ | ดู `PROJECT_HANDOFF.md` ฉบับแรก (POS ถูกแก้หน้าตาบางส่วนแล้ว ดูหัวข้อ 4.11) |

---

## 6. Roadmap งานถัดไป (เรียงความสำคัญ — ยืนยันลำดับกับผู้ใช้ก่อน)

1. **แก้เรื่อง env / deploy ให้เว็บคุยกับ backend ที่มีโค้ดใหม่:** ตรวจตามหัวข้อ 2 หรือ push backend ขึ้น GitHub ให้ Render deploy (ต้องมี `CORS_ORIGINS` ของโดเมน Vercel) แล้วยืนยัน `npm run build` ทั้งสองโปรเจกต์ผ่าน
2. **ทดสอบวงจรขายเชื่อบนเว็บให้ครบ** (ADMIN ขายเชื่อ → ยอดค้างในหน้าลูกค้า → แผงรายละเอียด → ยกเลิกบิล, VIEWER ถูกปฏิเสธ, ขายเงินสดปกติยังใช้ได้) และเติม `CREDIT: 'ขายเชื่อ'` ในทุกตารางชื่อวิธีชำระ
3. **รอบ 3ข-2ข (หน้าลูกค้า):** ปุ่ม **รับชำระ** (ฟอร์มจำนวน/วิธี/วันที่/หมายเหตุ ทางลัด "ชำระเต็มยอดค้าง" และโฟลว์ยืนยันเมื่อรับเกินผ่าน 409 `requires_confirmation`), **ยกเลิกการรับชำระ** (ต้องมีเหตุผล), **ตั้งวงเงินเครดิต** (ฟอร์มแก้ไขลูกค้า ส่ง `credit_limit` หรือ null), หลังทำรายการให้ `refresh` แผงและยอดค้าง
4. **รอผู้ใช้ตัดสินใจ: สถานะ "งดขายเชื่อ" ต่อลูกค้า** (เสนอ: คอลัมน์ `credit_blocked` + เหตุผล ตรวจใน `create_sale` และแสดงใน POS/แผงเครดิต) และ **กำหนดชำระเริ่มต้นต่อลูกค้า** (เช่น เครดิต 15 วัน)
5. **ต่อยอดเครดิต:** ใบแจ้งยอดค้างชำระ PDF (ใช้โครง `export-sales-pdf.ts`), รายงานลูกหนี้แยกอายุ (≤7, 8–30, 31–60, >60 วัน) + ยอดรับชำระในช่วง (เงินเข้าจริง) ทั้ง Excel/PDF, การ์ด "ลูกหนี้คงค้าง/เลยกำหนด" บน Dashboard, กระดิ่งแจ้งลูกหนี้เลยกำหนด, หน้าประวัติการขายแสดงบิลเชื่อ/กำหนดชำระ; รายงาน `get_sales_summary` ตอนนี้จะมีแถว `CREDIT` ในวิธีชำระ ซึ่งต้องอธิบายให้ผู้อ่านเข้าใจว่า ยอดขายไม่เท่าเงินที่ได้รับ
6. **กำไรจริง:** เพิ่ม `sale_items.unit_cost` (snapshot ตอนขายใน `create_sale` ตัวปัจจุบัน) + SQL รวมยอดกำไร + endpoint + กราฟบน Dashboard (ซ่อนจาก CASHIER) คำเตือน: `cost_price` สินค้าเก่าเป็นค่าชั่วคราว 70%, สินค้า 6 ตัวที่เพิ่ม 2026-10-15 ตั้งต้นทุนเท่าราคาขาย (กำไรจะเป็น 0) ห้ามนำกำไรไปแสดงผู้ให้กู้จนกว่าจะแก้เป็นต้นทุนจริง
7. **ล้างข้อมูลทดสอบก่อนใช้งานจริง/ก่อนออกรายงานให้ผู้ให้กู้:** ระบบไม่มีฟังก์ชันลบบิล ต้องเขียนสคริปต์ SQL พร้อมขั้นตอนตรวจก่อนลบ (ตอนนี้ปนอยู่: สินค้า/บิลทดสอบ, ลูกค้า "ลูกค้าทดสอบ" และบิลขายเชื่อทดสอบ — ลูกค้าที่มีบิลผูกอยู่ลบไม่ได้ ต้องลบบิลก่อน)
8. **ประสิทธิภาพ:** ตัวกรองวันที่/pagination ของ `GET /sales`, `getTopProducts` (UTC + `.in()` ยาว), ย้ายการรวมยอด Dashboard ไปฐานข้อมูล, cron ping กัน Render หลับ (เสนอ cron-job.org ยิง `/api/health` เฉพาะเวลาเปิดร้าน), ตรวจสำรองข้อมูล Supabase
9. **ชุดโปรหลายสินค้า:** ตาราง `bundle_items` (SQL หัวข้อ 9.4) สต็อกชุด = min ของ floor(สต็อกชิ้นส่วน/จำนวนต่อชุด), `create_sale` ต้องรวมยอดใช้ชิ้นส่วนทั้งบิลก่อนเช็ค, `cancel_sale` ต้องคืนครบ, ต้นทุนชุด = ผลรวมต้นทุนชิ้นส่วน, ห้ามซ้อน, เพิ่ม `bundle_items` ในการเช็คก่อนลบสินค้า (ต้องแก้ `create_sale` ตัวใหม่ 6 พารามิเตอร์ ห้ามสร้าง overload ซ้อน)
10. **เชื่อม LINE (พักไว้):** ออกแบบแล้ว: LINE Official Account + Messaging API webhook ที่ `POST /api/line/webhook` (ตรวจ `X-Line-Signature` ด้วย raw body ต้องปรับ `main.ts`/`rawBody`), ผูกบัญชีด้วยรหัสครั้งเดียว (ตาราง `line_accounts`, `line_link_codes`) เฉพาะ ADMIN/MANAGER และแชทส่วนตัวเท่านั้น, คำสั่ง "ยอดวันนี้/เดือนนี้/สต็อกใกล้หมด/สินค้าขายดี/ช่วยเหลือ" ใช้ `get_sales_summary` ที่มีอยู่, ข้อความตอบกลับฟรี ส่วน push นับโควตาตามแผน (LINE Notify เลิกให้บริการแล้ว), secret เก็บใน env ของ Render ผู้ใช้ยังไม่ได้ตอบว่ามี LINE OA แล้วหรือยัง
11. **อื่นๆ:** ใบเสร็จรายบิล (PDF), โมดูลรายจ่าย (เงินออก), ระบบเดโมแยกสำหรับ VIEWER (แนะนำ เพราะ VIEWER เห็นข้อมูลจริงทั้งหมดรวมต้นทุนและยอดค้างของลูกค้า), อัปเดตคู่มือ PDF, ปรับหน้า POS/Dashboard/Products ให้เข้าธีม

---

## 7. ปัญหาที่ทราบและความเสี่ยง

- **เว็บในเครื่องเรียก Render (โค้ดเก่า)** — หัวข้อ 2
- **`GET /sales` ไม่มี pagination/ตัวกรองวันที่:** Dashboard และประวัติการขายโหลดทุกบิล; ผู้ช่วยเข้าใจว่า Supabase API จำกัด 1,000 แถวต่อ request โดยค่าเริ่มต้น (ยังไม่ได้ตรวจ Max rows) ถ้าจริง ยอดจะไม่ครบเมื่อบิลเกิน 1,000 โดยไม่มี error
- **`getTopProducts`:** ขอบเขตวันที่ UTC ไม่ตรงเวลาไทย และ `.in('sale_id', ids)` อาจยาวเกิน URL เมื่อมีบิลหลายร้อยใบ
- **`CustomersService.findAll`:** แทรกคำค้นลงใน `.or()` ตรงๆ (จุลภาค/วงเล็บอาจทำให้ตัวกรองเพี้ยน ความเสี่ยงต่ำเพราะต้องล็อกอิน)
- **Rate limit `POST /sales` = 10/นาที (ต่อ IP):** ร้านมีแคชเชียร์ 2 คนอาจแชร์โควตา ยังไม่ทราบว่า `main.ts` ตั้ง `trust proxy` หรือไม่; แนะนำพิจารณา ~30/นาที
- **Cold start Render free:** ผู้ใช้เลือกแก้ด้วย cron ping; แผนฟรีมี 750 ชั่วโมง/เดือนต่อ workspace (ping 24 ชม. ใช้เกือบทั้งหมดของบริการเดียว) และไม่ได้ออกแบบมาเพื่อ production ระยะยาว
- **สำรองข้อมูล:** ยังไม่ได้ตรวจแผนสำรองของ Supabase ข้อมูลนี้เป็นหลักฐานการเงิน
- **ขายเชื่อ — ข้อจำกัดที่ตั้งใจ:** ตัดยอดแบบบิลเก่าก่อนอัตโนมัติ (เลือกตัดบิลเองไม่ได้), ยอดค้างระดับลูกค้า, ยกเลิกบิลหลังรับชำระแล้วทำให้ลูกค้ามีเครดิตคงเหลือ (ยอดติดลบ), การตรวจรับชำระเกินเป็นการถามยืนยันไม่ใช่การห้าม, หนี้สูญยังไม่มีฟังก์ชัน (ควรตัดเป็นหนี้สูญพร้อมเหตุผล ไม่ใช่ลบ — ปรึกษานักบัญชีเรื่องผลทางภาษี)
- **ยอดขาย ≠ เงินที่ได้รับ:** เมื่อมีขายเชื่อ ยอดขายใน Dashboard/รายงานรวมบิลเชื่อ ผู้ให้กู้จะเทียบกับสเตทเมนต์ธนาคาร ต้องมีรายงานลูกหนี้อธิบายส่วนต่าง และห้ามแต่งตัวเลข
- **VIEWER เห็นข้อมูลจริงทั้งหมด** (ต้นทุน กำไร ลูกค้า ยอดค้าง Audit Logs อีเมลพนักงาน): ถ้าให้บุคคลภายนอกดูตัวอย่าง ควรทำระบบเดโมแยก
- **ความปลอดภัยบัญชี:** รหัสผ่านบัญชี ADMIN เคยปรากฏในแชท (ผู้ใช้ถูกแนะนำให้เปลี่ยนแล้ว ยังไม่ยืนยัน) — อย่าขอ/เก็บรหัสผ่านหรือ token
- JWT expiry 24h, Resend ใช้ domain ทดสอบ, logging เป็น console อย่างเดียว, `cost_price` ชั่วคราว, `npm audit` มี 3 ช่องโหว่หลังติดตั้ง `exceljs` (ยังไม่ได้ดูรายละเอียด ห้าม `npm audit fix --force`)

---

## 8. บั๊กและบทเรียนที่เจอ (ระวังอย่าทำซ้ำ)

จากเอกสารเดิม: race condition ตอน login (`setIsLoading(true)` ทุกครั้งที่เริ่ม fetch), tab-switch ทำฟอร์มหาย (`loadedUserId` ผ่าน `useRef`), backdrop คลิกไม่ปิดเมนูมือถือ (wrapper ไม่มี `w-64`), Sidebar สูงไม่เต็มจอ (`sticky top-0 h-screen shrink-0`), `/auth/me` ต้องส่ง `{data}`, `ApiError` ต้องเก็บ `.details`, `VITE_API_BASE_URL` ต้องมี `https://`, Vercel SPA ต้องมี `vercel.json` rewrite, React key ต้องอยู่ที่ Fragment

บทเรียนรอบนี้:
1. **`AuthGuard` เดิมครอบทุก error ด้วย try/catch แล้วแปลงเป็น 401** — error ที่ต้องเป็น 403 (กฎ VIEWER) ต้องโยนนอก try/catch
2. endpoint ที่ไม่มี `@Roles` ทำให้ `RolesGuard` คืน `true` ทันที กฎที่ต้องบังคับทุก request (เช่น VIEWER อ่านอย่างเดียว) ต้องอยู่ใน guard ที่ทำงานก่อนและครอบทุก controller
3. ฟังก์ชัน Postgres ใหม่เรียกได้จาก anon โดยปริยาย (ต้อง revoke) และตารางใหม่ที่สร้างใน SQL editor อาจไม่เปิด RLS (ต้อง enable เอง)
4. `created_at::date` ใช้ timezone ของ DB (UTC) → ต้องแปลงเป็น `Asia/Bangkok` ก่อนเทียบวัน; ใน JS `new Date().toISOString()` ให้วันที่ UTC → ใช้ `toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })`
5. `Cannot GET /api/...` = route ไม่ถูกลงทะเบียน (process เก่า/คอมไพล์ไม่ผ่าน/มี process ค้างที่ port) ส่วน `401` = route มีแล้วแต่ token ไม่ผ่าน
6. `noUnusedLocals`: import ที่ไม่ใช้ทำให้ build ล้ม (เคยเกิดจากการ import `canManageData` ทิ้งไว้ในหลายไฟล์)
7. ห้ามเรียก hook (`useState`) นอกฟังก์ชันคอมโพเนนต์; error `Cannot read properties of null (reading 'useState')` ให้ดูบรรทัดใน stack trace ก่อน
8. ไฟล์ที่วางผิดโฟลเดอร์ (เคยมี `export-sales-excel.ts` ซ้ำใน `src/hooks`) ทำให้ import แบบ relative ไม่เจอ
9. ผู้ใช้วางหลายคำสั่งแล้วบรรทัดถูกต่อกัน (เช่น `dir /b src\typesfc ...`) ผลคือคำสั่งไม่ทำงานตามที่ตั้งใจ ให้คำสั่งทีละบรรทัด

---

บทเรียนรอบหลัง (v3):
10. **`try { ... } finally { ... }` ที่ไม่มี `catch` คอมไพล์ผ่านและไม่มี error** แต่ทำให้โค้ดหลังคอมเมนต์รันทุกครั้ง (เคสจริง: `AuthContext` ล้าง `user` เป็น null ทุกครั้งหลังโหลดสำเร็จ → ล็อกอินแล้วค้างหน้าล็อกอิน ทั้งที่ `/auth/me` ตอบ 200) ถ้า "ไม่มี error แต่ผิดปกติ" ให้อ่านโครงปีกกาของไฟล์
11. **เพิ่มพารามิเตอร์ให้ฟังก์ชัน Postgres = สร้าง overload ใหม่** ถ้ามี overload เก่าที่เรียกด้วยชื่อพารามิเตอร์ได้เหมือนกัน PostgREST จะเลือกไม่ได้ ต้อง `drop function` ตัวเก่าและสร้างตัวเดียวที่มีค่า default แล้วถอนสิทธิ์ซ้ำ (สร้างใหม่ = สิทธิ์เริ่มต้นเปิดให้ทุกคน)
12. **รูปแบบทดสอบฐานข้อมูลที่ไม่ทิ้งข้อมูล:** `DO $$ ... raise exception E'ROLLBACK_TEST ok\n...' $$` ทำรายการจริงใน transaction แล้วตั้งใจ error ตอนท้ายเพื่อย้อนกลับ (SQL editor ขึ้น "Failed to run sql query" นำหน้าเป็นเรื่องปกติ) ระวัง: ภายใน transaction เดียว `now()` เท่ากันทุกแถว ลำดับ FIFO จึงขึ้นกับ `id` — ออกแบบการทดสอบให้ยอดแต่ละบิลเท่ากัน
13. **`findstr` เว้นวรรค = "หรือ"** (และ `try {` ถูกแยกเป็นสองคำ) ใช้ `/c:"วลี"` ต่อวลี
14. **Vite env:** ตัวแปรของระบบ > `.env.local`/`.env.[mode].local` > `.env`; อ่านตอนเริ่มเท่านั้น; `vite preview` ใช้ค่าที่ฝังตอน build
15. **คำสั่งที่วางหลายบรรทัดถูกต่อกัน** (`dir /b src\typesfc ...`) ผลลัพธ์จะผิดเงียบๆ และอาจสั่งลบไฟล์โดยไม่ได้เทียบ ให้ทุกคำสั่งแยกบล็อก และคำสั่งทำลายข้อมูลต้องมีขั้นตรวจก่อน
16. ไฟล์ import ที่ไม่ได้ใช้ทำให้ build ล้ม (`noUnusedLocals`); `ValidationPipe` whitelist ต้องมีฟิลด์ใหม่ใน DTO; route ที่ตั้งชื่อคงที่ (`balances`) ต้องอยู่เหนือ `:id`

---

## 9. SQL อ้างอิงสำคัญ

### 9.1 `get_sales_summary` (รันแล้ว)
```sql
create or replace function public.get_sales_summary(p_from date, p_to date)
returns jsonb
language sql
stable
set search_path = public
as $$
  with bounds as (
    select
      (p_from::timestamp at time zone 'Asia/Bangkok') as t_from,
      ((p_to + 1)::timestamp at time zone 'Asia/Bangkok') as t_to
  ),
  filtered as (
    select s.*
    from public.sales s, bounds b
    where s.created_at >= b.t_from and s.created_at < b.t_to
  ),
  days as (
    select generate_series(p_from, p_to, interval '1 day')::date as day
  ),
  daily as (
    select
      d.day,
      count(f.id) filter (where f.status = 'COMPLETED') as bills,
      coalesce(sum(f.total_amount) filter (where f.status = 'COMPLETED'), 0) as sales
    from days d
    left join filtered f
      on (f.created_at at time zone 'Asia/Bangkok')::date = d.day
    group by d.day
  ),
  payments as (
    select f.payment_method, count(*) as bills, sum(f.total_amount) as amount
    from filtered f
    where f.status = 'COMPLETED'
    group by f.payment_method
  ),
  top as (
    select p.product_name, sum(si.quantity) as quantity_sold, sum(si.subtotal) as revenue
    from public.sale_items si
    join filtered f on f.id = si.sale_id and f.status = 'COMPLETED'
    join public.products p on p.id = si.product_id
    group by p.product_name
    order by revenue desc
    limit 10
  )
  select jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'total_sales', coalesce((select sum(total_amount) from filtered where status = 'COMPLETED'), 0),
    'total_bills', (select count(*) from filtered where status = 'COMPLETED'),
    'cancelled_bills', (select count(*) from filtered where status = 'CANCELLED'),
    'cancelled_amount', coalesce((select sum(total_amount) from filtered where status = 'CANCELLED'), 0),
    'daily', coalesce((select jsonb_agg(to_jsonb(d) order by d.day) from daily d), '[]'::jsonb),
    'payments', coalesce((select jsonb_agg(to_jsonb(p)) from payments p), '[]'::jsonb),
    'top_products', coalesce((select jsonb_agg(to_jsonb(t) order by t.revenue desc) from top t), '[]'::jsonb)
  );
$$;

revoke execute on function public.get_sales_summary(date, date) from public, anon, authenticated;
grant execute on function public.get_sales_summary(date, date) to service_role;
```

### 9.2 ถอนสิทธิ์ RPC ที่มีอยู่ (รันแล้ว) และ query ตรวจ
```sql
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('create_inventory_movement','create_sale','cancel_sale','get_daily_sales_report')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end $$;

-- ตรวจ (ควรได้ anon/authenticated = false, service_role = true ทุกแถว)
select p.proname,
       has_function_privilege('anon', p.oid, 'execute') as anon_can_run,
       has_function_privilege('authenticated', p.oid, 'execute') as authed_can_run,
       has_function_privilege('service_role', p.oid, 'execute') as service_can_run
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public';
```

### 9.3 `unit_cost` (ส่งให้ผู้ใช้แล้ว ไม่ทราบว่ารันหรือยัง — ตรวจก่อน)
```sql
alter table public.sale_items add column unit_cost numeric(12,2);

update public.sale_items si
set unit_cost = p.cost_price
from public.products p
where p.id = si.product_id and si.unit_cost is null;
```
(คอลัมน์ nullable ไว้ก่อน จนกว่า `create_sale` จะเก็บค่านี้ตอนขาย แล้วค่อยรัน `update` ซ้ำสำหรับบิลที่ขายระหว่างนั้น)

### 9.4 `bundle_items` สำหรับชุดโปร (ส่งให้ผู้ใช้แล้ว ไม่ทราบว่ารันหรือยัง — ตรวจก่อน)
```sql
create table public.bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.products(id),
  component_id uuid not null references public.products(id),
  quantity integer not null check (quantity >= 1),
  created_at timestamptz not null default now(),
  unique (bundle_id, component_id),
  check (bundle_id <> component_id)
);
create index bundle_items_bundle_id_idx on public.bundle_items (bundle_id);
create index bundle_items_component_id_idx on public.bundle_items (component_id);
alter table public.bundle_items enable row level security;
```

### 9.5 โค้ดตัวกรองวันที่ `GET /sales` (Step 1 ที่ส่งให้แล้ว)
`ListSalesQueryDto` (`from?`, `to?` รูปแบบ `YYYY-MM-DD`, `limit?` 1-500, `offset?` ≥ 0) และ `SalesService.findAll(query)` แปลงวันที่เป็นขอบเขต +07:00 → UTC (`new Date(`${date}T00:00:00.000+07:00`).toISOString()`), ใช้ `.range()` เฉพาะเมื่อมี `limit` (ไม่ส่ง parameter = ทำงานเหมือนเดิม เพื่อไม่ให้ Dashboard พัง) ต้องขอดูไฟล์จริงก่อนเมื่อจะต่อยอด

---

### 9.6 SQL ระบบขายเชื่อ (รันแล้วทั้งหมด ในธุรกรรมเดียว; `create_sale` ฉบับเต็มดึงได้ด้วย `pg_get_functiondef`)

```sql
alter table public.customers add column if not exists credit_limit numeric(12,2);
alter table public.customers add constraint customers_credit_limit_check
  check (credit_limit is null or credit_limit >= 0);
alter table public.sales add column if not exists due_date date;
alter table public.sales add column if not exists credit_note text;

create table if not exists public.customer_payments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id),
  amount numeric(12,2) not null check (amount > 0),
  method text not null,
  paid_at timestamptz not null default now(),
  note text,
  received_by uuid not null references public.users(id),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'VOIDED')),
  voided_at timestamptz,
  voided_by uuid references public.users(id),
  void_reason text,
  created_at timestamptz not null default now(),
  check (
    (status = 'ACTIVE' and voided_at is null)
    or (status = 'VOIDED' and voided_at is not null and void_reason is not null)
  )
);
alter table public.customer_payments add constraint customer_payments_method_check
  check (method in ('CASH', 'TRANSFER', 'CARD'));
create index if not exists customer_payments_customer_idx
  on public.customer_payments (customer_id, paid_at);
alter table public.customer_payments enable row level security;
revoke all on public.customer_payments from anon, authenticated;

alter table public.sales drop constraint if exists sales_payment_method_check;
alter table public.sales add constraint sales_payment_method_check
  check (payment_method in ('CASH', 'TRANSFER', 'CARD', 'CREDIT'));
```

`get_customer_balances` (คิด FIFO: unpaid_i = least(amount_i, greatest(0, cum_i − ยอดรับชำระรวม)); วันที่ตามเวลาไทย):

```sql
create or replace function public.get_customer_balances(p_customer_id uuid default null)
returns table (
  customer_id uuid, credit_total numeric, paid_total numeric,
  balance numeric, overdue_amount numeric, oldest_due_date date
)
language sql stable set search_path = public
as $$
  with credit as (
    select s.customer_id, s.total_amount, s.due_date,
           sum(s.total_amount) over (partition by s.customer_id order by s.created_at, s.id) as cum
    from public.sales s
    where s.payment_method = 'CREDIT' and s.status = 'COMPLETED'
      and s.customer_id is not null
      and (p_customer_id is null or s.customer_id = p_customer_id)
  ),
  paid as (
    select cp.customer_id, sum(cp.amount) as paid_total
    from public.customer_payments cp
    where cp.status = 'ACTIVE' and (p_customer_id is null or cp.customer_id = p_customer_id)
    group by cp.customer_id
  ),
  totals as (select c.customer_id, sum(c.total_amount) as credit_total from credit c group by c.customer_id),
  alloc as (
    select c.customer_id, c.due_date,
           least(c.total_amount, greatest(0, c.cum - coalesce(p.paid_total, 0))) as unpaid
    from credit c left join paid p on p.customer_id = c.customer_id
  )
  select k.customer_id,
         coalesce(t.credit_total, 0), coalesce(p.paid_total, 0),
         coalesce(t.credit_total, 0) - coalesce(p.paid_total, 0),
         coalesce(sum(a.unpaid) filter (where a.due_date < (now() at time zone 'Asia/Bangkok')::date), 0),
         min(a.due_date) filter (where a.unpaid > 0)
  from (select totals.customer_id from totals union select paid.customer_id from paid) k
  left join totals t on t.customer_id = k.customer_id
  left join paid p on p.customer_id = k.customer_id
  left join alloc a on a.customer_id = k.customer_id
  group by k.customer_id, t.credit_total, p.paid_total;
$$;
revoke execute on function public.get_customer_balances(uuid) from public, anon, authenticated;
grant execute on function public.get_customer_balances(uuid) to service_role;
```

ส่วนที่เพิ่มใน `create_sale` ตัวใหม่ (ที่เหลือคัดลอกจากเดิม): ก่อนลูป Step 1 — ถ้า `p_payment_method = 'CREDIT'` ตรวจ role (`users.role::text in ('ADMIN','MANAGER')` ไม่งั้น `raise exception 'CREDIT_NOT_ALLOWED: ...'`), ต้องมี `p_customer_id` (`CREDIT_REQUIRES_CUSTOMER`), `select * from customers where id = p_customer_id for update` (`CUSTOMER_NOT_FOUND`), `p_due_date` ไม่ใช่อดีตตามเวลาไทย (`INVALID_DUE_DATE`); หลังลูป — ถ้ามี `credit_limit` และ `get_customer_balances(...).balance + v_total > credit_limit` → `CREDIT_LIMIT_EXCEEDED`; `insert into sales` เพิ่ม `customer_id, due_date, credit_note` (due_date/credit_note เก็บเฉพาะเมื่อเป็น CREDIT) และใส่ `set search_path = public`, `returns public.sales`

`get_customer_credit_bills(p_customer_id uuid)` — คืนรายบิลเชื่อของลูกค้าหนึ่งคน (CTE: today, completed(cum), paid_total, pay_running(cum_paid), alloc(remaining) แล้ว union กับบิล CANCELLED) คอลัมน์: `sale_id, created_at, total_amount, due_date, credit_note, sale_status, payment_status, paid_amount, remaining, is_overdue, days_overdue, settled_at, items(jsonb)` `settled_at` = `paid_at` ของรับชำระแรกที่ยอดสะสม ≥ cum ของบิล; ใช้โครงเดียวกับ `get_customer_balances` ถอนสิทธิ์แบบเดียวกัน (ฉบับเต็มอยู่ในบทสนทนา/ดึงได้ด้วย `pg_get_functiondef`)

### 9.7 สคริปต์ตั้งสต็อกเริ่มต้น 50 ชิ้น (ส่งให้ผู้ใช้แล้ว)
```sql
do $$
declare v_admin uuid; v_count integer := 0; r record;
begin
  select id into v_admin from public.users where email = 'somchai@gmail.com';
  if v_admin is null then raise exception 'ไม่พบผู้ใช้นี้ในตาราง users'; end if;
  for r in select id from public.products
           where is_active and bundle_of_product_id is null and stock_quantity = 0
  loop
    perform public.create_inventory_movement(r.id, 'RECEIVE', 50, 'ยอดยกมาเริ่มต้น', v_admin);
    v_count := v_count + 1;
  end loop;
  raise notice 'ตั้งสต็อกเริ่มต้นแล้ว % รายการ', v_count;
end $$;
```
`create_inventory_movement(p_product_id, p_movement_type, p_quantity_change, p_reason, p_created_by)` เพิ่มรายการใน `inventory_movements` และบวก `products.stock_quantity` ในครั้งเดียว (ห้าม `update products set stock_quantity` ตรงๆ เพราะจะไม่มีประวัติ) ตรวจผล: `select product_name, stock_quantity from products`, `select count(*) from inventory_movements where reason = 'ยอดยกมาเริ่มต้น'` (ควร 14)

---

## 10. คำแนะนำสำหรับผู้รับช่วงงาน

1. เริ่มจากถามผู้ใช้ให้ยืนยันรายการ ⚠️/⏳ ในหัวข้อ 5 โดยเฉพาะ: แก้ env ให้เว็บเรียก backend ในเครื่องได้หรือยัง, `npm run build` ของทั้ง frontend และ backend ผ่านไหม (เน้นไฟล์ที่เพิ่งเพิ่ม: เครดิตในหน้าขาย หน้าลูกค้า แผงเครดิต `getCreditOverview` `UpdateCustomerDto`), ผลตรวจสต็อก 50 ชิ้น, เปลี่ยนรหัสผ่าน ADMIN แล้วหรือยัง
2. ทำทีละ Step และขอดูไฟล์จริงก่อนแก้เสมอ โดยเฉพาะ `SalesHistoryPage.tsx`, `ProductsPage.tsx`, `InventoryPage.tsx`, `DashboardPage.tsx`, `HttpExceptionFilter`, `main.ts` ฟังก์ชัน SQL ตรวจด้วย `select pg_get_functiondef(oid) from pg_proc where proname = '...'`
3. ทุก endpoint/ฟังก์ชันใหม่ต้องผ่านเช็คลิสต์: `AuthGuard` ระดับคลาส, `@Roles` ที่เหมาะสม, ฟังก์ชัน SQL ใหม่ถอนสิทธิ์ anon/authenticated (และถอนซ้ำถ้า drop/create), ตารางใหม่เปิด RLS, ข้อความ error ภาษาไทยที่อ่านรู้เรื่อง, ฟิลด์ใหม่อยู่ใน DTO, ทดสอบด้วย token ADMIN และ VIEWER และบล็อกทดสอบ rollback สำหรับกติกาในฐานข้อมูล
4. ผู้ใช้ชอบคำอธิบายสั้นๆ ที่บอกเหตุผล พร้อมขั้นตอนทดสอบ "ผลที่ควรได้" และให้ส่งผลกลับมา ผู้ใช้มักไม่ตอบคำถามที่ถามค้างไว้ — ถามทีละข้อ และสรุปการตัดสินใจเริ่มต้นที่คุณจะใช้ถ้าไม่ได้คำตอบ ถ้ามีข้อสงสัยเรื่องข้อเท็จจริงที่อาจเปลี่ยน (ราคา/นโยบาย Render, Supabase, LINE) ให้ค้นข้อมูลปัจจุบันก่อนตอบ
5. เรื่องการเงิน/กฎหมาย/บัญชี (ใบกำกับภาษี เอกสารขอกู้ หนี้สูญ การทวงหนี้): ให้ข้อมูลประกอบ แนะนำปรึกษานักบัญชี/ผู้ให้กู้/ทนายความ อย่ายืนยันแทน และอย่าช่วยแต่งตัวเลข
6. การตัดสินใจที่ผู้ใช้ยืนยันแล้ว: VIEWER เห็นเหมือน ADMIN แต่เขียนไม่ได้ (เพื่อให้ลูกค้าสนใจดูตัวอย่าง), ขายเชื่อเฉพาะ ADMIN/MANAGER, พักเรื่อง LINE / ชุดโปร / pagination `GET /sales` ไว้ก่อน, ต้องการ Excel + PDF ที่จัดหน้าสวยสำหรับรายงาน (เพื่อประกอบขอสินเชื่อ), ต้องการเห็นประวัติลูกหนี้รายบิลพร้อมตัวกรองชำระแล้ว/ยังไม่ชำระ

*เอกสารนี้สร้างจากบทสนทนาการพัฒนา ณ วันที่ 2026-10-17 รายการที่ติด ✅ ยืนยันจากผลที่ผู้ใช้วางกลับมาจริง รายการที่ติด ⚠️/⏳/⏸️ ยังไม่ได้รับการยืนยัน*
