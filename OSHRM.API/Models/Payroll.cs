using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace OSHRM.API.Models;

public partial class Payroll
{
    [Key]
    public int PayrollId { get; set; }

    public int? EmployeeId { get; set; }

    public int PayMonth { get; set; }

    public int PayYear { get; set; }

    [Column(TypeName = "decimal(4, 1)")]
    public decimal WorkDays { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal BaseSalary { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal? Allowance { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal InsuranceDeduction { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal NetSalary { get; set; }

    [StringLength(20)]
    public string? Status { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [ForeignKey("EmployeeId")]
    [InverseProperty("Payrolls")]
    public virtual Employee? Employee { get; set; }
}
