using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace OSHRM.API.Models;

[Index("EmployeeCode", Name = "UQ__Employee__1F6425487E58CE15", IsUnique = true)]
[Index("Email", Name = "UQ__Employee__A9D10534DBD62BB9", IsUnique = true)]
public partial class Employee
{
    [Key]
    public int EmployeeId { get; set; }

    [StringLength(20)]
    [Unicode(false)]
    public string EmployeeCode { get; set; } = null!;

    [StringLength(100)]
    public string FullName { get; set; } = null!;

    [StringLength(100)]
    [Unicode(false)]
    public string Email { get; set; } = null!;

    [StringLength(15)]
    [Unicode(false)]
    public string? PhoneNumber { get; set; }

    [StringLength(20)]
    [Unicode(false)]
    public string? CitizenId { get; set; }

    [StringLength(50)]
    public string? Ethnicity { get; set; }

    [StringLength(50)]
    public string? Religion { get; set; }

    public int? DepartmentId { get; set; }

    public int? RoleId { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal BaseSalary { get; set; }

    public DateOnly HireDate { get; set; }

    public bool? IsActive { get; set; }

    [ForeignKey("DepartmentId")]
    [InverseProperty("Employees")]
    public virtual Department? Department { get; set; }

    [InverseProperty("Employee")]
    public virtual ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();

    [InverseProperty("Employee")]
    public virtual ICollection<Payroll> Payrolls { get; set; } = new List<Payroll>();

    [ForeignKey("RoleId")]
    [InverseProperty("Employees")]
    public virtual JobRole? Role { get; set; }
}
