using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OSHRM.API.Models;
using OSHRM.API.DTOs;

namespace OSHRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PayrollController : ControllerBase
    {
        private readonly AppDbContext _db;

        public PayrollController(AppDbContext db)
        {
            _db = db;
        }

        // POST: api/payroll/calculate-auto
        [HttpPost("calculate-auto")]
        public async Task<IActionResult> CalculateAutoPayroll([FromBody] CalculatePayrollRequestDto req)
        {
            var employees = await _db.Employees.Where(e => e.IsActive == true).ToListAsync();
            if (!employees.Any())
            {
                return BadRequest(new { message = "Không tìm thấy nhân viên nào đang hoạt động để tính lương!" });
            }

            int processedCount = 0;

            foreach (var emp in employees)
            {
                decimal workDays = 22m;
                decimal otHours = 12.5m;

                decimal baseSalary = workDays * req.BaseSalaryPerDay;
                decimal otAllowance = otHours * req.OtRatePerHour;
                decimal netSalary = baseSalary + otAllowance;

                // Tìm bản ghi lương hiện có của nhân viên
                var existingPayroll = await _db.Payrolls.FirstOrDefaultAsync(p => p.EmployeeId == emp.EmployeeId);

                if (existingPayroll != null)
                {
                    existingPayroll.BaseSalary = baseSalary;
                    existingPayroll.Allowance = otAllowance;
                    existingPayroll.NetSalary = netSalary;
                    existingPayroll.Status = "Paid";
                }
                else
                {
                    var newPayroll = new Payroll
                    {
                        EmployeeId = emp.EmployeeId,
                        BaseSalary = baseSalary,
                        Allowance = otAllowance,
                        NetSalary = netSalary,
                        Status = "Paid",
                        CreatedAt = DateTime.Now
                    };
                    _db.Payrolls.Add(newPayroll);
                }
                processedCount++;
            }

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = $"Đã tự động tính và chốt sổ lương thành công cho {processedCount} nhân viên!",
                month = req.Month,
                year = req.Year
            });
        }

        // GET: api/payroll/list
        [HttpGet("list")]
        public async Task<IActionResult> GetPayrollList([FromQuery] int month = 10, [FromQuery] int year = 2026)
        {
            var list = await _db.Payrolls
                .Include(p => p.Employee)
                .ThenInclude(e => e!.Department)
                .Select(p => new
                {
                    p.PayrollId,
                    p.EmployeeId,
                    EmployeeCode = p.Employee != null ? p.Employee.EmployeeCode : "",
                    FullName = p.Employee != null ? p.Employee.FullName : "",
                    DepartmentName = p.Employee != null && p.Employee.Department != null ? p.Employee.Department.DepartmentName : "N/A",
                    Month = month,
                    Year = year,
                    p.BaseSalary,
                    Allowance = p.Allowance ?? 0m,
                    Deductions = 0m,
                    p.NetSalary,
                    Status = p.Status ?? "Paid",
                    p.CreatedAt
                })
                .ToListAsync();

            return Ok(list);
        }
    }
}