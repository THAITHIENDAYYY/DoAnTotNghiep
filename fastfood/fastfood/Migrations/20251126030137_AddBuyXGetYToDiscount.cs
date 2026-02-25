using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fastfood.Migrations
{
    /// <inheritdoc />
    public partial class AddBuyXGetYToDiscount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BuyQuantity",
                table: "Discounts",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FreeProductId",
                table: "Discounts",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FreeProductQuantity",
                table: "Discounts",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Discounts_FreeProductId",
                table: "Discounts",
                column: "FreeProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_Discounts_Products_FreeProductId",
                table: "Discounts",
                column: "FreeProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Discounts_Products_FreeProductId",
                table: "Discounts");

            migrationBuilder.DropIndex(
                name: "IX_Discounts_FreeProductId",
                table: "Discounts");

            migrationBuilder.DropColumn(
                name: "BuyQuantity",
                table: "Discounts");

            migrationBuilder.DropColumn(
                name: "FreeProductId",
                table: "Discounts");

            migrationBuilder.DropColumn(
                name: "FreeProductQuantity",
                table: "Discounts");
        }
    }
}
