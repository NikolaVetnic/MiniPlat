using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiniPlat.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateConnection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TopicIds",
                table: "Subjects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Subjects",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TopicIds",
                table: "Subjects");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Subjects");
        }
    }
}
