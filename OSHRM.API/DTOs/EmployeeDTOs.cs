namespace OSHRM.API.DTOs
{
    public class EmployeeDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeCode { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public int? DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string Status { get; set; } = "Đang làm việc"; // Đang làm việc, Thử việc, Đình chỉ, Đã nghỉ việc
    }

    public class CreateEmployeeDto
    {
        public string EmployeeCode { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public int DepartmentId { get; set; }
    }

    public class SuspendEmployeeDto
    {
        public int EmployeeId { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}