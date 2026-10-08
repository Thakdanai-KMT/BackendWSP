# Wpos Star Shop — Project Handoff Document (Latest)

**อ่านเอกสารนี้ทั้งหมดก่อนเริ่มทำงานต่อ** เขียนไว้ให้ AI ตัวอื่น (หรือ Claude ในเซสชันใหม่) รับช่วงงานต่อได้ทันทีโดยไม่ต้องถามซ้ำ ครอบคลุมทั้ง Backend, Frontend, สถานะ production, และฟีเจอร์ล่าสุด (ระบบแพ็กสินค้า)

---

## 1. ภาพรวมโปรเจกต์

ระบบ POS (Point of Sale) สำหรับร้านค้าภายใน ("Wpos Star Shop") ประกอบด้วย 2 โปรเจกต์:

| โปรเจกต์ | ชื่อ | Path local | เทคโนโลยี | Deploy |
|---|---|---|---|---|
| Backend | **BackendWSP** | `D:\BackendWSP` | NestJS 12 + TypeScript + Supabase | Render (`backendwsp.onrender.com`) |
| Frontend | **Wpos_star_shop** | `D:\Wpos_star_shop` | Vite 8 + React 18 + TS + Tailwind v4 | Vercel (`wpos-star-shop-evgz.vercel.app`) |

- Dev local: Backend `http://localhost:3000/api`, Frontend `http://localhost:5173`
- Frontend repo: **GitHub `Thakdanai-KMT/Wpos_star_shop`**, branch `main`, Vercel auto-deploys on push
- ผู้ใช้ (developer) ใช้ Windows, สื่อสารเป็นภาษาไทย (โค้ด/คำสั่ง/technical terms เป็นอังกฤษ)
- Test user: `somchai@gmail.com` role `ADMIN`

**กฎการทำงานที่ยึดถือมาตลอดโปรเจกต์ (สำคัญมาก อ่านก่อนเริ่มช่วยงาน):**
- พัฒนาทีละ Phase/Step เสมอ ห้ามทำทีเดียวจบทั้งระบบ
- ทุก error ต้องหา root cause ก่อนแก้ ห้ามเดาสุ่ม ห้าม `--force`/`--legacy-peer-deps` โดยไม่มีเหตุผลชัดเจน
- ถ้าไฟล์ไม่ทำงานตามคาด **ขอดูเนื้อหาไฟล์จริงก่อนเสมอ** (`type <file>` บน Windows) ห้ามสันนิษฐานว่าไฟล์ถูกแก้ถูกต้องแล้ว
- **ถ้าแก้โค้ด Backend แล้ว behavior ไม่เปลี่ยนทั้งที่โค้ดถูกต้อง ให้สงสัยก่อนว่า dev server ยังไม่ได้ restart เต็มรูปแบบ** (`Ctrl+C` แล้ว `npm run start:dev` ใหม่) — เกิดซ้ำหลายรอบในโปรเจกต์นี้ ไม่ใช่แค่รอ hot reload
- เวลาผู้ใช้รายงานปัญหาแบบกว้างๆ ("แปลกๆ", "loading", "ลบไม่ได้") ให้ถามคำถามปลายปิด (ask_user_input) แคบลงก่อนแก้ อย่าเดา
- บน Windows CMD: **ห้ามใช้เครื่องหมาย `< >` ตรงๆ ในคำสั่งจริง** (ตีความเป็น file redirection) — ตัวอย่างคำสั่งต้องแทนด้วยค่าจริงเสมอ, JSON ที่ซับซ้อน/มีภาษาไทยให้เขียนลงไฟล์แล้วใช้ `-d @filename.json`, ข้อความภาษาไทยที่ดูเพี้ยนใน CMD output (เช่น `Ó╣ÇÓ©ÑÓ©ó`) มักเป็นแค่ปัญหาการแสดงผล codepage ไม่ใช่ปัญหาเนื้อไฟล์จริง

---

## 2. Backend — BackendWSP

### 2.1 Stack
- NestJS **12.0.1**, Supabase (Postgres + Auth), JWT ผ่าน JWKS
- Test: Vitest, Lint: **Oxlint**, Git branch หลัก `master` (local)
- Rate limit: global 100/min, พิเศษ `POST /api/sales` = 10/min
- Email: Resend (domain ทดสอบ `onboarding@resend.dev`) + exceljs
- **Deploy: Render free tier — cold start 30-50 วินาทีหลัง idle ~15 นาที**

### 2.2 CORS (production)
`main.ts` อ่าน origin จาก env var `CORS_ORIGINS` (comma-separated) fallback `http://localhost:5173` — ตั้งค่าบน Render ให้มีทั้ง `http://localhost:5173` และโดเมน Vercel จริง

### 2.3 Roles (RBAC)
`ADMIN`, `MANAGER`, `CASHIER`, `VIEWER` — auto-provision ตอน login ครั้งแรก default role `CASHIER`

### 2.4 Response Convention
- เดี่ยว: `{ "data": {...} }` / list: `{ "data": [...], "meta": { "total": N } }`
- Error: `{ "statusCode", "message", "error", "timestamp", "path" }` ผ่าน global `HttpExceptionFilter` (spread field พิเศษเข้า response ด้วย เช่น Promotions' `requires_confirmation`)
- snake_case ทั้งระบบ

### 2.5 Endpoints ทั้งหมด

| Module | Endpoints | RBAC |
|---|---|---|
| Auth | `GET /api/auth/me` | ทุก role |
| Users | `GET /api/users` | ADMIN |
| Products | `GET/POST/PATCH/DELETE /api/products` | GET ทุก role, เขียน ADMIN/MANAGER |
| Categories | `GET/POST/PATCH/DELETE /api/categories` | GET ทุก role, เขียน ADMIN/MANAGER |
| Inventory | `POST /api/inventory/movements`, `GET /api/products/:id/movements` | POST ADMIN/MANAGER, GET ทุก role |
| Sales | `POST /api/sales`, `GET /api/sales`, `GET /api/sales/top-products?from&to&limit`, `GET /api/sales/:id`, `POST /api/sales/:id/cancel` | POST ADMIN/MANAGER/CASHIER, GET/top-products ทุก role, cancel ADMIN/MANAGER |
| Customers | `GET/POST/PATCH/DELETE /api/customers?search=` | GET/POST ทุก role, PATCH/DELETE ADMIN/MANAGER |
| Promotions | `GET/POST/PATCH /api/promotions?product_id=` | GET ทุก role, POST/PATCH ADMIN/MANAGER |
| Reports | `GET /api/reports/daily-sales?date=`, `POST /api/reports/daily-sales/send?date=` | ADMIN/MANAGER เท่านั้นทั้งคู่ |
| Audit Logs | `GET /api/audit-logs?resource_type=` | ADMIN เท่านั้น |
| Settings | `GET /api/settings`, `PATCH /api/settings` | GET ทุก role, PATCH ADMIN |

**ข้อควรระวังเรื่อง route order:** path คงที่ (`top-products`, `me`) ต้องประกาศก่อน `@Get(':id')` เสมอ

### 2.6 ระบบแพ็กสินค้า (Pack/Bundle) — ฟีเจอร์ล่าสุด เสร็จสมบูรณ์แล้ว ✅

**โมเดล:** สินค้า "แพ็ก" (เช่น แพ็ก 6 ขวด) ไม่มีสต็อกของตัวเอง — คำนวณจาก `floor(สต็อกสินค้าฐาน / bundle_quantity)` เสมอ ขายแพ็ก 1 ชิ้น → หักสต็อกสินค้าฐานอัตโนมัติตามขนาดแพ็ก ขวดเดี่ยวยังปรับสต็อกตรงๆ ได้ปกติ แต่สินค้าแพ็กปรับสต็อกตรงๆ ไม่ได้เลย ขนาด/ยี่ห้อต่างกัน = สินค้าฐานคนละตัวเสมอ (ไม่มี field ยี่ห้อแยก ใส่ในชื่อสินค้าพอ)

**Schema (`products` table เพิ่ม):**
```sql
bundle_of_product_id uuid REFERENCES products(id)  -- nullable, ชี้ไปสินค้าฐาน
bundle_quantity integer                             -- nullable, จำนวนหน่วยฐานต่อแพ็ก
-- CHECK: ต้องมีทั้งคู่หรือไม่มีเลยทั้งคู่, quantity > 0, ห้ามผูกกับตัวเอง
```

**`create_sale` RPC (เวอร์ชัน 4-param ที่ใช้งานจริง — มี `p_customer_id`):** แก้ให้เช็คและหักสต็อกที่ `bundle_of_product_id` แทนตัวเองเมื่อ item ที่ขายเป็นแพ็ก (`quantity × bundle_quantity`) `inventory_movements` บันทึกที่ product_id ของสินค้าฐาน พร้อม reason บอกชื่อแพ็กที่ขาย ส่วน `sale_items` ยัง insert ด้วย product_id ของตัวแพ็กเอง (ใบเสร็จโชว์ "แพ็ก" ไม่ใช่ขวดเดี่ยว) — **หมายเหตุ: `create_sale` มี 2 overload ซ้อนกันอยู่ใน DB (3-param เก่ากับ 4-param ที่ใช้จริง) แก้แค่ตัว 4-param**

**NestJS layer:**
- `CreateProductDto` เพิ่ม `bundle_of_product_id?` (uuid), `bundle_quantity?` (int, min 1)
- `ProductsService.findAll` คำนวณสต็อกแพ็กจาก in-memory Map ของสินค้าที่ดึงมาพร้อมกัน (ไม่ query เพิ่ม); `findOne` query เพิ่ม 1 ครั้งเฉพาะกรณีเป็นแพ็ก
- `create`/`update` บังคับ `stock_quantity = 0` เมื่อเป็นแพ็ก + validate ผ่าน `assertValidBundleBase` (ห้ามซ้อนแพ็ก คือห้ามแพ็กของแพ็ก)
- `InventoryService.createMovement` เช็คก่อนเรียก RPC เดิม (`create_inventory_movement`) ว่า product เป็นแพ็กไหม ถ้าใช่ throw `BadRequestException` อธิบายเหตุผล — **ไม่ได้แก้ RPC ตัวนี้เลย**
- `ProductsService.remove` เช็คสาเหตุที่แท้จริงก่อนลบเสมอ (เรียงลำดับ: bundle children ก่อน → sale_items → inventory_movements → promotions) แทนการเดาจาก Postgres error code 23503 — แต่ละสาเหตุมีข้อความเฉพาะ แนะนำตั้ง `is_active: false` แทนการลบถ้ามีประวัติผูกอยู่

**ทดสอบ end-to-end ผ่านครบแล้ว:** สร้างแพ็ก → คำนวณสต็อกถูก → ขายผ่าน POS/API → ตัดสต็อกฐานถูก → บล็อกปรับสต็อกแพ็กตรงๆ → บล็อกลบแพ็กที่มีประวัติขายพร้อมข้อความชี้สาเหตุถูกต้อง

### 2.7 จุดออกแบบสำคัญอื่นๆ
- **Promotions:** ราคาต่ำกว่าทุน → `409` พร้อม `requires_confirmation, product_name, cost_price, requested_sale_price` → ส่งซ้ำพร้อม `confirm_below_cost: true`
- **Audit Logs:** CREATE/DELETE อัตโนมัติผ่าน `@Audit()` + `AuditInterceptor`, UPDATE log เองในแต่ละ Service — `resource_type`: `product`, `category`, `promotion`, `customer`, `settings`
- **Reports:** ส่งอีเมล manual + cron เที่ยงคืนทุกวัน (ส่งของ "เมื่อวาน")

### 2.8 Circular Dependency ที่เคยเจอ
`AuthModule` ↔ `UsersModule` — แก้ด้วย `forwardRef(() => X)` ทั้งสองฝั่ง ถ้าสร้าง module ใหม่ที่ import ทั้งคู่ ระวังซ้ำ

### 2.9 Database Tables
`users`, `products` (มี `cost_price`, `bundle_of_product_id`, `bundle_quantity`), `categories` (self-ref `parent_id`), `inventory_movements`, `sales`, `sale_items`, `customers`, `promotions`, `audit_logs`, `settings` (single row id=1)

**FK ที่อ้างอิงถึง `products.id`:** `inventory_movements.product_id`, `sale_items.product_id`, `promotions.product_id`, `products.bundle_of_product_id` (self-ref) — ต้องนึกถึงทั้ง 4 จุดนี้เวลาจะลบสินค้าจริง

---

## 3. Frontend — Wpos_star_shop

### 3.1 Stack
Vite 8 + React 18 + TS + Tailwind v4 (`@theme` ใน CSS), Oxlint, `@supabase/supabase-js` (publishable key เท่านั้น), `react-router-dom`, `promptpay-qr` + `qrcode.react`, `recharts`

### 3.2 Auth Flow
Login ผ่าน Supabase Auth ตรง → `access_token` → `Authorization: Bearer` ทุก request → `GET /api/auth/me` เพื่อ role จริง (ห้ามเชื่อ role จาก JWT)

### 3.3 Structure
```
src/
├── lib/{supabase,api-client,promptpay}.ts
├── contexts/AuthContext.tsx
├── components/
│   ├── layout/{Sidebar,AppLayout}.tsx
│   └── ui/{Button,Card,Input,LoadingScreen}.tsx
├── pages/, hooks/, types/
└── routes.tsx
```

### 3.4 Design System (ธีมปัจจุบัน)
**โทนกรมท่า-ทอง** (`brand-900 #1b2340`, `gold-500 #e8a33d`), ฟอนต์ **IBM Plex Sans Thai**, การ์ดขอบมน 8px ไม่มีเงา (เงาเฉพาะ modal), เส้นคั่นแทนเงาในตาราง

**Shared UI components** (`src/components/ui/`): `Button` (primary/secondary/danger/ghost), `Card`, `Input`/`Select`/`Textarea`, `LoadingScreen`

**Pattern ที่ใช้ซ้ำทุกหน้า:**
- Badge สถานะ = pill สีอ่อน
- Modal: `fixed inset-0 bg-black/40 p-4` + `rounded-xl shadow-xl` + `stopPropagation` — **ระวัง: wrapper ที่ stopPropagation ต้องกำหนดความกว้างตรงกับเนื้อหาจริงเสมอ ไม่ใช่แค่ `h-full`** (เคยมีบั๊กที่ wrapper กว้างเต็มจอบัง backdrop click ทั้งหมด)
- ตารางยาว: `overflow-x-auto` + `min-w-[...]`
- แถบสัดส่วน (revenue bar): `<div className="h-1 bg-surface rounded-full"><div className="h-1 bg-gold-500 rounded-full" style={{width:...}} /></div>`

**หน้าที่ restyle แล้ว:** Login, Dashboard, AppLayout/Header, Products, Categories, Inventory, Sales History, Promotions, Reports, Audit Logs, Settings
**หน้าที่ยังไม่ restyle:** **POS**, **Customers**

### 3.5 Dashboard (analytics เต็มรูปแบบ)
เลือกช่วงวันที่ + ปุ่มลัด (วันนี้/7วัน/30วัน/เดือนนี้), รวมยอดจาก `GET /api/sales` ฝั่ง client ด้วย `useMemo` จัดกลุ่มตามวันที่ท้องถิ่น (**ใช้ `getFullYear/getMonth/getDate` ไม่ใช่ `toISOString()`**), บิล `CANCELLED` ไม่นับยอดขาย, 4 KPI cards พร้อม % เทียบช่วงก่อนหน้า, `AreaChart` + `PieChart` (recharts), การ์ด "สินค้าขายดี 5 อันดับแรก" จาก `GET /api/sales/top-products`

### 3.6 ระบบแพ็กสินค้า — ฝั่ง Frontend (เสร็จสมบูรณ์แล้ว ✅)
- `src/types/product.ts`: `Product`/`CreateProductInput` มี `bundle_of_product_id`, `bundle_quantity`
- `ProductsPage.tsx`: checkbox "สินค้านี้เป็นแพ็กของสินค้าอื่น" → เปิด dropdown เลือกสินค้าฐาน (กรองไม่ให้เลือกตัวเองหรือสินค้าที่เป็นแพ็กอยู่แล้ว) + ช่องจำนวนต่อแพ็ก; badge สีทอง "แพ็ก N × ชื่อฐาน" ในตาราง
- `InventoryPage.tsx`: ถ้าสินค้าที่เลือกเป็นแพ็ก (`isBundle`) ซ่อนฟอร์มปรับสต็อก แสดงกล่องอธิบายสีทองแทน พร้อมชื่อสินค้าฐาน; หน่วยนับเปลี่ยนเป็น "แพ็ก" แทน "ชิ้น"

### 3.7 งานค้างที่เพิ่งคุยกัน (ยังไม่ได้ทำ — ต้องทำต่อ)

**(A) เปลี่ยนปุ่ม "ลบ" ในหน้า Products เป็น Soft Delete** — อยู่ระหว่างดำเนินการ ผู้ใช้ยืนยันแนวทางแล้ว (ใช้ `is_active: false` แทนการลบจริง) แต่**ยังไม่ได้ confirm ว่าทดสอบผ่าน** หลัง STEP ล่าสุดที่ส่งโค้ดไป:
- `useProducts.ts` เพิ่ม `setProductActive(id, isActive)` เรียก `PATCH /products/:id` ด้วย `{is_active}`
- `ProductsPage.tsx`: ปุ่ม "ลบ" → "ปิดการใช้งาน"/"เปิดใช้งาน" สลับทิศทางอัตโนมัติ, คอลัมน์ "สถานะ" ใหม่ในตาราง (badge เขียว/เทา), แถวที่ปิดใช้งานจางลง (`opacity-50`)
- **ยังไม่ทดสอบ** — ต้องขอผลทดสอบจากผู้ใช้ก่อน

**(B) หน้า POS ยังไม่กรองสินค้า `is_active: false` ออก** — ค้นพบระหว่างคุยเรื่อง soft delete พนักงานขายอาจยังเห็น/เลือกขายสินค้าที่ปิดการใช้งานแล้วได้ใน POS ซึ่งขัดกับเจตนาฟีเจอร์ **ถามผู้ใช้ไปแล้วว่าจะแก้ไหม ยังไม่ได้รับคำตอบ** — ควรติดตามเรื่องนี้ต่อ (แก้ `PosPage.tsx` ให้ `filteredProducts` กรอง `p.is_active` ด้วย)

### 3.8 บั๊กสำคัญที่เจอและแก้ไปแล้ว (ระวังอย่าทำซ้ำ)

1. **Race condition ตอน login** — `AuthContext` ต้อง `setIsLoading(true)` ทุกครั้งที่เริ่ม fetch ใหม่
2. **Tab-switch ทำฟอร์มหาย** — Supabase ยิง `SIGNED_IN` ซ้ำตอนสลับ tab แก้ด้วย track `loadedUserId` ผ่าน `useRef`
3. **Mobile drawer: คลิก backdrop ไม่ปิดเมนู** — wrapper `stopPropagation` ไม่ได้กำหนดความกว้าง (`w-64`)
4. **Sidebar สูงไม่เต็มจอ** — ต้อง `sticky top-0 h-screen shrink-0` + `h-full overflow-y-auto`
5. **`/auth/me` response format ไม่ตรง convention** — เคย `{user:...}` แก้เป็น `{data:...}`
6. **Success message หายก่อนเห็น** (POS) — เงื่อนไขซ้อนผิดที่ ต้องแยกจาก `{cart.length > 0 && ...}`
7. **`ApiError` ต้องเก็บ `.details: Record<string, unknown>`** — สำหรับ field พิเศษจาก error response
8. **Vercel: `VITE_API_BASE_URL` ขาด `https://`**
9. **Vercel SPA 404 ตอน refresh** — ต้องมี `vercel.json` rewrite rule
10. **React key บน Fragment ไม่ใช่ `<tr>` ข้างใน** เวลา `.map()` คืน 2 แถว

### 3.9 ความคืบหน้า PHASE หลัก — ครบทั้ง 18 Phase ตามแผนเดิมแล้ว ✅
Products, Categories, Inventory, POS, Sales History, Customers, Promotions, Reports, Audit Logs, Settings — ทุกหน้าทำงานได้จริง

**Extension phases (นอกแผนเดิม):** responsive design, design system เต็มระบบ, deploy production จริง, Dashboard analytics, **ระบบแพ็กสินค้า (เสร็จสมบูรณ์)**, soft-delete (กำลังทำ)

---

## 4. งานที่ค้างอยู่ตอนนี้ (รับช่วงต่อจากตรงนี้ — เรียงตามความสำคัญ)

### 4.1 ยืนยันผลทดสอบ Soft Delete (เรื่องด่วนสุด)
โค้ด `useProducts.ts` + `ProductsPage.tsx` เวอร์ชัน soft-delete ถูกส่งให้ผู้ใช้ไปแล้วแต่**ยังไม่ได้รับผลทดสอบกลับมา** — ถามก่อนว่าทดสอบหรือยัง ถ้ายัง ให้ขอผลทดสอบ (ปิด/เปิดการใช้งานสินค้า, badge สถานะ, แถวจางลง)

### 4.2 กรองสินค้า `is_active: false` ออกจากหน้า POS
ผู้ใช้ยังไม่ได้ตอบว่าจะทำไหม — ถามก่อนเริ่ม ถ้าตกลง ต้องขอดู `PosPage.tsx` ปัจจุบันก่อนแก้ (ยังไม่เคย restyle และมีการแก้เรื่อง bundle มาก่อนหน้านี้ด้วยหรือยังไม่แน่ใจ ต้องเช็คให้ชัวร์)

### 4.3 Design system rollout — เหลือ 2 หน้า
**POS** และ **Customers** ยังเป็นสไตล์เก่า — POS ซับซ้อนสุด (ตะกร้า cap ตามสต็อก, QR พร้อมเพย์ reactive ตาม `cartTotal`, ล่าสุดอาจมี `is_active` filter เพิ่มด้วยถ้าทำข้อ 4.2 ก่อน) ต้องระวังไม่ให้ logic เพี้ยนตอน restyle

### 4.4 Deployment — ยังมี deployment ค้างสถานะ "Error" บน Vercel
Commit **"feat: enhance ProductsPage with improved UI components..."** ขึ้น Error — **ยังไม่เคยได้รับ Build Logs มาดูเลยตลอดการสนทนา** แม้ขอหลายครั้ง ควรติดตามต่อ (แต่สังเกตว่า `ProductsPage.tsx` เวอร์ชันล่าสุดที่เห็นในบทสนทนา (ตอนทำ bundle feature) หน้าตาถูกต้องสมบูรณ์ดี อาจเป็นแค่ deployment เก่าที่ build fail ไปแล้วจบไป ไม่กระทบโค้ดปัจจุบัน — ควรเช็คให้ชัวร์)

### 4.5 คำแนะนำสำหรับผู้รับช่วงงานต่อ
1. **เริ่มจากถาม user ว่า 4.1 (soft delete) ทดสอบผ่านหรือยัง** ก่อนเรื่องอื่น
2. ทำทีละ STEP เสมอ อย่า migrate/แก้หลายเรื่องพร้อมกัน
3. ก่อนแก้ไฟล์ใดๆ โดยเฉพาะ `ProductsPage.tsx`, `PosPage.tsx`, `InventoryPage.tsx` (ที่แก้บ่อยและมีคนแก้นอกบทสนทนาด้วย) **ขอดูเนื้อหาไฟล์ปัจจุบันก่อนเสมอ**
4. ถ้า user รายงานปัญหากว้างๆ ใช้ `ask_user_input` ถามตัวเลือกแคบลงก่อนแก้
5. เพิ่ม endpoint ใหม่ใน NestJS ต้องเช็ค route order + **restart dev server เต็มรูปแบบเสมอ**
6. ทำ backdrop/modal ใหม่ ตรวจสอบว่า wrapper ที่ `stopPropagation` มีขนาดตรงกับเนื้อหาจริง
7. บน Windows CMD ของผู้ใช้: ห้ามใช้ `< >` ตรงๆ ในคำสั่งตัวอย่าง, ให้ค่า test JSON แบบแทนที่ครบแล้วเสมอ, เขียนไฟล์ก่อนแล้ว `-d @file.json` สำหรับ JSON ซับซ้อน

---

## 5. Backend ที่อาจต้องแก้เพิ่มในอนาคต
- `cost_price` สินค้าเก่า backfill เป็น 70% ของ `unit_price` (placeholder) — ควรใส่ค่าจริงทีละตัว
- JWT expiry 24h (สะดวกตอน dev) — ควรลดและทำ refresh flow ก่อน production จริงจัง
- Resend ยังใช้ domain ทดสอบ — ต้องซื้อ domain จริง
- Logging เป็น console output อย่างเดียว

---

*เอกสารนี้สร้างจากบทสนทนาการพัฒนาทั้งหมดของทั้งสองโปรเจกต์ ผ่านการยืนยันด้วยการทดสอบจริงของผู้ใช้ในแทบทุกขั้นตอน ยกเว้นหัวข้อ 4 (งานค้าง) ซึ่งยังไม่เสร็จหรือยังไม่ได้รับการยืนยัน*
