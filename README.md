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

#### **Backend (.NET 8)**
1. ติดตั้ง [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) และ **PostgreSQL**
2. ไปที่โฟลเดอร์ `backend`
3. แก้ไข Connection String ใน `appsettings.json` ให้ตรงกับฐานข้อมูลของคุณ
4. รันคำสั่ง:
   ```bash
   dotnet ef database update
   dotnet run --urls "http://localhost:5000"
   ```

#### **Frontend (React)**
1. ติดตั้ง [Node.js](https://nodejs.org/) (แนะนำ v18+)
2. ไปที่โฟลเดอร์ `frontend`
3. รันคำสั่ง:
   ```bash
   npm install
   npm run dev
   ```

---

## 📡 API Endpoints (สรุปรายการ API)

| หมวดหมู่ | Method | Endpoint | คำอธิบาย | สิทธิ์ (Role) |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | POST | `/api/auth/login` | เข้าสู่ระบบด้วยบัญชีปกติ | ทุกคน |
| | POST | `/api/auth/google-login` | เข้าสู่ระบบด้วย Google | ทุกคน |
| **Shipments**| GET | `/api/shipments` | ดูรายการเดินรถทั้งหมด | ทุกคน |
| | POST | `/api/shipments` | สร้างรายการเดินรถใหม่ | Driver/Admin |
| | PATCH | `/api/shipments/{id}/complete`| ปิดงานและบันทึกเลขไมล์ | Driver/Admin |
| | DELETE | `/api/shipments/{id}` | ลบรายการเดินรถ | Admin |
| **Finance** | POST | `/api/withdrawals` | ส่งขอเบิกเงินล่วงหน้า | Driver/Admin |
| | PATCH | `/api/withdrawals/{id}/approve` | Manager อนุมัติเบิกเงิน | Manager/Admin |
| | PATCH | `/api/withdrawals/{id}/finance-approve` | Finance อนุมัติเบิกเงิน | Finance/Admin |
| **Claims** | POST | `/api/claims` | ส่งเคลมค่าน้ำมัน | Driver/Admin |
| | PATCH | `/api/claims/{id}/approve` | Manager อนุมัติเคลม | Manager/Admin |
| | PATCH | `/api/claims/{id}/finance-approve` | Finance อนุมัติเคลม | Finance/Admin |
| **Admin** | GET | `/api/users` | ดูรายชื่อพนักงานทั้งหมด | Admin |
| | GET | `/api/audit-logs` | ดูประวัติการแก้ไขข้อมูล | Admin |
| **Uploads** | POST | `/api/uploads` | อัปโหลดรูปภาพใบเสร็จ | ทุกคน |

---

## 🔐 ข้อมูลบัญชีทดสอบ
| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Driver | `driver01` | `driver123` |
| Manager | `manager01` | `manager123` |
| Finance | `finance01` | `finance123` |
