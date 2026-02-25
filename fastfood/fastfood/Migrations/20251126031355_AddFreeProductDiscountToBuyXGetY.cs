using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fastfood.Migrations
{
    /// <inheritdoc />
    public partial class AddFreeProductDiscountToBuyXGetY : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FreeProductDiscountType",
                table: "Discounts",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FreeProductDiscountValue",
                table: "Discounts",
                type: "decimal(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FreeProductDiscountType",
                table: "Discounts");

            migrationBuilder.DropColumn(
                name: "FreeProductDiscountValue",
                table: "Discounts");
        }
    }
}
