using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShippingAPI.Migrations
{
    /// <inheritdoc />
    public partial class FixMissingAuditLogColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PerformedByRole",
                table: "AuditLogs",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$oB9.Nkzm0TeLV7/XJMrjJez171.HT0j4VALu/iQ2vW1h3SrLL95b6");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$IUHhG9knJAspkVefizdBtOq7jpLlvAuAQLtnTc6iC2Ky4Zt9r2jvC");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$yV0Zh3czIFTzcTlnBJqDLuRgvhVq.Az0L8Lq8bInekLmFI09eg11C");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$6R2b8oXj5HEq2S4yiJ7qlu.FK3K.TZrbaDZ1a6Fb6BO.bBfT3YRSi");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PerformedByRole",
                table: "AuditLogs");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$Oz4IAGHc1Yldi7ENkZb5NeRaYliZI71AInFb8VJDo.neOttdTYQ.a");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$hjV0k8q7fZd4urQ..hmzReqH2MYfHbf58vf3BH415Q/csXa5DU.NO");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$NzYI6CvwyKGqlDpi9xOZ9.sP8fLcQYn6OkwVRrfOZ5mfpuY9KfVM6");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$9f8vdBw7NChkAZBXQJyj1O67UOcqufcwOurVISMhaqjDynsh2yMui");
        }
    }
}
