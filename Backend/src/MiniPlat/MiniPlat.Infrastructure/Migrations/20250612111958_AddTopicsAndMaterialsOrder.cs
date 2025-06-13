using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiniPlat.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTopicsAndMaterialsOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Order",
                table: "Topics",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Order",
                table: "Materials",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Order",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "Order",
                table: "Materials");
        }
    }
}
