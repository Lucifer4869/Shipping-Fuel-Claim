using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShippingAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "FullName", "PasswordHash", "Username" },
                values: new object[] { new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Master System Administrator", "$2a$11$feN6jf1obWosujLEekW/1.EamaTuCWdcq2jsAk0ChZPe/UBxrMDqO", "master_admin" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "FullName", "PasswordHash", "Username" },
                values: new object[] { new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System Admin", "$2a$11$21L40EKY5Fg3gXmhhQH38O44zHfCd8qb.u4qOv4kkaP4SKu80376O", "admin" });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "FullName", "IsActive", "PasswordHash", "Role", "Username", "VehiclePlate" },
                values: new object[,]
                {
                    { 2, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "", "สมชาย ใจดี", true, "$2a$11$M35.9vMBtzp5f071g27wnO5kHDOvKTI36498WDXma/7kU1MFNywwO", 0, "driver01", "" },
                    { 3, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "", "นายวิชัย รักงาน", true, "$2a$11$86KLBmFcOhuKn0.r4ZmUFe2iRgBNHXH5B.Sfs0W20QSR4HKP1bq.K", 1, "manager01", "" },
                    { 4, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "", "นางสาวมาลี บัญชีดี", true, "$2a$11$HQE9frL/ZeYfOg0cGKuJHuSyFJKx6/JaQKIZeX6jtIlx06alBmYei", 2, "finance01", "" }
                });
        }
    }
}
