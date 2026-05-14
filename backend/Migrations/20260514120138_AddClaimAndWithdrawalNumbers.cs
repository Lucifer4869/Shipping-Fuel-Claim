using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShippingAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddClaimAndWithdrawalNumbers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "WithdrawalNumber",
                table: "Withdrawals",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ClaimNumber",
                table: "FuelClaims",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$dCK4wYr9YMWL.kUrnJuIM.uN6uuJq0AsZ09yrV.D0yGdxfOi3bjkK");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$xv4XN/acj7B/HCNu27rk2e/KW.gMR2B/oLFIwkfdqtr0egsAFb7oK");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$8cte9gIhcihqAbPk0XmNc.M7/G0LnPUqc0yOoQ0N3tqlnQjqUFkSO");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$5GcbMRQ3kl4JWH5eSvUlDuxkBWHJSxMn1BeJUOGhQQvhYL2bra4Xm");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WithdrawalNumber",
                table: "Withdrawals");

            migrationBuilder.DropColumn(
                name: "ClaimNumber",
                table: "FuelClaims");

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
    }
}
