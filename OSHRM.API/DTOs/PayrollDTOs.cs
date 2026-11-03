namespace OSHRM.API.DTOs
{
    public class TimekeepingSummaryDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeCode { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;
        public double WorkDays { get; set; }
        public double TotalHours { get; set; }
        public double OtHours { get; set; }
        public int LateCount { get; set; }
        public int EarlyLeaveCount { get; set; }
        public int MissingDataCount { get; set; }
        public string Evaluation { get; set; } = "Ổn định";
    }

    public class CalculatePayrollRequestDto
    {
        public int Month { get; set; }
        public int Year { get; set; }
        public decimal BaseSalaryPerDay { get; set; } = 500000m;
        public decimal OtRatePerHour { get; set; } = 100000m;
    }
}