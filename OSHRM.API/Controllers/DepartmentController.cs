using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OSHRM.API.Models;

namespace OSHRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DepartmentController : ControllerBase
    {
        private readonly AppDbContext _db;

        public DepartmentController(AppDbContext db)
        {
            _db = db;
        }

        // GET: api/department/list
        [HttpGet("list")]
        public async Task<IActionResult> GetDepartments()
        {
            var list = await _db.Departments
                .Select(d => new
                {
                    d.DepartmentId,
                    d.DepartmentCode,
                    d.DepartmentName,
                    ManagerName = "Chưa phân công",
                    EmployeeCount = _db.Employees.Count(e => e.DepartmentId == d.DepartmentId),
                    Status = "Hoạt động"
                })
                .ToListAsync();

            return Ok(list);
        }

        // POST: api/department/create
        [HttpPost("create")]
        public async Task<IActionResult> CreateDepartment([FromBody] Department dept)
        {
            if (string.IsNullOrEmpty(dept.DepartmentName))
                return BadRequest(new { message = "Tên phòng ban không được để trống!" });

            _db.Departments.Add(dept);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Thêm mới phòng ban thành công!", data = dept });
        }

        // PUT: api/department/update/5
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateDepartment(int id, [FromBody] Department dept)
        {
            var existingDept = await _db.Departments.FindAsync(id);
            if (existingDept == null)
                return NotFound(new { message = "Không tìm thấy phòng ban cần sửa!" });

            existingDept.DepartmentCode = dept.DepartmentCode;
            existingDept.DepartmentName = dept.DepartmentName;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Cập nhật phòng ban thành công!" });
        }

        // DELETE: api/department/delete/5
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            var dept = await _db.Departments.FindAsync(id);
            if (dept == null)
                return NotFound(new { message = "Không tìm thấy phòng ban!" });

            _db.Departments.Remove(dept);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Đã xóa phòng ban khỏi hệ thống!" });
        }
    }
}