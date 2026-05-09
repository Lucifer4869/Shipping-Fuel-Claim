# 🚛 Shipping Management System

ระบบจัดการการขนส่งและเบิกจ่ายค่าน้ำมัน พัฒนาด้วย **.NET 8 Web API** (Backend) และ **React + Vite + Tailwind CSS** (Frontend) พร้อมระบบตรวจสอบประวัติ (Audit Log) และการรองรับ Docker

---

## 📋 สารบัญ
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [การติดตั้งแบบทั่วไป](#การติดตั้งแบบทั่วไป)
- [การติดตั้งด้วย Docker (แนะนำ)](#การติดตั้งด้วย-docker-แนะนำ)
- [บัญชีทดสอบ](#บัญชีทดสอบ)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [ฟีเจอร์สำคัญ](#ฟีเจอร์สำคัญ)

---

## 📁 โครงสร้างโปรเจกต์

```
test/
├── backend/              # .NET 8 Web API
│   ├── Controllers/      # Auth, Shipments, Withdrawals, FuelClaims, Users, AuditLogs, Uploads
│   ├── Data/             # AppDbContext (EF Core + PostgreSQL)
│   ├── Models/           # Entity Models (Shipment, Withdrawal, FuelClaim, AuditLog, User)
│   ├── Services/         # AuditService (สำหรับบันทึกประวัติการแก้ไขข้อมูล)
│   └── wwwroot/uploads/  # เก็บไฟล์รูปใบเสร็จที่อัปโหลด
│
├── frontend/             # React + Vite + Tailwind CSS
│   └── src/
│       ├── contexts/     # AuthContext (Role-based Authorization)
│       ├── lib/          # API Service (Axios)
│       └── pages/        # Dashboard (Driver/Manager/Finance/Admin), FuelClaims, Withdrawals
│
├── docker-compose.yml    # จัดการ Database, API, และ Web พร้อมกัน
└── .env                  # ค่าคอนฟิกสำหรับ Docker และระบบ
```

---

## 🚀 การติดตั้งแบบทั่วไป

### 1. Backend (.NET 8)
**ข้อกำหนด:** .NET 8 SDK, PostgreSQL
1. เข้าไปที่โฟลเดอร์ `backend`
2. แก้ไข `appsettings.json` หรือใช้ Environment Variables เพื่อตั้งค่า PostgreSQL Connection
3. รันคำสั่ง:
   ```bash
   dotnet ef database update
   dotnet run --urls "http://localhost:5000"
   ```
📌 Swagger UI: `http://localhost:5000/swagger`

### 2. Frontend (React)
**ข้อกำหนด:** Node.js 18+
1. เข้าไปที่โฟลเดอร์ `frontend`
2. รันคำสั่ง:
   ```bash
   npm install
   npm run dev
   ```
📌 React App: `http://localhost:5173`

---

## 🐳 การติดตั้งด้วย Docker (แนะนำ)

**ข้อกำหนด:** Docker Desktop
1. ตรวจสอบไฟล์ `.env` ในโฟลเดอร์ Root ให้ถูกต้อง
2. รันคำสั่งเดียวเพื่อเริ่มระบบทั้งหมด (DB + API + Web):
   ```bash
   docker-compose up --build -d
   ```
*   **Web Interface:** `http://localhost:5173`
*   **API Server:** `http://localhost:5000`
*   **Database:** `localhost:5432`

---

## 👤 บัญชีทดสอบ

| Role | Username | Password | สิทธิ์หลัก |
|------|----------|----------|--------|
| **Admin** | `admin` | `admin123` | จัดการผู้ใช้, ดู Audit Log, **ลบรายการ** |
| **Driver** | `driver01` | `driver123` | สร้างการเดินรถ, ขอเบิกเงิน, เคลมน้ำมัน + อัปโหลดบิล |
| **Manager** | `manager01` | `manager123` | อนุมัติขั้นต้น (Level 1) |
| **Finance** | `finance01` | `finance123` | ยืนยันการจ่ายเงิน (Level 2) |

---

## 📡 API Endpoints (ตัวอย่างสำคัญ)

| Method | Endpoint | Role | คำอธิบาย |
|--------|----------|------|----------|
| POST | `/api/auth/login` | ทุก Role | รับ JWT Token |
| PATCH | `/api/withdrawals/{id}/finance-approve` | Finance | อนุมัติการเบิกขั้นสุดท้าย |
| POST | `/api/uploads` | Driver | อัปโหลดรูปใบเสร็จ |
| DELETE | `/api/claims/{id}` | Admin | ลบรายการเคลมน้ำมัน |
| GET | `/api/audit-logs` | Admin | ดูประวัติการแก้ไขข้อมูลทั้งหมด |

---

## ✨ ฟีเจอร์สำคัญ

*   **Role-Based Dashboard:** หน้าจอ Dashboard แยกตามบทบาทของผู้ใช้ (Driver, Manager, Finance, Admin)
*   **Fuel Claim with Receipt:** รองรับการอัปโหลดรูปภาพใบเสร็จค่าน้ำมันและจัดเก็บลง Server
*   **Audit Logging:** บันทึกทุกการเปลี่ยนแปลงข้อมูล (ใคร แก้ไขอะไร เมื่อไหร่ ค่าเก่าคืออะไร) เพื่อความโปร่งใส
*   **Double Approval:** ระบบอนุมัติ 2 ขั้นตอน (Manager -> Finance) สำหรับการเบิกจ่ายเงิน
*   **Admin Control:** ผู้ดูแลระบบสามารถลบรายการเดินรถหรือรายการเบิกจ่ายที่ผิดพลาดได้

---

## 🛠️ เทคโนโลยีที่ใช้

**Backend:** .NET 8, EF Core, PostgreSQL, JWT, BCrypt, AutoAudit
**Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Axios, React Hot Toast
**Infrastructure:** Docker, Docker Compose, Nginx
