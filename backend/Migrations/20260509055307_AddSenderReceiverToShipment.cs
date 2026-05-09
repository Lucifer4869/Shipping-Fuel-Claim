using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShippingAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddSenderReceiverToShipment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReceiverName",
                table: "Shipments",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ReceiverPhone",
                table: "Shipments",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SenderName",
                table: "Shipments",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SenderPhone",
                table: "Shipments",
                type: "text",
                nullable: false,
                defaultValue: "");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReceiverName",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "ReceiverPhone",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "SenderName",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "SenderPhone",
                table: "Shipments");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$FZ.5kk0s0b8qbD5BczXnRuSkSkD6J4sq8I7yu5YXHThXQTK.e0xKq");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$QVrBnREC.hE8zJzBAoPnEOHTlFP1D8L1uBwbGaFIx1Hv1i7erEwRG");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$E.4RmTOpKGhUdnLQnaRV.eBLriXeanlpiDnp7UykVXeKoZtJA9eS6");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$MN0uBYg1xM01YRrbRvID5eoHVUZ/diksow1viHhGmLRqWymzLmJie");
        }
    }
}
