using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShippingAPI.Migrations
{
    /// <inheritdoc />
    public partial class EnableUserCascadeDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AuditLogs_Users_PerformedById",
                table: "AuditLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_FuelClaims_Users_FinanceId",
                table: "FuelClaims");

            migrationBuilder.DropForeignKey(
                name: "FK_FuelClaims_Users_ManagerId",
                table: "FuelClaims");

            migrationBuilder.DropForeignKey(
                name: "FK_Shipments_Users_DriverId",
                table: "Shipments");

            migrationBuilder.DropForeignKey(
                name: "FK_Withdrawals_Users_FinanceId",
                table: "Withdrawals");

            migrationBuilder.DropForeignKey(
                name: "FK_Withdrawals_Users_ManagerId",
                table: "Withdrawals");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$tejJGxZjM/g/GlaGeZYzvuR1nuDhIVUkvDqB0QQ/772w.wNKEe30y");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$yXXbMLCHTYeWTAZN00FVJu9b0Kud0n5gcBhhmxGbTmsHvFYsvos.q");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$WaCMf4NO6bvaf7uflGolSe80J0Pafjol2LfqKei7ZF7zEksUqL1Pm");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$LkvQn15p2i0PLUk.x9llzOM/kJTcqH1bkaE8GlVXGtOKp1I5aS56m");

            migrationBuilder.AddForeignKey(
                name: "FK_AuditLogs_Users_PerformedById",
                table: "AuditLogs",
                column: "PerformedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_FuelClaims_Users_FinanceId",
                table: "FuelClaims",
                column: "FinanceId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_FuelClaims_Users_ManagerId",
                table: "FuelClaims",
                column: "ManagerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Shipments_Users_DriverId",
                table: "Shipments",
                column: "DriverId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Withdrawals_Users_FinanceId",
                table: "Withdrawals",
                column: "FinanceId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Withdrawals_Users_ManagerId",
                table: "Withdrawals",
                column: "ManagerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AuditLogs_Users_PerformedById",
                table: "AuditLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_FuelClaims_Users_FinanceId",
                table: "FuelClaims");

            migrationBuilder.DropForeignKey(
                name: "FK_FuelClaims_Users_ManagerId",
                table: "FuelClaims");

            migrationBuilder.DropForeignKey(
                name: "FK_Shipments_Users_DriverId",
                table: "Shipments");

            migrationBuilder.DropForeignKey(
                name: "FK_Withdrawals_Users_FinanceId",
                table: "Withdrawals");

            migrationBuilder.DropForeignKey(
                name: "FK_Withdrawals_Users_ManagerId",
                table: "Withdrawals");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$SN60KAx0dUuL1wxsyTljS.IjRHhXDByb0cPLzoRIC47XYvu691Yje");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$La0Tjlw42KeKvDGYl1umA.gsxbqtLpizxaeDkCAU4xUshG5EuzxXS");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$CH786wZVocM.egjNuPy2WuqM0LAFAzF7CmleHHP41AGMJQtjm214i");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$XEEm5Ao129.uoS5lJeVPI.0YbKAh7irvREPHhsRLpbNfb60m7P/ry");

            migrationBuilder.AddForeignKey(
                name: "FK_AuditLogs_Users_PerformedById",
                table: "AuditLogs",
                column: "PerformedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_FuelClaims_Users_FinanceId",
                table: "FuelClaims",
                column: "FinanceId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_FuelClaims_Users_ManagerId",
                table: "FuelClaims",
                column: "ManagerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Shipments_Users_DriverId",
                table: "Shipments",
                column: "DriverId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Withdrawals_Users_FinanceId",
                table: "Withdrawals",
                column: "FinanceId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Withdrawals_Users_ManagerId",
                table: "Withdrawals",
                column: "ManagerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
