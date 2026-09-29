using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace OSHRM.API.Models;

[Index("DepartmentCode", Name = "UQ__Departme__6EA8896DA3341B80", IsUnique = true)]
public partial class Department
{
    [Key]
    public int DepartmentId { get; set; }

    [StringLength(20)]
    [Unicode(false)]
    public string DepartmentCode { get; set; } = null!;

    [StringLength(100)]
    public string DepartmentName { get; set; } = null!;

    [StringLength(255)]
    public string? Description { get; set; }

    public bool? IsActive { get; set; }

    [InverseProperty("Department")]
    public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
