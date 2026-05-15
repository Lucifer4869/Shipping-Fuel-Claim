using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShippingAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddFileHashToUploadedFiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContentHash",
                table: "UploadedFiles",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$jwUjE.WDzlQebIyzkpA/MOTIVsi4I9RKqqFNHkxVRnwUyeLflrBWC");

            migrationBuilder.CreateIndex(
                name: "IX_UploadedFiles_ContentHash",
                table: "UploadedFiles",
                column: "ContentHash");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UploadedFiles_ContentHash",
                table: "UploadedFiles");

            migrationBuilder.DropColumn(
                name: "ContentHash",
                table: "UploadedFiles");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$feN6jf1obWosujLEekW/1.EamaTuCWdcq2jsAk0ChZPe/UBxrMDqO");
        }
    }
}
