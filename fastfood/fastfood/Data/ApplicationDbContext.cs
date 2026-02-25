using fastfood.Shared.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace fastfood.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // DbSets for FastFood Management System
        public DbSet<Category> Categories { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Ingredient> Ingredients { get; set; }
        public DbSet<ProductIngredient> ProductIngredients { get; set; }
        public DbSet<Table> Tables { get; set; }
        public DbSet<TableArea> TableAreas { get; set; }
        public DbSet<TableGroup> TableGroups { get; set; }
        public DbSet<TableGroupTable> TableGroupTables { get; set; }
        public DbSet<CustomerTier> CustomerTiers { get; set; }
        public DbSet<WorkShift> WorkShifts { get; set; }
        public DbSet<Discount> Discounts { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure relationships and constraints
            
            // Category -> Products (One-to-Many)
            builder.Entity<Product>()
                .HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // Customer -> Orders (One-to-Many)
            builder.Entity<Order>()
                .HasOne(o => o.Customer)
                .WithMany(c => c.Orders)
                .HasForeignKey(o => o.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Employee -> Orders (One-to-Many)
            builder.Entity<Order>()
                .HasOne(o => o.Employee)
                .WithMany(e => e.Orders)
                .HasForeignKey(o => o.EmployeeId)
                .OnDelete(DeleteBehavior.SetNull);

            // Table -> Orders (One-to-Many)
            builder.Entity<Order>()
                .HasOne(o => o.Table)
                .WithMany(t => t.Orders)
                .HasForeignKey(o => o.TableId)
                .OnDelete(DeleteBehavior.SetNull);

            // TableGroup -> Orders (One-to-Many)
            builder.Entity<Order>()
                .HasOne(o => o.TableGroup)
                .WithMany(tg => tg.Orders)
                .HasForeignKey(o => o.TableGroupId)
                .OnDelete(DeleteBehavior.SetNull);

            // TableGroup -> TableGroupTables (One-to-Many)
            builder.Entity<TableGroupTable>()
                .HasOne(tgt => tgt.TableGroup)
                .WithMany(tg => tg.TableGroupTables)
                .HasForeignKey(tgt => tgt.TableGroupId)
                .OnDelete(DeleteBehavior.Cascade);

            // Table -> TableGroupTables (One-to-Many)
            builder.Entity<TableGroupTable>()
                .HasOne(tgt => tgt.Table)
                .WithMany()
                .HasForeignKey(tgt => tgt.TableId)
                .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint: Một bàn chỉ có thể thuộc một TableGroup đang active
            builder.Entity<TableGroupTable>()
                .HasIndex(tgt => new { tgt.TableId, tgt.TableGroupId })
                .IsUnique();

            // Order -> OrderItems (One-to-Many)
            builder.Entity<OrderItem>()
                .HasOne(oi => oi.Order)
                .WithMany(o => o.OrderItems)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            // Product -> OrderItems (One-to-Many)
            builder.Entity<OrderItem>()
                .HasOne(oi => oi.Product)
                .WithMany(p => p.OrderItems)
                .HasForeignKey(oi => oi.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            // Order -> Payments (One-to-Many)
            builder.Entity<Payment>()
                .HasOne(p => p.Order)
                .WithMany(o => o.Payments)
                .HasForeignKey(p => p.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            // Customer -> ApplicationUser (One-to-One)
            builder.Entity<Customer>()
                .HasOne(c => c.User)
                .WithOne()
                .HasForeignKey<Customer>(c => c.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            // Employee -> ApplicationUser (One-to-One)
            builder.Entity<Employee>()
                .HasOne(e => e.User)
                .WithOne()
                .HasForeignKey<Employee>(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            // Configure indexes for better performance
            builder.Entity<Product>()
                .HasIndex(p => p.SKU)
                .IsUnique()
                .HasFilter("[SKU] IS NOT NULL");

            builder.Entity<Order>()
                .HasIndex(o => o.OrderNumber)
                .IsUnique();

            builder.Entity<Payment>()
                .HasIndex(p => p.TransactionId)
                .IsUnique();

            builder.Entity<Table>()
                .HasIndex(t => t.TableNumber)
                .IsUnique();

            // TableArea -> Tables (One-to-Many)
            builder.Entity<Table>()
                .HasOne(t => t.TableArea)
                .WithMany(ta => ta.Tables)
                .HasForeignKey(t => t.TableAreaId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<TableArea>()
                .HasIndex(ta => ta.Name)
                .IsUnique();

            // Configure decimal precision
            builder.Entity<Product>()
                .Property(p => p.Price)
                .HasPrecision(18, 2);

            builder.Entity<Order>()
                .Property(o => o.SubTotal)
                .HasPrecision(18, 2);

            builder.Entity<Order>()
                .Property(o => o.TaxAmount)
                .HasPrecision(18, 2);

            builder.Entity<Order>()
                .Property(o => o.DeliveryFee)
                .HasPrecision(18, 2);

            builder.Entity<Order>()
                .Property(o => o.TotalAmount)
                .HasPrecision(18, 2);

            builder.Entity<OrderItem>()
                .Property(oi => oi.UnitPrice)
                .HasPrecision(18, 2);

            builder.Entity<OrderItem>()
                .Property(oi => oi.TotalPrice)
                .HasPrecision(18, 2);

            builder.Entity<Payment>()
                .Property(p => p.Amount)
                .HasPrecision(18, 2);

            builder.Entity<Employee>()
                .Property(e => e.Salary)
                .HasPrecision(18, 2);

            // Ingredient decimal precision
            builder.Entity<Ingredient>()
                .Property(i => i.Quantity)
                .HasPrecision(18, 2);

            builder.Entity<Ingredient>()
                .Property(i => i.MinQuantity)
                .HasPrecision(18, 2);

            builder.Entity<Ingredient>()
                .Property(i => i.PricePerUnit)
                .HasPrecision(18, 2);

            // Product -> ProductIngredients (One-to-Many)
            builder.Entity<ProductIngredient>()
                .HasOne(pi => pi.Product)
                .WithMany(p => p.ProductIngredients)
                .HasForeignKey(pi => pi.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // Ingredient -> ProductIngredients (One-to-Many)
            builder.Entity<ProductIngredient>()
                .HasOne(pi => pi.Ingredient)
                .WithMany(i => i.ProductIngredients)
                .HasForeignKey(pi => pi.IngredientId)
                .OnDelete(DeleteBehavior.Restrict);

            // ProductIngredient decimal precision
            builder.Entity<ProductIngredient>()
                .Property(pi => pi.QuantityRequired)
                .HasPrecision(18, 2);

            builder.Entity<CustomerTier>()
                .Property(ct => ct.MinimumSpent)
                .HasPrecision(18, 2);

            builder.Entity<CustomerTier>()
                .HasIndex(ct => ct.Name)
                .IsUnique();

            // Employee -> WorkShifts (One-to-Many)
            builder.Entity<WorkShift>()
                .HasOne(ws => ws.Employee)
                .WithMany()
                .HasForeignKey(ws => ws.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            // WorkShift index
            builder.Entity<WorkShift>()
                .HasIndex(ws => new { ws.EmployeeId, ws.StartAt });

            // Discount configuration
            builder.Entity<Discount>()
                .HasIndex(d => d.Code)
                .IsUnique();

            builder.Entity<Discount>()
                .Property(d => d.DiscountValue)
                .HasPrecision(18, 2);

            builder.Entity<Discount>()
                .Property(d => d.MinOrderAmount)
                .HasPrecision(18, 2);

            builder.Entity<Discount>()
                .Property(d => d.MaxDiscountAmount)
                .HasPrecision(18, 2);

            // Discount -> Orders (One-to-Many)
            builder.Entity<Order>()
                .HasOne(o => o.Discount)
                .WithMany(d => d.Orders)
                .HasForeignKey(o => o.DiscountId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Entity<Order>()
                .Property(o => o.DiscountAmount)
                .HasPrecision(18, 2);

            // Discount -> Products (Many-to-Many)
            builder.Entity<Discount>()
                .HasMany(d => d.ApplicableProducts)
                .WithMany()
                .UsingEntity(j => j.ToTable("DiscountProducts"));

            // Discount -> Categories (Many-to-Many)
            builder.Entity<Discount>()
                .HasMany(d => d.ApplicableCategories)
                .WithMany()
                .UsingEntity(j => j.ToTable("DiscountCategories"));

            // Discount -> CustomerTiers (Many-to-Many)
            builder.Entity<Discount>()
                .HasMany(d => d.ApplicableCustomerTiers)
                .WithMany()
                .UsingEntity(j => j.ToTable("DiscountCustomerTiers"));

            // Discount -> FreeProduct (Many-to-One) - Cho BuyXGetY
            builder.Entity<Discount>()
                .HasOne(d => d.FreeProduct)
                .WithMany()
                .HasForeignKey(d => d.FreeProductId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
