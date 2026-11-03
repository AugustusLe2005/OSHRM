using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OSHRM.API.Models;
using OSHRM.API.DTOs;

namespace OSHRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TimekeepingController : ControllerBase
    {
        private readonly AppDbContext _db;

        public TimekeepingController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary([FromQuery] int month = 10, [FromQuery] int year = 2026, [FromQuery] string department = "ALL")
        {
            var query = _db.Employees
                .Include(e => e.Department)
                .Where(e => e.IsActive == true);

            if (!string.IsNullOrEmpty(department) && department != "ALL")
            {
                query = query.Where(e => e.Department != null && (e.Department.DepartmentName.Contains(department) || e.Department.DepartmentCode == department));
            }

            var employees = await query.ToListAsync();

            var result = employees.Select(e => new TimekeepingSummaryDto
            {
                EmployeeId = e.EmployeeId,
                EmployeeCode = e.EmployeeCode,
                FullName = e.FullName,
                DepartmentName = e.Department?.DepartmentName ?? "Chưa phân công",
                WorkDays = 22,
                TotalHours = 176.5,
                OtHours = 12.5,
                LateCount = 0,
                EarlyLeaveCount = 0,
                MissingDataCount = 0,
                Evaluation = "Tốt"
            }).ToList();

            return Ok(result);
        }
    }
}