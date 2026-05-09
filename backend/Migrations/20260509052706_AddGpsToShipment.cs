using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShippingAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddGpsToShipment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "DestinationLat",
                table: "Shipments",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "DestinationLng",
                table: "Shipments",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "OriginLat",
                table: "Shipments",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "OriginLng",
                table: "Shipments",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "RouteDistanceKm",
                table: "Shipments",
                type: "double precision",
                nullable: true);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DestinationLat",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "DestinationLng",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "OriginLat",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "OriginLng",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "RouteDistanceKm",
                table: "Shipments");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$n7Y4BXsFiweeCf8BhkOBTekZ9cnWVCdPukqJ8Iz9dIAV1iuahKr4G");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$KnbGH5mnwOR0t0uGbzhwE.D3SG35oHCk8nSN/p5Mocg/kXpBc4..a");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$c5Tl/k/b8bb2.tj7.uodr./4JFz6xpRl2prKqn941YDFM63TG6yMm");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$bPJO2itLUf7eRyHKjYvgJOE9xFyxlHQuuywsOJtGOPKg43Jr/F0I2");
        }
    }
}
