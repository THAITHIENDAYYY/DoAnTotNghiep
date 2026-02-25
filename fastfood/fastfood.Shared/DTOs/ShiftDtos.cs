using System.ComponentModel.DataAnnotations;

namespace fastfood.Shared.DTOs
{
    public class ShiftFilterDto
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? EmployeeId { get; set; }
    }

    public class ShiftSummaryDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public DateTime ShiftDate { get; set; }
        public DateTime? ShiftStart { get; set; }
        public DateTime? ShiftEnd { get; set; }

        public int OrdersCount { get; set; }
        public int ErrorOrdersCount { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalDiscount { get; set; }

        public int CompletedPayments { get; set; }
        public decimal CompletedAmount { get; set; }
    }

    public class ShiftDetailItemDto
    {
        public string ProductName { get; set; } = string.Empty;
        public int QuantitySold { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class VoucherOrderDto
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public string? DiscountName { get; set; }
        public string? DiscountCode { get; set; }
    }

    public class ShiftDetailDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public DateTime ShiftDate { get; set; }
        public DateTime? ShiftStart { get; set; }
        public DateTime? ShiftEnd { get; set; }

        public int OrdersCount { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalDiscount { get; set; }

        public List<ShiftDetailItemDto> TopItems { get; set; } = new();
        public List<VoucherOrderDto> VoucherOrders { get; set; } = new();
    }

    public class PaymentBreakdownDto
    {
        public int PaymentMethod { get; set; }
        public string PaymentMethodName { get; set; } = string.Empty;
        public int TransactionCount { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class CurrentShiftDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public DateTime? ShiftStart { get; set; }
        public int OrdersCount { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalDiscount { get; set; }
        public decimal NetRevenue { get; set; }
        public List<PaymentBreakdownDto> PaymentBreakdown { get; set; } = new();
        public List<ShiftDetailItemDto> TopItems { get; set; } = new();
    }
}

