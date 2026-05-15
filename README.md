# 🚛 Shipping & Fuel Claim Management System

ระบบบริหารจัดการการขนส่ง การเบิกจ่ายเงินล่วงหน้า และการเคลมค่าน้ำมันแบบครบวงจร พัฒนาด้วยสถาปัตยกรรมสมัยใหม่ (Modern Full-Stack) เน้นความโปร่งใส ตรวจสอบได้ และใช้งานง่าย

---

## 📋 สารบัญ
- [1. รายละเอียดสถาปัตยกรรม (Architecture)](#1-รายละเอียดสถาปัตยกรรม-architecture)
- [2. การออกแบบฐานข้อมูล (Database Design)](#2-การออกแบบฐานข้อมูล-database-design)
- [3. ระบบความปลอดภัยและสิทธิ์ (Auth & Permissions)](#3-ระบบความปลอดภัยและสิทธิ์-auth--permissions)
- [4. ขั้นตอนการอนุมัติ (Approval Workflow)](#4-ขั้นตอนการอนุมัติ-approval-workflow)
- [5. ระบบตรวจสอบประวัติ (Audit Logging)](#5-ระบบตรวจสอบประวัติ-audit-logging)
- [6. วิธีการติดตั้งและรันโปรเจกต์ (Getting Started)](#6-วิธีการติดตั้งและรันโปรเจกต์-getting-started)

---

## 1. รายละเอียดสถาปัตยกรรม (Architecture)

ระบบแบ่งออกเป็น 3 ส่วนหลัก (Three-Tier Architecture):
*   **Frontend:** พัฒนาด้วย **React 18 + TypeScript** ใช้ **Vite** เป็น Build Tool และ **Tailwind CSS** สำหรับงาน UI/UX เน้นการแสดงผลแบบ Responsive และ Dashboard ที่ปรับเปลี่ยนตามสิทธิ์ผู้ใช้
*   **Backend:** พัฒนาด้วย **ASP.NET Core 8 Web API (C#)** ใช้หลักการ Clean Architecture เบื้องต้น มีการใช้ DTOs เพื่อความปลอดภัยในการส่งข้อมูล
*   **Database:** ใช้ **PostgreSQL** เป็นระบบจัดการฐานข้อมูลหลัก เชื่อมต่อผ่าน **Entity Framework Core (EF Core)** แบบ Code-First

---

## 2. การออกแบบฐานข้อมูล (Database Design)

### ตารางหลักในระบบ:
1.  **Users:** เก็บข้อมูลพนักงาน
    *   `Id`, `Username`, `PasswordHash`, `FullName`, `Role`, `VehiclePlate`, `IsActive`
2.  **Shipments (การเดินรถ):** ศูนย์กลางของข้อมูลการทำงาน
    *   `Id`, `TripNumber` (Unique), `Origin`, `Destination`, `StartMileage`, `EndMileage`, `Status` (Active/Completed)
3.  **Withdrawals (การขอเบิกเงิน):** รายการเงินทดลองจ่าย
    *   `Amount`, `Reason`, `Status` (Pending/ApprovedByManager/ApprovedByFinance/Rejected), `ManagerId`, `FinanceId`
4.  **FuelClaims (การเคลมน้ำมัน):** รายการเคลมหลังจบงาน
    *   `ClaimAmount`, `ReceiptUrl` (ลิงก์รูปใบเสร็จ), `MileageOut`, `MileageIn`, `Status`
5.  **AuditLogs:** เก็บประวัติการเปลี่ยนแปลง
    *   `TableName`, `RecordId`, `Action` (CREATE/UPDATE/DELETE), `OldValue`, `NewValue`, `PerformedBy`

---

## 3. ระบบความปลอดภัยและสิทธิ์ (Auth & Permissions)

ระบบใช้ **JWT (JSON Web Token)** ในการยืนยันตัวตน (Authentication) และกำหนดสิทธิ์ (Authorization):

### บทบาทผู้ใช้งาน (User Roles):
*   **Driver (พนักงานขับรถ):**
    *   สร้างเลขที่เดินรถ (Shipment)
    *   ส่งรายการขอเบิกเงิน และเคลมน้ำมัน (พร้อมอัปโหลดรูป)
    *   ดูสถานะรายการของตัวเอง
*   **Manager (หัวหน้างาน):**
    *   อนุมัติหรือปฏิเสธรายการเบิก/เคลม ในระดับที่ 1 (Level 1)
    *   ดูรายงานภาพรวมของพนักงานทุกคน
*   **Finance (ฝ่ายการเงิน):**
    *   อนุมัติขั้นสุดท้าย (Final Approval) หลังจาก Manager อนุมัติแล้ว
    *   ยืนยันการจ่ายเงินเข้าสู่ระบบบัญชี
*   **Admin (ผู้ดูแลระบบ):**
    *   จัดการบัญชีผู้ใช้ (เพิ่ม/ลบ/แก้ไข)
    *   ดู **Audit Log** เพื่อตรวจสอบความโปร่งใส
    *   **สิทธิ์พิเศษ:** สามารถลบรายการที่ผิดพลาดออกจากระบบได้

---

## 4. ขั้นตอนการอนุมัติ (Approval Workflow)

ระบบออกแบบมาให้มีการตรวจสอบ 2 ชั้น (Double Check) เพื่อป้องกันความผิดพลาดทางการเงิน:

### 💰 ขั้นตอนการเบิกเงิน (Withdrawal) & เคลมน้ำมัน (Fuel Claim)
1.  **Driver Submit:** คนขับสร้างรายการ (สถานะ: `Pending`)
2.  **Manager Review:** หัวหน้างานตรวจสอบข้อมูล
    *   หากผ่าน -> สถานะ: `ApprovedByManager`
    *   หากไม่ผ่าน -> สถานะ: `Rejected` (จบ Workflow)
3.  **Finance Finalize:** ฝ่ายการเงินตรวจสอบรายการที่ Manager อนุมัติแล้ว
    *   หากผ่าน -> สถานะ: `ApprovedByFinance` (สำเร็จ/จ่ายเงิน)
    *   หากไม่ผ่าน -> สถานะ: `Rejected` (จบ Workflow)

---

## 5. ระบบตรวจสอบประวัติ (Audit Logging)

เป็นหัวใจสำคัญของระบบการเงิน (Financial Transparency):
*   **Automatic Tracking:** ทุกครั้งที่มีการสร้าง แก้ไข หรือลบข้อมูล ระบบจะเรียกใช้ `AuditService` อัตโนมัติ
*   **Data Snapshot:** บันทึกข้อมูลก่อนแก้ไข (OldValue) และหลังแก้ไข (NewValue) เป็น JSON
*   **Traceability:** สามารถระบุได้ว่าใครเป็นคนทำรายการ ณ เวลาใด (Timestamp)
*   **Admin Dashboard:** มีหน้าจอเฉพาะสำหรับ Admin ในการ Filter ดูประวัติแยกตามตาราง หรือประเภทการกระทำ (เช่น ดูเฉพาะรายการที่ถูก DELETE)

---

## 6. วิธีการติดตั้งและรันโปรเจกต์ (Getting Started)

### 🐋 วิธีที่ 1: รันผ่าน Docker (แนะนำและรวดเร็วที่สุด)
1. ติดตั้ง [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. เปิด Terminal ในโฟลเดอร์โปรเจกต์
3. รันคำสั่ง:
   ```bash
   docker-compose up --build -d
   ```
4. เข้าใช้งาน:
   *   Frontend: `http://localhost:5173`
   *   Backend API (Swagger): `http://localhost:5000/swagger`

---

### 🛠️ วิธีที่ 2: ติดตั้งแบบ Manual (สำหรับนักพัฒนา)

#### **1. ตั้งค่าสภาพแวดล้อม (Environment Setup)**
เพื่อความปลอดภัย ระบบจะไม่เก็บรหัสผ่านจริงไว้ใน Source Control ให้ทำตามขั้นตอนดังนี้:
1. ก๊อปปี้ไฟล์ `.env.example` และเปลี่ยนชื่อเป็น `.env`
2. ใส่ข้อมูลจริงของคุณในไฟล์ `.env` (เช่น รหัสผ่านฐานข้อมูล, JWT Key, Google Client ID)

#### **2. Backend (.NET 8)**
1. ติดตั้ง [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) และ **PostgreSQL**
2. ไปที่โฟลเดอร์ `backend`
3. (ตัวเลือก) หากไม่ใช้ Environment Variables ให้สร้างไฟล์ `appsettings.Development.json` โดยดูโครงสร้างจาก `appsettings.json`
4. รันคำสั่ง:
   ```bash
   dotnet ef database update
   dotnet run --urls "http://localhost:5000"
   ```

#### **3. Frontend (React)**
1. ติดตั้ง [Node.js](https://nodejs.org/) (แนะนำ v18+)
2. ไปที่โฟลเดอร์ `frontend`
3. รันคำสั่ง:
   ```bash
   npm install
   npm run dev
   ```

---

---

## 7. ระบบออกรายงานบัญชี (Accounting Reports) 📊

ระบบมีหน้าจอพิเศษสำหรับการสรุปยอดทางการเงิน (Daily Financial Summary) เพื่อใช้ส่งต่อให้กับฝ่ายบัญชีหรือตรวจสอบยอดประจำวัน:

*   **ตารางสรุปทดลองจ่าย:** ออกแบบตามมาตรฐานตารางบัญชี (Daily Trial Payment Summary)
*   **การคำนวณอัตโนมัติ:** รวมยอดค่าน้ำมัน (Fuel Claim) และเบี้ยเลี้ยง/เงินทดลองจ่าย (Withdrawal) แยกตามรายเลขที่แผนการเดินรถ (Trip Number)
*   **Print-Friendly Design:** รองรับการพิมพ์ผ่านเบราว์เซอร์ (`window.print()`) โดยจัดรูปแบบเป็น **แนวนอน (Landscape)** และลบส่วนที่ไม่จำเป็นออกให้อัตโนมัติ เพื่อให้ได้เอกสาร PDF ที่สะอาดเหมือนเอกสารราชการ
*   **Universal Date Format:** ทุกจุดในรายงานใช้รูปแบบวันที่แบบ **dd/mm/yyyy (ค.ศ.)** เช่น `09/05/2026` เพื่อความชัดเจนและเป็นสากล
*   **Signature Section:** มีส่วนสำหรับลายเซ็น ผู้จัดทำ, ผู้ตรวจสอบ และผู้อนุมัติ ท้ายรายงาน

---

## 8. การจัดการสถานะงานวิ่ง (Shipment Lifecycle)

งานเดินรถจะมีวงจรชีวิต (Lifecycle) ที่ชัดเจนเพื่อให้ตรวจสอบได้:
1.  **Active (กำลังดำเนินการ):** เมื่อสร้างงานใหม่ สถานะจะเป็น Active เสมอ
2.  **Completed (เสร็จสิ้น):** เมื่อส่งของเสร็จสิ้น **คนขับ (Driver)** หรือ **ผู้ดูแลระบบ (Admin)** สามารถกดปุ่ม "ปิดงาน" เพื่อบันทึกเลขไมล์สิ้นสุด (`EndMileage`) และเปลี่ยนสถานะเป็น Completed
3.  **Reporting:** งานที่ถูกปิดแล้วจะถูกดึงไปแสดงในหน้า "ออกรายงาน" เพื่อสรุปยอดเงินและปิดบัญชี

---

## 📡 API Endpoints (อัปเดตล่าสุด)

| หมวดหมู่ | Method | Endpoint | คำอธิบาย | สิทธิ์ (Role) |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | POST | `/api/auth/login` | เข้าสู่ระบบด้วยบัญชีปกติ | ทุกคน |
| | POST | `/api/auth/google-login` | เข้าสู่ระบบด้วย Google | ทุกคน |
| **Shipments**| GET | `/api/shipments` | ดูรายการเดินรถทั้งหมด | ทุกคน |
| | POST | `/api/shipments` | สร้างรายการเดินรถใหม่ | Driver/Admin |
| | PUT | `/api/shipments/{id}` | แก้ไขข้อมูลการเดินทาง | Driver/Admin |
| | PATCH | `/api/shipments/{id}/complete`| ปิดงานและบันทึกเลขไมล์ (เสร็จสิ้น) | Driver/Admin |
| | DELETE | `/api/shipments/{id}` | ลบรายการเดินรถและรายการเงินที่เกี่ยวข้อง | Admin |
| **Finance** | POST | `/api/withdrawals` | ส่งขอเบิกเงินล่วงหน้า | Driver/Admin |
| | PATCH | `/api/withdrawals/{id}/approve` | Manager อนุมัติเบิกเงิน | Manager/Admin |
| | PATCH | `/api/withdrawals/{id}/finance-approve` | Finance อนุมัติเบิกเงิน | Finance/Admin |
| **Claims** | POST | `/api/claims` | ส่งเคลมค่าน้ำมัน (พร้อมแนบสลิป) | Driver/Admin |
| | PATCH | `/api/claims/{id}/approve` | Manager อนุมัติเคลม | Manager/Admin |
| | PATCH | `/api/claims/{id}/finance-approve` | Finance อนุมัติเคลม | Finance/Admin |
| **Admin** | GET | `/api/users` | ดูรายชื่อพนักงานทั้งหมด | Admin |
| | GET | `/api/audit-logs` | ดูประวัติการแก้ไขข้อมูล (Audit Trail) | Admin |
| **Uploads** | POST | `/api/uploads` | อัปโหลดรูปภาพใบเสร็จ/หลักฐาน | ทุกคน |
| **External** | GET | `/api/externaldata/oil-price` | ดึงราคาน้ำมัน PTT ล่าสุด (Backend Proxy) | ทุกคน |

---

## 9. ระบบซิงค์ราคาน้ำมันอัตโนมัติ (Oil Price Automation) ⛽

ระบบมีการเชื่อมต่อข้อมูลราคาน้ำมันแบบเรียลไทม์เพื่อความแม่นยำในการทำรายงาน:
*   **Backend Proxy:** ใช้ Backend ทำหน้าที่เป็น Proxy ไปดึงข้อมูลจากแหล่งข้อมูลกลาง (เช่น Kapook/PTT) เพื่อแก้ปัญหา CORS Blocking
*   **Real-time Sync:** เมื่อเปิดหน้าออกรายงาน ระบบจะดึงราคาน้ำมันดีเซลล่าสุดมาใส่ในช่อง "อัตราน้ำมัน" ให้โดยอัตโนมัติ
*   **Manual Sync Button:** มีปุ่มกดซิงค์ (🔄) ในหน้ารายงานเพื่อให้ผู้ใช้สามารถอัปเดตราคาน้ำมันได้ตลอดเวลาโดยไม่ต้องรีโหลดหน้าเว็บ

---

## 10. การปรับปรุงส่วนติดต่อผู้ใช้ (Enhanced Sidebar UI) 📱

แถบเมนูข้าง (Sidebar) ถูกปรับปรุงให้มีความเป็นสัดส่วนและใช้งานง่ายขึ้น:
*   **System Admin Section:** แยกเมนูการจัดการระบบ (User Management & Audit Log) ออกมาเป็นสัดส่วนชัดเจนสำหรับ Admin
*   **Sticky Bottom Profile:** ย้ายส่วนข้อมูลผู้ใช้และปุ่ม "ออกจากระบบ" ไปไว้ที่ด้านล่างสุดของ Sidebar เพื่อให้เข้าถึงได้ง่ายและไม่รบกวนพื้นที่เมนูหลัก
*   **Visual Feedback:** เพิ่มไอคอนและเอฟเฟกต์สี (เช่น สีแดงสำหรับ Logout, สีม่วงสำหรับ Admin) เพื่อสื่อความหมายที่ชัดเจน

---

## 11. ระบบจัดเก็บข้อมูลและป้องกันการทำรายการซ้ำ (Storage & Duplicate Protection) 🛡️

ระบบมีการเพิ่มกลไกขั้นสูงเพื่อประสิทธิภาพและความโปร่งใสในการจัดการไฟล์และรายการการเงิน:
*   **SHA256 File Deduplication:** ระบบจะคำนวณ "ลายนิ้วมือดิจิทัล" (Hash) ของทุกไฟล์ที่อัปโหลด หากมีการอัปโหลดไฟล์เดิมซ้ำ ระบบจะใช้ไฟล์เดิมที่มีอยู่แทนการบันทึกใหม่ เพื่อประหยัดพื้นที่จัดเก็บได้มหาศาล
*   **Global Receipt Reuse Block:** ป้องกันทุจริตโดยการตรวจสอบว่า "รูปใบเสร็จ" นี้เคยถูกใช้ในรายการเคลมอื่นไปแล้วหรือไม่ หากเคยใช้แล้วระบบจะบล็อกการส่งรายการซ้ำทันทีทั่วทั้งระบบ
*   **Auto-Repair on Startup:** เมื่อแอปพลิเคชันเริ่มต้น ระบบจะสแกนและซ่อมแซมรหัสไฟล์ (Hash) ให้กับไฟล์เก่าโดยอัตโนมัติ เพื่อให้ระบบตรวจสอบความซ้ำซ้อนทำงานได้สมบูรณ์ 100%
*   **Improved Image Management:** หน้าฟอร์มเคลมน้ำมันมาพร้อมกับระบบพรีวิวรูปภาพขนาดใหญ่และปุ่มลบรูปภาพ (Remove) เพื่อให้คนขับสามารถจัดการไฟล์ได้สะดวกก่อนส่งข้อมูล

---

## 🔐 ข้อมูลบัญชีผู้ดูแลระบบ (Initial Account)
| Role | Username | Password |
|------|----------|----------|
| Admin | `master_admin` | `Shipping_Master_2026!` |

> [!IMPORTANT]
> เพื่อความปลอดภัย ระบบได้ทำการลบบัญชีทดสอบ (Driver, Manager, Finance) ออกจาก Code เบื้องต้นแล้ว กรุณาใช้บัญชี Admin ด้านบนเข้าไปสร้าง User และกำหนด Role ต่างๆ ผ่านเมนู User Management ในระบบภายหลังครับ
