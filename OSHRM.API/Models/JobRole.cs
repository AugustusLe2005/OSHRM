using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace OSHRM.API.Models;

[Index("RoleCode", Name = "UQ__JobRoles__D62CB59CA691ADAA", IsUnique = true)]
public partial class JobRole
{
    [Key]
    public int RoleId { get; set; }

    [StringLength(20)]
    [Unicode(false)]
    public string RoleCode { get; set; } = null!;

    [StringLength(100)]
    public string RoleName { get; set; } = null!;

    [StringLength(50)]
    public string JobLevel { get; set; } = null!;

    [Column(TypeName = "decimal(18, 2)")]
    public decimal MinSalary { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal MaxSalary { get; set; }

    [InverseProperty("Role")]
    public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
