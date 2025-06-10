using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiniPlat.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSubject : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Assistant",
                table: "Subjects");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "Subjects",
                newName: "LecturerId");

            migrationBuilder.RenameColumn(
                name: "Lecturer",
                table: "Subjects",
                newName: "AssistantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "LecturerId",
                table: "Subjects",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "AssistantId",
                table: "Subjects",
                newName: "Lecturer");

            migrationBuilder.AddColumn<string>(
                name: "Assistant",
                table: "Subjects",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
