using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShippingAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Email", "PasswordHash" },
                values: new object[] { "", "$2a$11$SN60KAx0dUuL1wxsyTljS.IjRHhXDByb0cPLzoRIC47XYvu691Yje" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Email", "PasswordHash" },
                values: new object[] { "", "$2a$11$La0Tjlw42KeKvDGYl1umA.gsxbqtLpizxaeDkCAU4xUshG5EuzxXS" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Email", "PasswordHash" },
                values: new object[] { "", "$2a$11$CH786wZVocM.egjNuPy2WuqM0LAFAzF7CmleHHP41AGMJQtjm214i" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Email", "PasswordHash" },
                values: new object[] { "", "$2a$11$XEEm5Ao129.uoS5lJeVPI.0YbKAh7irvREPHhsRLpbNfb60m7P/ry" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Email",
                table: "Users");

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
    }
}
