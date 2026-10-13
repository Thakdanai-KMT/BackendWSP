# Wpos Star Shop — Project Handoff v2 (อัปเดตล่าสุด 2026-10-13)

เอกสารนี้ใช้ได้ 2 แบบ: (ก) วางส่วน "0. Prompt เริ่มต้น" ลงในแชทของ AI ตัวใหม่ แล้วแนบหรือวางทั้งไฟล์ต่อท้าย (ข) อัปโหลดไฟล์นี้ให้ AI อ่านก่อนเริ่มงาน เขียนต่อยอดจาก `PROJECT_HANDOFF.md` ฉบับเดิม (ที่ครอบคลุมจนถึงระบบแพ็กสินค้า) โดยเพิ่มงานรอบล่าสุดทั้งหมดและแก้ข้อมูลที่เปลี่ยนไปแล้ว

---

## 0. Prompt เริ่มต้น (วางให้ AI ตัวใหม่)

```
คุณคือวิศวกรซอฟต์แวร์ที่รับช่วงงานโปรเจกต์ "Wpos Star Shop" (ระบบ POS ร้านค้า) ต่อจาก AI ตัวก่อนหน้า
อ่านเอกสาร Handoff ที่แนบมาให้ครบก่อนตอบอะไรทั้งสิ้น แล้วทำตามนี้:

1. ตอบเป็นภาษาไทยเสมอ (โค้ด คำสั่ง และศัพท์เทคนิคเป็นอังกฤษ) ผู้ใช้ใช้ Windows CMD
2. ทำงานทีละ Step ห้ามทำหลายเรื่องพร้อมกัน ทุก error ต้องหา root cause ก่อนแก้ ห้ามเดา
3. ก่อนแก้ไฟล์ใดๆ ให้ขอดูเนื้อหาไฟล์จริงจากผู้ใช้ก่อนเสมอ ห้ามสันนิษฐานว่าไฟล์ถูกแก้แล้ว
4. เมื่อให้คำสั่ง CMD ให้ใส่ทีละบรรทัดในบล็อกแยก (ผู้ใช้วางหลายคำสั่งแล้วบรรทัดมักถูกต่อกัน)
5. เอกสารมีหัวข้อ "สถานะ" ที่ระบุสิ่งที่ยืนยันแล้ว และสิ่งที่ยังไม่ยืนยัน ให้เริ่มจากการถามผู้ใช้เพื่อยืนยันรายการที่ค้างในหัวข้อ 5 ก่อนเริ่มฟีเจอร์ใหม่
6. อย่าพูดเกินจริง ถ้าเรื่องไหนยังไม่ได้ทดสอบ ให้บอกตรงๆ ว่ายังไม่ยืนยัน
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

## 2. หมายเหตุเรื่อง path และสภาพแวดล้อม

- คำสั่งฝั่ง backend ล่าสุดรันที่ `C:\BackendWSP` และไฟล์ใหม่ยืนยันว่าอยู่ใน `C:\BackendWSP\src\...` ส่วนฝั่ง frontend ไฟล์ใหม่ยืนยันที่ `D:\Wpos_star_shop` (เคยรันคำสั่งผิดที่ `C:\Wpos_star_shop` มาครั้งหนึ่ง) **ก่อนสั่งอะไรให้ถามหรือสังเกต path ที่ผู้ใช้รันอยู่เสมอ** และยืนยันว่าแพ็กเกจกับโค้ดอยู่โปรเจกต์เดียวกัน
- เคยเจอ error `Invalid hook call` ตอนเรียก `useState` นอกฟังก์ชันคอมโพเนนต์ (บรรทัดซ้ำใน `ReportsPage.tsx`) ก่อนสงสัยเรื่อง React ซ้ำ ให้ดูเลขบรรทัดใน stack trace ก่อน
- ผลลัพธ์ `npm audit` มี 3 vulnerabilities หลังติดตั้ง `exceljs` (ยังไม่ได้ตรวจรายละเอียด) ห้ามรัน `npm audit fix --force` โดยไม่ดูก่อน

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
- ฟังก์ชัน RPC เป็น `SECURITY DEFINER` และเคยเรียกตรงได้จาก anon/authenticated (ผ่าน `/rest/v1/rpc/...`) → ถอนสิทธิ์แล้ว ยืนยันด้วย `has_function_privilege`: `create_sale` (2 overload), `cancel_sale`, `create_inventory_movement`, `get_daily_sales_report` = anon false / authenticated false / service_role true
- **กฎ: ฟังก์ชันใหม่ทุกตัวต้องรัน `revoke execute ... from public, anon, authenticated` และ `grant execute ... to service_role` ทันที** (ดู SQL หัวข้อ 9)
- ทดสอบตรงเข้า Supabase ด้วย token VIEWER: INSERT เข้า `users` ได้ 42501, เรียก `cancel_sale` ได้ `permission denied for function`, อ่าน/แก้ตารางได้ผลว่างหรือถูกปฏิเสธ
- ทดสอบ ADMIN หลังถอนสิทธิ์: ขาย, ยกเลิกบิล, ปรับสต็อก, เปิดรายงาน ผ่านไม่มี error

### 3.4 Response Convention
- เดี่ยว `{ "data": {...} }`, list `{ "data": [...], "meta": { "total": N } }`, error `{ statusCode, message, error, timestamp, path }` ผ่าน `HttpExceptionFilter` (spread field พิเศษด้วย เช่น `requires_confirmation`), snake_case ทั้งระบบ

### 3.5 Endpoints

| Module | Endpoints | RBAC (VIEWER อ่านได้ทุก GET) |
|---|---|---|
| Auth | `GET /api/auth/me` | ทุก role |
| Users | `GET /api/users` | ADMIN |
| Products | `GET/POST/PATCH/DELETE /api/products` | GET ทุก role, เขียน ADMIN/MANAGER |
| Categories | `GET/POST/PATCH/DELETE /api/categories` | GET ทุก role, เขียน ADMIN/MANAGER |
| Inventory | `POST /api/inventory/movements`, `GET /api/products/:id/movements` | POST ADMIN/MANAGER |
| Sales | `POST /api/sales`, `GET /api/sales`, `GET /api/sales/top-products?from&to&limit`, `GET /api/sales/:id`, `POST /api/sales/:id/cancel` | POST ADMIN/MANAGER/CASHIER, cancel ADMIN/MANAGER |
| Customers | `GET/POST/PATCH/DELETE /api/customers?search=` | PATCH/DELETE ADMIN/MANAGER |
| Promotions | `GET/POST/PATCH /api/promotions?product_id=` | POST/PATCH ADMIN/MANAGER |
| Reports | `GET /api/reports/daily-sales?date=`, **`GET /api/reports/sales-summary?from&to` (ใหม่)**, `POST /api/reports/daily-sales/send?date=` | ADMIN/MANAGER |
| Audit Logs | `GET /api/audit-logs?resource_type=` | ADMIN |
| Settings | `GET/PATCH /api/settings` | GET ทุก role, PATCH ADMIN |
| Health | `GET /api/health` | ไม่ต้อง login |

route order: path คงที่ (`top-products`, `me`) ต้องประกาศก่อน `@Get(':id')`

### 3.6 ระบบแพ็กสินค้า (เสร็จสมบูรณ์)
สินค้าแพ็กไม่มีสต็อกของตัวเอง คำนวณ `floor(สต็อกฐาน / bundle_quantity)` ขายแพ็กหักสต็อกฐานตามขนาด ปรับสต็อกแพ็กตรงๆ ไม่ได้ ห้ามแพ็กซ้อนแพ็ก คอลัมน์ `products.bundle_of_product_id`, `products.bundle_quantity` (CHECK ต้องมีทั้งคู่หรือไม่มีเลย) `create_sale` มี 2 overload ซ้อนกัน (3-param เก่า กับ 4-param ที่ใช้จริง มี `p_customer_id`) `sale_items` เก็บ product_id ของตัวแพ็ก ส่วน `inventory_movements` เก็บที่สินค้าฐาน `ProductsService.remove` ตรวจสาเหตุจริงก่อนลบ (bundle children → sale_items → inventory_movements → promotions) FK ที่ชี้ `products.id`: `inventory_movements`, `sale_items`, `promotions`, `products.bundle_of_product_id`

### 3.7 รายงานช่วงวันที่ (ใหม่) — `sales-summary`
- SQL function `public.get_sales_summary(p_from date, p_to date) returns jsonb` ใช้เวลา `Asia/Bangkok` ตลอด มีวันที่ยอด 0 ครบทุกวันในช่วง นับเฉพาะบิล `COMPLETED` ในยอดขาย แยก `cancelled_bills`/`cancelled_amount` ผลลัพธ์: `{ from, to, total_sales, total_bills, cancelled_bills, cancelled_amount, daily:[{day,bills,sales}], payments:[{payment_method,bills,amount}], top_products:[{product_name,quantity_sold,revenue}] (10 อันดับตามรายได้) }`
- ฝั่ง NestJS: `ReportsService.getSalesSummary(from,to)` ตรวจ วันที่จริง (`isValidIsoDate`), `from <= to`, ช่วงไม่เกิน 366 วัน → `400`; `src/common/utils/thai-date.ts` (`todayInThailand`, `isValidIsoDate`, `daysInclusive`); `src/reports/dto/sales-summary-query.dto.ts`
- `get_daily_sales_report` ถูกแก้ให้ใช้เวลาไทยแล้ว (เดิมใช้ `created_at::date` = UTC); `daily-sales` และ `daily-sales/send` ใช้ `todayInThailand()` เป็นค่าเริ่มต้น
- ตั้งค่าร้านเก็บใน `settings.extra` (JSON): `shop_name` ("WhanWhan"), `shop_address`, `shop_phone`, `tax_id` (ไม่บังคับ — รายงานแสดงเฉพาะเมื่อมีค่า) JSON ต้องไม่มี trailing comma ไม่เช่นนั้นหน้า Settings จะบันทึกไม่ได้

### 3.8 จุดออกแบบอื่นๆ
Promotions ราคาต่ำกว่าทุน → `409` + `requires_confirmation` → ส่งซ้ำด้วย `confirm_below_cost: true`; Audit Logs CREATE/DELETE อัตโนมัติผ่าน `@Audit()` + `AuditInterceptor`, UPDATE log เองใน Service; Reports อีเมล manual + cron เที่ยงคืน; `AuthModule` ↔ `UsersModule` ใช้ `forwardRef`

### 3.9 Database Tables
`users`, `products` (`cost_price`, `bundle_*`), `categories`, `inventory_movements`, `sales` (มี `total_amount`, `status` = COMPLETED/CANCELLED, `payment_method`, `created_at`), `sale_items` (`quantity`, `unit_price`, `subtotal`), `customers`, `promotions`, `audit_logs`, `settings` (single row id=1: `low_stock_threshold`, `vat_rate`, `extra`), และ `monitor_status` (ตารางที่ 11 ที่เห็นใน RLS check ยังไม่ได้ดูโครงสร้าง) คอลัมน์ที่ยืนยันแล้วว่ามีจริง: `sales.payment_method` (ฟังก์ชัน `get_sales_summary` ทำงานได้)

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
├── components/{layout/{Sidebar,AppLayout,DemoBanner}.tsx, ui/{Button,Card,Input,LoadingScreen}.tsx, reports/SalesSummarySection.tsx}
├── hooks/ (useProducts, useSales, useSettings, useSalesSummary, useDailySalesReport, ...)
├── pages/, types/ (auth, product, sale, settings, report, sales-summary, ...), routes.tsx
public/fonts/  ← ต้องมี Sarabun-Regular.ttf และ Sarabun-Bold.ttf สำหรับ PDF
```

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

## 5. สถานะงานรอบนี้ (แยก "ยืนยันแล้ว" กับ "ยังไม่ยืนยัน")

| งาน | สถานะ | หลักฐาน / สิ่งที่ต้องตรวจต่อ |
|---|---|---|
| VIEWER read-only ที่ backend | ✅ ยืนยัน | ผล curl ครบ (หัวข้อ 3.2) |
| RLS ทุกตาราง + ไม่มี policy | ✅ ยืนยัน | `pg_tables`, `pg_policies` |
| ถอนสิทธิ์ RPC จาก anon/authenticated | ✅ ยืนยัน (5 ฟังก์ชัน) | `has_function_privilege`; ฟังก์ชัน `get_sales_summary` ถอนสิทธิ์ในสคริปต์สร้างเอง **แต่ยังไม่ได้รัน query ตรวจซ้ำ** |
| ADMIN ใช้งานได้ปกติหลังถอนสิทธิ์ | ✅ ยืนยัน | ขาย/ยกเลิก/ปรับสต็อก/รายงาน ผ่าน |
| `get_daily_sales_report` เวลาไทย | ✅ ผู้ใช้รันแล้ว | — |
| `get_sales_summary` (SQL) | ✅ ทำงานใน SQL editor | คืน JSON ถูกรูปแบบ แต่ **ยังไม่มีบิล COMPLETED ให้ตรวจตัวเลข** (มีแค่บิลทดสอบที่ยกเลิก 200 บาท) |
| `GET /reports/sales-summary` ผ่าน NestJS | ⚠️ ยังไม่ยืนยัน end-to-end | route ลงทะเบียนแล้ว (เคยได้ 401 เพราะ token หมดอายุ ยังไม่เคยได้ 200/400 จาก curl) |
| VIEWER ฝั่ง frontend (roles.ts, Sidebar, 7 หน้า) | ⚠️ โค้ดแก้แล้ว ยังไม่ยืนยัน UI | ยังไม่ได้ผล `npm run build` และการทดสอบ VIEWER ในหน้าเว็บ (เมนู 11 รายการ, กดบันทึกแล้วได้ข้อความโหมดดูตัวอย่าง, POS ขายไม่ได้) |
| `DemoBanner` | ⏳ ยังไม่เสียบ | ต้องขอดู `AppLayout.tsx` |
| `Select` สวยขึ้น | ⚠️ ส่งโค้ดแล้ว ยังไม่ได้ผล | ตรวจความกว้าง/หน้าตาทุกหน้า |
| ส่งออก Excel | ⚠️ ติดตั้ง `exceljs` ✓ ไฟล์ครบ ✓ | ยังไม่ได้ทดสอบดาวน์โหลดจริง |
| ส่งออก PDF (pdfmake) | ⚠️ แก้ TS2554 ในไฟล์แล้ว | ยังไม่ยืนยัน `npm run build`, **ยังไม่ยืนยันว่าวางฟอนต์ Sarabun ใน `public/fonts` แล้ว**, ยังไม่ดูผล PDF (สระ/วรรณยุกต์ไทย) |
| `ReportsPage.tsx` บรรทัด `useState` ซ้ำนอกฟังก์ชัน | ⚠️ ผู้ใช้ถูกบอกให้ลบบรรทัด 9 | ยังไม่ยืนยันว่าลบแล้ว (เป็นต้นเหตุของ `Invalid hook call`) |
| ข้อมูลร้านใน Settings | ⚠️ ผู้ใช้ส่ง JSON ที่ถูกต้องมา | ยังไม่ยืนยันว่าบันทึกสำเร็จ |
| Pagination/ตัวกรองวันที่ของ `GET /sales` (`from,to,limit,offset`) | ⏸️ ส่งโค้ด Step 1 ให้แล้ว ผู้ใช้สั่งข้ามไปก่อน | ไม่ทราบว่าใส่โค้ดหรือยัง ถ้ายังไม่ใส่ ให้ขอดู `sales.controller.ts`/`sales.service.ts` ก่อน |
| ชุดโปรหลายสินค้า (bundle_items) | ⏸️ ออกแบบแล้ว ผู้ใช้สั่งพักไว้ | SQL ตาราง `bundle_items` ส่งให้แล้วแต่ไม่ทราบว่ารันหรือยัง (ดูหัวข้อ 7) |
| `unit_cost` + กราฟกำไรบน Dashboard | ⏳ วางแผนแล้ว ยังไม่เริ่ม | หัวข้อ 6 ข้อ 3 |
| Soft delete สินค้า / กรอง `is_active` ใน POS / restyle POS+Customers / Vercel build Error | ⏳ ค้างตั้งแต่เอกสารเดิม | ดู `PROJECT_HANDOFF.md` เดิมหัวข้อ 3.7 และ 4 |

---

## 6. Roadmap งานถัดไป (เรียงตามความสำคัญ — ถามผู้ใช้ยืนยันลำดับก่อน)

1. **ปิดงาน VIEWER ฝั่ง frontend:** ตรวจ `npm run build` และ `ReportsPage.tsx`, ทดสอบ VIEWER ในหน้าเว็บ, เสียบ `DemoBanner` ใน `AppLayout.tsx`
2. **ทดสอบการส่งออก Excel/PDF จริง:** วางฟอนต์ Sarabun (`public/fonts/Sarabun-Regular.ttf`, `Sarabun-Bold.ttf` จาก Google Fonts โฟลเดอร์ `static`), ขายบิลทดสอบ 1 ใบแล้วตรวจยอดรวม/วิธีชำระเงินใน JSON เทียบกับรายงาน, ตรวจ `PAYMENT_LABEL`
3. **กำไรจริงบน Dashboard (เกี่ยวกับรายงานเพื่อขอกู้):**
   - ปัญหา: `sale_items` ไม่เก็บต้นทุน ณ ตอนขาย และ Dashboard รวมยอดจาก `GET /sales` ที่ไม่มีรายการสินค้า → ต้องเพิ่ม `sale_items.unit_cost` (snapshot ในตอน `create_sale` — ต้องขอดู SQL ของ `create_sale` 4-param ผ่าน `pg_get_functiondef` ก่อนแก้), backfill บิลเก่าจากต้นทุนปัจจุบัน (ค่าประมาณ), สร้าง SQL function รวมยอด/ต้นทุน/กำไรรายวัน + endpoint (จำกัด `ADMIN/MANAGER`, ซ่อนกำไรจาก CASHIER) แล้วเพิ่มการ์ดกราฟ "ยอดขายและกำไร" + KPI กำไร/อัตรากำไร (ComposedChart ของ recharts)
   - คำเตือนสำคัญ: `cost_price` ของสินค้าเก่าเป็นค่าชั่วคราว 70% ของราคาขาย กำไรจึงดูเป็น 30% ตลอดจนกว่าจะกรอกต้นทุนจริง ห้ามนำตัวเลขกำไรไปแสดงกับผู้ให้กู้ก่อนแก้ ต้นทุนของสินค้าแพ็กต้องเป็นต้นทุนต่อแพ็ก
4. **ล้างข้อมูลทดสอบก่อนใช้งานจริง/ก่อนออกรายงานให้ผู้ให้กู้:** ระบบไม่มีฟังก์ชันลบบิล (มีแต่ยกเลิก) ต้องเขียนสคริปต์ SQL ล้างข้อมูลทดสอบพร้อมขั้นตอนตรวจก่อนลบ (สินค้าชื่อ "ทดสอบ" ฯลฯ และบิลทดสอบ) ทำเมื่อผู้ใช้พร้อมเท่านั้น
5. **หน้าบิลรายใบ (ใบเสร็จ PDF):** เลขที่บิลต่อเนื่อง, ข้อมูลร้านจาก Settings, ตรา "ยกเลิก" สำหรับบิลที่ยกเลิก (ยังแสดงอยู่ ไม่ลบ) ถ้าร้านจดทะเบียน VAT ต้องปรึกษานักบัญชีเรื่องรูปแบบใบกำกับภาษี
6. **โมดูลรายจ่าย (เงินออก):** ระบบตอนนี้มีแต่ "เงินเข้า" (ยอดขาย) ไม่มีบันทึกค่าสินค้าที่ซื้อ ค่าเช่า ค่าแรง ถ้าต้องการโชว์เงินเข้า-เงินออกต้องเพิ่มโมดูลนี้
7. **ชุดโปรหลายสินค้า (ผู้ใช้สั่งพักไว้):** ตัวอย่างความต้องการ: "โปรพิเศษ 1 ชุด" = เหล้า 1 ขวด + น้ำแข็ง 1 ถุง + น้ำเปล่าขวดใหญ่ 2 ขวด กดขาย 1 ชุดแล้วหักสต็อกทุกชิ้นส่วน ออกแบบแล้ว: ตาราง `bundle_items`, สต็อกชุด = min ของ `floor(สต็อกชิ้นส่วน / จำนวนต่อชุด)`, `create_sale` ต้องรวมยอดใช้ชิ้นส่วนทั้งบิลก่อนเช็คสต็อก (กรณีเหล้าเดี่ยว + ชุดโปรในบิลเดียว), `cancel_sale` ต้องคืนสต็อกครบทุกชิ้นส่วน, ต้นทุนชุด = ผลรวมต้นทุนชิ้นส่วน, ห้ามซ้อนกัน, ต้องเพิ่ม `bundle_items` ในการเช็คก่อนลบสินค้า (FK จุดที่ 5) ต้องขอดู `create_sale`/`cancel_sale` + `products.service.ts` ก่อนทำ
8. **ประสิทธิภาพ:** ดูหัวข้อ 7 (ตัวกรองวันที่ `GET /sales`, top-products) และชุด benchmark ที่ทำไว้ใน artifact "POS Performance Benchmarks" (ผู้ใช้เก็บลิงก์ไว้เอง)
9. **ระบบเดโมสำหรับลูกค้าที่สนใจ (แนะนำ ยังไม่ได้ทำ):** VIEWER เห็นข้อมูลจริงของร้านทั้งหมด (ต้นทุน กำไร เบอร์ลูกค้า Audit Logs อีเมลพนักงาน) จึงแนะนำให้แยก Supabase project + deploy อีกชุดพร้อมข้อมูลตัวอย่างสำหรับบัญชี VIEWER ที่ให้บุคคลภายนอกใช้

---

## 7. ปัญหาที่ทราบและความเสี่ยง

- **`GET /sales` ไม่มี pagination/ตัวกรองวันที่:** Dashboard และประวัติการขายโหลดทุกบิล ผู้ช่วยเข้าใจว่า Supabase API จำกัด 1,000 แถวต่อ request โดยค่าเริ่มต้น (ยังไม่ได้ตรวจการตั้งค่า Max rows) ถ้าเป็นจริงยอดจะไม่ครบเมื่อบิลเกิน 1,000 โดยไม่มี error
- **`getTopProducts`:** ใช้ขอบเขตวันที่ UTC (`T00:00:00.000Z`) ไม่ตรงกับเวลาไทย และใช้ `.in('sale_id', ids)` ที่อาจยาวเกิน URL เมื่อช่วงมีบิลหลายร้อยใบ (ยังไม่ได้ทดสอบจุดที่ล้ม) ทางแก้ที่เหมาะคือย้ายไปเป็น SQL function
- **Rate limit `POST /sales` = 10/นาที:** ผู้ใช้มีแคชเชียร์ 2 คน; throttler นับต่อ IP จึงอาจแชร์โควตา ยังไม่ทราบว่า `main.ts` ตั้ง `app.set('trust proxy', 1)` ไว้หรือไม่ (บน Render ถ้าไม่ตั้ง ทุก request อาจนับเป็น IP ของ proxy เดียวกัน) แนะนำพิจารณาเพิ่ม limit เป็น ~30/นาที
- **Cold start Render free:** ผู้ใช้เลือกแก้ด้วย cron ping (แนะนำ cron-job.org/UptimeRobot ยิง `GET /api/health` ทุก ~10 นาทีเฉพาะเวลาเปิดร้าน เพราะแผนฟรีมี 750 ชั่วโมงต่อ workspace ต่อเดือน การ ping 24 ชม. ใช้เกือบทั้งหมดของบริการเดียว) แผนฟรีไม่ได้ออกแบบมาเพื่อ production ระยะยาวควรพิจารณาแผนเสียเงิน
- **สำรองข้อมูล:** ยังไม่ได้ตรวจว่าแผน Supabase ที่ใช้มีสำรองอัตโนมัติหรือไม่ ข้อมูลนี้จะเป็นหลักฐานการเงิน ควร export สำรองเป็นประจำ
- **ความน่าเชื่อถือของรายงานต่อผู้ให้กู้:** ข้อมูลจาก POS เป็นข้อมูลประกอบ ผู้ให้กู้มักถือสเตทเมนต์ธนาคาร งบการเงิน และเอกสารภาษีเป็นหลักฐานหลัก ยอดขายต้องตรงกับเงินเข้าบัญชีจริง ผู้ใช้ควรถามผู้ให้กู้ว่าต้องการเอกสารอะไร และปรึกษานักบัญชี (ผู้ช่วยไม่ใช่ที่ปรึกษาการเงิน/กฎหมาย) อย่าแต่งหรือปรับตัวเลขใดๆ เพื่อให้รายงานดูดี
- JWT expiry 24h, Resend ใช้ domain ทดสอบ, logging เป็น console อย่างเดียว, `cost_price` ชั่วคราว (ตามเอกสารเดิม)
- ค่า `sale_items`/ตารางเก่าไม่มี `unit_cost` จึงยังคำนวณกำไรย้อนหลังไม่ได้

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

## 10. คำแนะนำสำหรับผู้รับช่วงงาน

1. เริ่มจากถามผู้ใช้ให้ยืนยันรายการ ⚠️/⏳ ในหัวข้อ 5 โดยเฉพาะ: `npm run build` ผ่านไหม, `ReportsPage.tsx` แก้ครบไหม, วางฟอนต์ Sarabun แล้วหรือยัง, ทดสอบ VIEWER ในหน้าเว็บแล้วหรือยัง
2. ทำทีละ Step และขอดูไฟล์จริงก่อนแก้เสมอ โดยเฉพาะ `AppLayout.tsx`, `ProductsPage.tsx`, `PosPage.tsx`, `InventoryPage.tsx`, `create_sale`/`cancel_sale` (ใช้ `select pg_get_functiondef(oid) from pg_proc where proname in ('create_sale','cancel_sale')` ซึ่งได้ทุก overload)
3. ทุก endpoint/ฟังก์ชันใหม่ต้องผ่านเช็คลิสต์: มี `AuthGuard` ระดับคลาส, `@Roles` ที่เหมาะสม, ฟังก์ชัน SQL ใหม่ถอนสิทธิ์ anon/authenticated, ตารางใหม่เปิด RLS, ข้อความ error ภาษาไทยที่อ่านรู้เรื่อง, ทดสอบด้วย token ADMIN และ VIEWER
4. ผู้ใช้ชอบคำอธิบายสั้นๆ ที่บอกเหตุผล พร้อมขั้นตอนทดสอบ "ผลที่ควรได้" และให้ส่งผลกลับมา ถ้ามีข้อสงสัยเรื่องข้อเท็จจริงที่อาจเปลี่ยน (ราคา/นโยบายของ Render, Supabase) ให้ค้นข้อมูลปัจจุบันก่อนตอบ
5. เรื่องการเงิน/กฎหมาย/บัญชี (ใบกำกับภาษี, เอกสารขอกู้): ให้ข้อมูลประกอบ และแนะนำให้ปรึกษานักบัญชีหรือผู้ให้กู้ อย่ายืนยันแทน

*เอกสารนี้สร้างจากบทสนทนาการพัฒนา ณ วันที่ 2026-10-13 รายการที่ติด ✅ ยืนยันจากผลที่ผู้ใช้วางกลับมาจริง รายการที่ติด ⚠️/⏳/⏸️ ยังไม่ได้รับการยืนยัน*
