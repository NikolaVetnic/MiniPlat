using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiniPlat.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSubjectReferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "LecturerId",
                table: "Subjects",
                newName: "Lecturer");

            migrationBuilder.RenameColumn(
                name: "AssistantId",
                table: "Subjects",
                newName: "Assistant");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Lecturer",
                table: "Subjects",
                newName: "LecturerId");

            migrationBuilder.RenameColumn(
                name: "Assistant",
                table: "Subjects",
                newName: "AssistantId");
        }
    }
}
