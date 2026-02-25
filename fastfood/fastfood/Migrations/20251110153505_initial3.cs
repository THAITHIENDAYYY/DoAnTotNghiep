using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fastfood.Migrations
{
    /// <inheritdoc />
    public partial class initial3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Area",
                table: "Tables",
                newName: "TableAreaId");

            migrationBuilder.CreateTable(
                name: "TableAreas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TableAreas", x => x.Id);
                });

            // SEED DATA: Tạo 6 khu vực mặc định tương ứng với enum cũ
            // Enum cũ: Indoor=1, Outdoor=2, VIP=3, FirstFloor=4, SecondFloor=5, ThirdFloor=6
            migrationBuilder.InsertData(
                table: "TableAreas",
                columns: new[] { "Id", "Name", "Description", "DisplayOrder", "IsActive", "CreatedAt" },
                values: new object[,]
                {
                    { 1, "Trong nhà", "Khu vực trong nhà", 5, true, DateTime.UtcNow },
                    { 2, "Ngoài trời", "Khu vực ngoài trời / sân vườn", 6, true, DateTime.UtcNow },
                    { 3, "VIP", "Khu vực VIP", 4, true, DateTime.UtcNow },
                    { 4, "Tầng 1", "Khu vực tầng 1", 1, true, DateTime.UtcNow },
                    { 5, "Tầng 2", "Khu vực tầng 2", 2, true, DateTime.UtcNow },
                    { 6, "Tầng 3", "Khu vực tầng 3", 3, true, DateTime.UtcNow }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tables_TableAreaId",
                table: "Tables",
                column: "TableAreaId");

            migrationBuilder.CreateIndex(
                name: "IX_TableAreas_Name",
                table: "TableAreas",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Tables_TableAreas_TableAreaId",
                table: "Tables",
                column: "TableAreaId",
                principalTable: "TableAreas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
            
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tables_TableAreas_TableAreaId",
                table: "Tables");

            migrationBuilder.DropTable(
                name: "TableAreas");

            migrationBuilder.DropIndex(
                name: "IX_Tables_TableAreaId",
                table: "Tables");

            migrationBuilder.RenameColumn(
                name: "TableAreaId",
                table: "Tables",
                newName: "Area");
        }
    }
}
