using System;

namespace fastfood.Helpers
{
    /// <summary>
    /// Helper class để xử lý DateTime theo múi giờ Việt Nam (UTC+7)
    /// </summary>
    public static class DateTimeHelper
    {
        // Múi giờ Việt Nam (UTC+7 - SE Asia Standard Time)
        private static readonly TimeZoneInfo VietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");

        /// <summary>
        /// Lấy thời gian hiện tại theo múi giờ Việt Nam
        /// </summary>
        public static DateTime VietnamNow
        {
            get
            {
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VietnamTimeZone);
            }
        }

        /// <summary>
        /// Chuyển đổi UTC time sang múi giờ Việt Nam
        /// </summary>
        public static DateTime ConvertToVietnamTime(DateTime utcDateTime)
        {
            if (utcDateTime.Kind != DateTimeKind.Utc)
            {
                // Nếu không phải UTC, chuyển sang UTC trước
                utcDateTime = DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc);
            }
            return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, VietnamTimeZone);
        }

        /// <summary>
        /// Chuyển đổi thời gian Việt Nam sang UTC
        /// </summary>
        public static DateTime ConvertToUtc(DateTime vietnamDateTime)
        {
            return TimeZoneInfo.ConvertTimeToUtc(vietnamDateTime, VietnamTimeZone);
        }

        /// <summary>
        /// Lấy ngày đầu tiên của tháng hiện tại (múi giờ Việt Nam)
        /// </summary>
        public static DateTime GetStartOfCurrentMonth()
        {
            var now = VietnamNow;
            return new DateTime(now.Year, now.Month, 1);
        }

        /// <summary>
        /// Lấy ngày đầu tiên của năm hiện tại (múi giờ Việt Nam)
        /// </summary>
        public static DateTime GetStartOfCurrentYear()
        {
            var now = VietnamNow;
            return new DateTime(now.Year, 1, 1);
        }

        /// <summary>
        /// Lấy ngày đầu tuần (Chủ nhật) của tuần hiện tại (múi giờ Việt Nam)
        /// </summary>
        public static DateTime GetStartOfCurrentWeek()
        {
            var today = VietnamNow.Date;
            var dayOfWeek = (int)today.DayOfWeek;
            return today.AddDays(-dayOfWeek);
        }

        /// <summary>
        /// Lấy ngày hôm nay (múi giờ Việt Nam)
        /// </summary>
        public static DateTime GetToday()
        {
            return VietnamNow.Date;
        }

        /// <summary>
        /// Format DateTime theo định dạng Việt Nam
        /// </summary>
        public static string FormatVietnamese(DateTime dateTime)
        {
            return dateTime.ToString("dd/MM/yyyy HH:mm:ss");
        }

        /// <summary>
        /// Format DateTime chỉ ngày theo định dạng Việt Nam
        /// </summary>
        public static string FormatDateVietnamese(DateTime dateTime)
        {
            return dateTime.ToString("dd/MM/yyyy");
        }
    }
}

