using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiniPlat.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsDeletedFlag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Subjects");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Subjects");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Lecturers");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Lecturers");

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Topics",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Subjects",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Materials",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Lecturers",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Subjects");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Lecturers");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Topics",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "Topics",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Subjects",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "Subjects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Materials",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "Materials",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Lecturers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "Lecturers",
                type: "text",
                nullable: true);
        }
    }
}
