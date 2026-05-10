namespace ShippingAPI.Models;

public enum UserRole //ประเภทของ user
{
    Driver = 0, //คนขับ
    Manager = 1, //ผู้จัดการ
    Finance = 2, //การเงิน
    Admin = 3    //ผู้ดูแลระบบ
}

public enum ShipmentStatus //สถานะของการเดินรถ
{
    Active = 0, //ทำงานอยู่
    Completed = 1, //เสร็จสิ้น
    Cancelled = 2  //ยกเลิก
}

public enum WithdrawalStatus //สถานะของการเบิกเงิน
{
    Pending = 0, //รอการอนุมัติ
    ApprovedByManager = 1, //อนุมัติโดยผู้จัดการ
    ApprovedByFinance = 2, //อนุมัติโดยการเงิน
    Rejected = 3 //ไม่ผ่านการอนุมัติ
}

public enum FuelClaimStatus //สถานะของการเติมน้ำมัน
{
    Pending = 0, //รอการอนุมัติ
    ApprovedByManager = 1, //อนุมัติโดยผู้จัดการ
    ApprovedByFinance = 2, //อนุมัติโดยการเงิน
    Rejected = 3 //ไม่ผ่านการอนุมัติ
}
