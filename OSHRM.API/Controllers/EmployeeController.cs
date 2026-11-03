using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OSHRM.API.DTOs;
using OSHRM.API.Models;

namespace OSHRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeeController : ControllerBase
    {
        private readonly AppDbContext _db;

        public EmployeeController(AppDbContext db)
        {
            _db = db;
        }

        // GET: api/employee/list
        [HttpGet("list")]
        public async Task<IActionResult> GetEmployees()
        {
            var list = await _db.Employees
                .Include(e => e.Department)
                .Include(e => e.Role)
                .Select(e => new EmployeeDto
                {
                    EmployeeId = e.EmployeeId,
                    EmployeeCode = e.EmployeeCode,
                    FullName = e.FullName,
                    Email = e.Email,
                    Phone = e.PhoneNumber ?? string.Empty,
                    Position = e.Role != null ? e.Role.RoleName : "Chuyên viên",
                    DepartmentId = e.DepartmentId,
                    DepartmentName = e.Department != null ? e.Department.DepartmentName : "Chưa phân công",
                    Status = string.IsNullOrEmpty(e.Status) 
                        ? ((e.IsActive.HasValue && !e.IsActive.Value) ? "Đình chỉ" : "Đang làm việc") 
                        : e.Status
                })
                .ToListAsync();

            return Ok(list);
        }

        // POST: api/employee/create
        [HttpPost("create")]
        public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeDto dto)
        {
            if (string.IsNullOrEmpty(dto.FullName))
                return BadRequest(new { message = "Họ tên nhân viên không được để trống!" });

            var emp = new Employee
            {
                EmployeeCode = string.IsNullOrEmpty(dto.EmployeeCode) ? $"NV-{Random.Shared.Next(100, 999)}" : dto.EmployeeCode,
                FullName = dto.FullName,
                Email = dto.Email,
                PhoneNumber = dto.Phone,
                DepartmentId = dto.DepartmentId > 0 ? dto.DepartmentId : null,
                HireDate = DateOnly.FromDateTime(DateTime.Now),
                IsActive = true,
                Status = "Đang làm việc"
            };

            _db.Employees.Add(emp);
            await _db.SaveChangesAsync();

            return Ok(new { message = $"Đã tiếp nhận nhân viên {emp.FullName} thành công!", data = emp });
        }

        // PUT: api/employee/suspend/{id} (CHỨC NĂNG ĐÌNH CHỈ)
        [HttpPut("suspend/{id}")]
        public async Task<IActionResult> SuspendEmployee(int id)
        {
            var emp = await _db.Employees.FindAsync(id);
            if (emp == null)
                return NotFound(new { message = "Không tìm thấy thông tin nhân viên!" });

            emp.Status = "Đình chỉ";
            emp.IsActive = false; // Ngắt trạng thái hoạt động trong DB
            await _db.SaveChangesAsync();

            return Ok(new { message = $"Đã thi hành quyết định ĐÌNH CHỈ CÔNG TÁC đối với nhân viên '{emp.FullName}'!" });
        }

        // PUT: api/employee/activate/{id} (KHÔI PHỤC HOẠT ĐỘNG)
        [HttpPut("activate/{id}")]
        public async Task<IActionResult> ActivateEmployee(int id)
        {
            var emp = await _db.Employees.FindAsync(id);
            if (emp == null)
                return NotFound(new { message = "Không tìm thấy thông tin nhân viên!" });

            emp.Status = "Đang làm việc";
            emp.IsActive = true;
            await _db.SaveChangesAsync();

            return Ok(new { message = $"Đã khôi phục trạng thái hoạt động cho nhân viên '{emp.FullName}'!" });
        }

        // DELETE: api/employee/delete/{id} (CHỈ CHO XÓA KHI ĐÃ ĐÌNH CHỈ)
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            var emp = await _db.Employees.FindAsync(id);
            if (emp == null)
                return NotFound(new { message = "Không tìm thấy nhân viên cần xóa!" });

            // Ràng buộc nghiệp vụ Enterprise: Phải ĐÌNH CHỈ trước mới được xóa
            if (emp.Status != "Đình chỉ" && emp.IsActive == true)
            {
                return BadRequest(new { 
                    message = $"Không thể xóa nhân viên '{emp.FullName}' đang hoạt động! Yêu cầu thực hiện ĐÌNH CHỈ CÔNG TÁC trước khi xóa." 
                });
            }

            _db.Employees.Remove(emp);
            await _db.SaveChangesAsync();

            return Ok(new { message = $"Đã xóa hồ sơ nhân viên '{emp.FullName}' khỏi hệ thống!" });
        }
    }
}