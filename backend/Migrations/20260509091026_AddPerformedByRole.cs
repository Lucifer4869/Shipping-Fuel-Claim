using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShippingAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformedByRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$CJUUvvrsqtr5Z0Mwxy5YsOp10YI3bjo5CVvfyOE2.uivg8Gi4aPNm");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$23RrfKdGgoBgB3qjb23nGe1ck3otLLpGNK7FvvCYJqoD7QI25uOiq");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$0GO9RPrfxPAxni2Ugk3kJ.t2g8IYJUJ0gn2isfSbzcSZNNGuGf3Yu");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$UopyXJFb1GzX3bgGiBiX/uElVRn2j.JFP8Dggx5DQwD73M0v2vK6i");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
        }
    }
}
