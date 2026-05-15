# Patch Notes - Fuel Claim & Withdrawal Workflow Hardening

## 🚀 1. แก้อะไรไปบ้าง (What Changed)
1. **เพิ่มฟิลด์ `Reason` ในเคลมน้ำมัน:** เพิ่มช่องเหตุผลสำหรับการเคลมน้ำมันทั้งในฐานข้อมูล (Backend Model) และหน้าจอ (Frontend) เพื่อความชัดเจนในการขออนุมัติ
2. **ระบบบังคับลำดับการอนุมัติ (Strict Approval Workflow):** 
   - บังคับให้ **Manager** ต้องอนุมัติก่อนเสมอ ถึงจะส่งต่อให้ **Finance** ได้
   - หาก Manager ยังไม่อนุมัติ ปุ่มของ Finance จะไม่แสดงขึ้นมา และ API หลังบ้านจะบล็อกการยิง Request ที่ข้ามขั้นตอน (400 Bad Request)
3. **ปรับปรุงรูปแบบ ID ให้มนุษย์อ่านง่าย (Custom ID Format):** เปลี่ยนจากเลข ID (เช่น 1, 2) เป็นรูปแบบ `FLC-YYYYMMDD-XXXX` (เคลมน้ำมัน) และ `WTH-YYYYMMDD-XXXX` (เบิกเงิน) เพื่อให้ง่ายต่อการอ้างอิงและตรวจสอบใน Audit Logs
4. **แก้ไขหน้าตารายงาน (Reports UI):** 
   - แตกรายการในตารางรายละเอียดเป็นราย Transaction พร้อมระบุ "เหตุผล" อย่างชัดเจนแทนการใช้คำเหมารวม
   - ปรับล็อกความกว้าง (Fixed Width) ของคอลัมน์ตารางรายละเอียดให้เท่ากันเป๊ะ เพื่อความสวยงามเมื่อพิมพ์
5. **เพิ่ม Frontend Validation:** ดักจับข้อผิดพลาดก่อนส่งเข้าเซิร์ฟเวอร์
   - ตรวจสอบความครบถ้วนของข้อมูล
   - ห้ามจำนวนเงินติดลบ หรือเป็น 0
   - ห้ามเลขไมล์ขากลับน้อยกว่าเลขไมล์ขาไป
   - จำกัดไฟล์ใบเสร็จไม่เกิน 5MB และอนุญาตเฉพาะไฟล์นามสกุล **JPG, PNG และ PDF** เท่านั้น
6. **Security Hardening (Seeded Users):** ลบข้อมูล User ทดสอบออกจาก Code (`AppDbContext.cs`) ทั้งหมด เพื่อป้องกันความเสี่ยงในการถูกเข้าถึงโดยไม่ได้รับอนุญาต และสร้างรหัสผ่าน Admin เริ่มต้นที่มีความปลอดภัยสูงขึ้นแทน

---

## ⚙️ 2. วิธีรัน Project (How to Run)
1. เปิด Terminal (Command Prompt / PowerShell)
2. นำทางไปยังโฟลเดอร์หลักของโปรเจกต์ `cd \path\to\project`
3. รันคำสั่ง Docker เพื่อ Build และ Start container ทั้งหมด:
   ```bash
   docker-compose up -d --build
   ```
4. ระบบจะประกอบไปด้วย:
   - **Frontend (React):** เข้าใช้งานได้ที่ `http://localhost:5173`
   - **Backend (API):** รันอยู่ที่ `http://localhost:5000`
   - **Database (PostgreSQL):** รันพอร์ต `5432`

---

## 🧪 3. วิธีทดสอบ Flow หลัก (How to Test Main Flow)
1. **การสร้างรายการ (Driver):** 
   - เข้าสู่ระบบด้วยบัญชีคนขับ (Driver) ไปที่เมนู "เคลมน้ำมัน" หรือ "ขอเบิกเงิน"
   - ลองจงใจกรอกข้อมูลผิด (เช่น เงินติดลบ, เลขไมล์ผิด, ไม่ใส่เหตุผล) เพื่อดูว่า Frontend ทำการแจ้งเตือนและบล็อกหรือไม่
   - กรอกข้อมูลที่ถูกต้องและกดส่ง สถานะจะเป็น **"รออนุมัติ (M)"**
2. **การป้องกันข้ามสิทธิ์ (Finance):**
   - เข้าสู่ระบบด้วยบัญชี **Finance** ไปที่รายการที่เพิ่งสร้าง
   - **สังเกต:** ปุ่มอนุมัติต้อง *ไม่ปรากฏ* ขึ้นมา
3. **การอนุมัติขั้นที่ 1 (Manager):**
   - เข้าสู่ระบบด้วยบัญชี **Manager**
   - ตรวจสอบรายการและกด **"อนุมัติ"** สถานะจะเปลี่ยนเป็น **"รอจ่ายเงิน (F)"**
4. **การอนุมัติขั้นที่ 2 (Finance):**
   - กลับมาเข้าสู่ระบบด้วยบัญชี **Finance** อีกครั้ง
   - **สังเกต:** ตอนนี้ปุ่มอนุมัติจะโผล่ขึ้นมาให้ดำเนินการจ่ายเงินขั้นสุดท้ายได้
5. **การตรวจสอบผลลัพธ์ (Admin/Manager):**
   - เปิดหน้ารายงาน (**Reports**) และดูที่ตารางรายละเอียด ตรวจสอบรหัส FLC/WTH, คอลัมน์เหตุผล, และความตรงกันของความกว้างตาราง
   - เปิดหน้า **Audit Logs** ตรวจสอบว่าระบบบันทึกรหัสอ้างอิงตรงกับรายการหรือไม่

---

## 🤔 4. Assumption ที่ใช้ (Assumptions Made)
- **Role Permissions:** สมมติฐานว่า Role ภายในระบบมีเพียง `Admin`, `Manager`, `Finance`, และ `Driver` โดย `Admin` มีสิทธิ์ครอบจักรวาลในการมองเห็นและการลบข้อมูล
- **One-way Approval:** สมมติฐานว่า Flow เป็นเส้นตรง (Driver -> Manager -> Finance) ไม่มีการตีกลับไปให้แก้ไข (ถ้าผิดคือ Rejected แล้วให้สร้างใหม่)
- **ID Reset:** สมมติฐานว่า `FLC` และ `WTH` ID ที่มีเลขต่อท้ายรายวัน (เช่น `-001`) หากมีการลบรายการระหว่างวัน ลำดับอาจจะข้ามไปบ้าง เพื่อป้องกันการซ้ำซ้อน
- **Reporting Date Range:** สมมติฐานว่ารายงานจะดึง Transaction ทั้งหมดที่มีความเคลื่อนไหว (สร้าง) ภายในช่วงวันที่เลือก โดยไม่สนใจว่าจ่ายเงินเสร็จข้ามวันหรือไม่

---

## ⚠️ 5. Risk หรือสิ่งที่ยังควรปรับปรุงต่อ (Risks & Future Improvements)
1. **Concurrency/Race Condition:** แม้จะมีการล็อกเลข Running ID รายวัน แต่อาจเกิดปัญหาซ้ำซ้อนได้หากมีคนกดส่งพร้อมกันในเสี้ยววินาที (ในอนาคตอาจต้องเพิ่ม Database Lock หรือ Sequence ใน PostgreSQL)
2. **File Storage Management:** ตอนนี้ไฟล์อัปโหลดถูกบันทึกลงใน Database (Byte Array / Memory) ในตาราง `UploadedFiles` หากไฟล์มีจำนวนมาก Database จะใหญ่ขึ้นอย่างรวดเร็ว **(ควรเปลี่ยนไปใช้การเก็บไฟล์ลง Disk, S3, หรือ Cloud Storage ตัวอื่นในอนาคต)**
3. **Notification System:** ปัจจุบัน User ต้องเข้ามาเช็คสถานะเอง หากสามารถทำระบบแจ้งเตือน (Line Notify หรือ Web Push) เมื่อถึงคิวที่ต้องอนุมัติ จะช่วยให้ Workflow ไหลลื่นขึ้น
4. **Edit Functionality:** ตอนนี้ถ้ารายการถูกปฎิเสธ (Rejected) User ต้องสร้างพิมพ์ใหม่ทั้งหมด ควรมีฟังก์ชัน Clone หรือแก้ไขรายการเดิมแล้วส่งพิจารณาใหม่

---

## ⏱️ Changelog Timeline (15 May 2026)
* **11:28 น.** - **[Security] Seed Data Cleanup:** ลบข้อมูล User ทดสอบ (Driver, Manager, Finance) ออกจาก `AppDbContext.cs` เพื่อความปลอดภัย
* **11:29 น.** - **[Security] Admin Credential Update:** เปลี่ยน Username และ Password สำหรับ Admin เป็นค่าที่ปลอดภัยยิ่งขึ้น (`master_admin`)
* **11:30 น.** - **[System] Database Reset & Documentation:** รีเซ็ต Database ใหม่และอัปเดตข้อมูลบัญชีใน `README.md` และ `PATCH_NOTES.md`

---

## ⏱️ Changelog Timeline (14 May 2026 - Detailed)

* **19:21 น.** - **[Backend] Update Model & DTOs:** แก้ไข `FuelClaim.cs` เพิ่มฟิลด์ `Reason` และอัปเดต `Dtos.cs` สำหรับการเคลมน้ำมัน
* **19:23 น.** - **[Backend] Logic Update:** แก้ไข `FuelClaimsController.cs` เพื่อรองรับการรับและส่งข้อมูล "เหตุผล" (Reason)
* **19:25 น.** - **[Frontend] Fuel Claims UI:** เพิ่มช่องกรอกเหตุผลใน `FuelClaimsPage.tsx` และอัปเดตหน้าต่างแสดงรายละเอียด `RequestDetailModal.tsx`
* **19:28 น.** - **[Audit Trail] Traceability Hardening:** แก้ไข `AuditLogsController.cs` และ `AuditLogsPage.tsx` ให้แสดงรหัสอ้างอิง `FLC/WTH` แทนเลข ID
* **19:32 น.** - **[Security] Strict Approval Enforcement:** บังคับ Logic การอนุมัติ (Manager -> Finance) ทั้งฝั่ง Backend API และการซ่อนปุ่มในหน้า Frontend
* **19:40 น.** - **[Reporting] Transactional Detail Update:** รื้อโครงสร้าง `ReportsPage.tsx` ให้แสดงข้อมูลแยกราย Transaction พร้อมเหตุผลที่ถูกต้อง
* **19:43 น.** - **[Validation] Input & File Guard:** ติดตั้งระบบตรวจสอบข้อมูล (Amount, Mileage, File Size/Type) และล็อกชนิดไฟล์ (JPG, PNG, PDF) ก่อนส่งเข้าเซิร์ฟเวอร์
* **19:46 น.** - **[System] Infrastructure:** รีสตาร์ต Docker Containers ทั้งหมดเพื่อ Refresh โค้ดล่าสุด
* **19:49 น.** - **[Design] UI Polishing:** ล็อกขนาดคอลัมน์ (Fixed Width) ในหน้ารายงานให้สมดุลและสวยงาม
* **19:52 น.** - **[Documentation] Final Delivery:** จัดทำเอกสาร PATCH_NOTES และสรุป Timeline ฉบับละเอียดลิสต์นี้ลงในไฟล์โครงการ

