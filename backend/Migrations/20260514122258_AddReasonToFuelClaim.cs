using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShippingAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddReasonToFuelClaim : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Reason",
                table: "FuelClaims",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$21L40EKY5Fg3gXmhhQH38O44zHfCd8qb.u4qOv4kkaP4SKu80376O");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$M35.9vMBtzp5f071g27wnO5kHDOvKTI36498WDXma/7kU1MFNywwO");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$86KLBmFcOhuKn0.r4ZmUFe2iRgBNHXH5B.Sfs0W20QSR4HKP1bq.K");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$HQE9frL/ZeYfOg0cGKuJHuSyFJKx6/JaQKIZeX6jtIlx06alBmYei");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Reason",
                table: "FuelClaims");

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
    }
}
