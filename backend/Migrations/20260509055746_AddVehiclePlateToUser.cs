using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShippingAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddVehiclePlateToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "VehiclePlate",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "PasswordHash", "VehiclePlate" },
                values: new object[] { "$2a$11$pV6RZvMfJOMKadYBCPZRheWMd58QC2PnWYBQfH1pnW9mpIhJ37CDq", "" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "PasswordHash", "VehiclePlate" },
                values: new object[] { "$2a$11$F6R6p8JF8kYyjwjkIm6pH.bencrbZthPUbN9rrEO8pQUxX26bNct2", "" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "PasswordHash", "VehiclePlate" },
                values: new object[] { "$2a$11$zs8X5PzDBrkWr9CmX9bRi.iigJ2KUfDS2O1LGgvGhKo3eTcSXGwgq", "" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "PasswordHash", "VehiclePlate" },
                values: new object[] { "$2a$11$pytD5Al/lBnBhhxy/qWjXets8SvljWhd86.KDAKpj1WAhXAV5dWe2", "" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VehiclePlate",
                table: "Users");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$D/OBftFZMKjrQlsfASPQvefVQVg9nHqrbLBys3HmWQEXfqRDcH5g.");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$Mo4m1yiwGX.lNX21g8AfGuSxp33F580RAj0HIMJL7kJbHs201p37q");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$XGcJ4Tjz4QkeeBJrVQxEgelYC6F3S9aFUMjchaW44JsykFq/yeyeG");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$WQ4UJMXM7BKbnckssH5G6ucPkJKVh4RztfqkEYtCfX3N67VuIAOIe");
        }
    }
}
