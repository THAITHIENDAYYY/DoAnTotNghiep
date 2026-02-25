using System.ComponentModel.DataAnnotations;

namespace fastfood.Shared.Attributes
{
    /// <summary>
    /// Email validation chỉ check khi có giá trị, cho phép null hoặc chuỗi rỗng
    /// </summary>
    public class OptionalEmailAddressAttribute : ValidationAttribute
    {
        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            // Cho phép null hoặc chuỗi rỗng
            if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
            {
                return ValidationResult.Success;
            }

            // Nếu có giá trị, validate email
            var emailAttribute = new EmailAddressAttribute();
            if (!emailAttribute.IsValid(value))
            {
                return new ValidationResult(ErrorMessage ?? "Email không hợp lệ");
            }

            return ValidationResult.Success;
        }
    }
}

