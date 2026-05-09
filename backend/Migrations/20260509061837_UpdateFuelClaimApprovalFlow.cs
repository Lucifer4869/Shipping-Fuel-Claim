using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShippingAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateFuelClaimApprovalFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FuelClaims_Users_ApprovedById",
                table: "FuelClaims");

            migrationBuilder.RenameColumn(
                name: "ApproverNote",
                table: "FuelClaims",
                newName: "ManagerNote");

            migrationBuilder.RenameColumn(
                name: "ApprovedById",
                table: "FuelClaims",
                newName: "ManagerId");

            migrationBuilder.RenameColumn(
                name: "ApprovedAt",
                table: "FuelClaims",
                newName: "ManagerApprovedAt");

            migrationBuilder.RenameIndex(
                name: "IX_FuelClaims_ApprovedById",
                table: "FuelClaims",
                newName: "IX_FuelClaims_ManagerId");

            migrationBuilder.AddColumn<DateTime>(
                name: "FinanceApprovedAt",
                table: "FuelClaims",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FinanceId",
                table: "FuelClaims",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FinanceNote",
                table: "FuelClaims",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$RZKOdUiUSmJc0kVNvGng5uq1ZwX0ph6TEdKoLQgumN3.k1fGdkSsC");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$yXEgbRR1epy0cQ0JZ1fvdumcCQins46gwwojf/PC3tqMUdh16ppyO");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$VTTyVc292VmUZopXGSDFvulWenQW4xUwlcQZc0L0zdU.MX0I7yZ2a");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$PpMGrUF9CtsidBqe8FCHheYXcQ//8PS56jKmtV/rWFbaUEEH2D5EW");

            migrationBuilder.CreateIndex(
                name: "IX_FuelClaims_FinanceId",
                table: "FuelClaims",
                column: "FinanceId");

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FuelClaims_Users_FinanceId",
                table: "FuelClaims");

            migrationBuilder.DropForeignKey(
                name: "FK_FuelClaims_Users_ManagerId",
                table: "FuelClaims");

            migrationBuilder.DropIndex(
                name: "IX_FuelClaims_FinanceId",
                table: "FuelClaims");

            migrationBuilder.DropColumn(
                name: "FinanceApprovedAt",
                table: "FuelClaims");

            migrationBuilder.DropColumn(
                name: "FinanceId",
                table: "FuelClaims");

            migrationBuilder.DropColumn(
                name: "FinanceNote",
                table: "FuelClaims");

            migrationBuilder.RenameColumn(
                name: "ManagerNote",
                table: "FuelClaims",
                newName: "ApproverNote");

            migrationBuilder.RenameColumn(
                name: "ManagerId",
                table: "FuelClaims",
                newName: "ApprovedById");

            migrationBuilder.RenameColumn(
                name: "ManagerApprovedAt",
                table: "FuelClaims",
                newName: "ApprovedAt");

            migrationBuilder.RenameIndex(
                name: "IX_FuelClaims_ManagerId",
                table: "FuelClaims",
                newName: "IX_FuelClaims_ApprovedById");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$pV6RZvMfJOMKadYBCPZRheWMd58QC2PnWYBQfH1pnW9mpIhJ37CDq");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$F6R6p8JF8kYyjwjkIm6pH.bencrbZthPUbN9rrEO8pQUxX26bNct2");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$zs8X5PzDBrkWr9CmX9bRi.iigJ2KUfDS2O1LGgvGhKo3eTcSXGwgq");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$pytD5Al/lBnBhhxy/qWjXets8SvljWhd86.KDAKpj1WAhXAV5dWe2");

            migrationBuilder.AddForeignKey(
                name: "FK_FuelClaims_Users_ApprovedById",
                table: "FuelClaims",
                column: "ApprovedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
