using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OSHRM.API.Models;

namespace OSHRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TransferController : ControllerBase
    {
        private readonly AppDbContext _db;

        public TransferController(AppDbContext db)
        {
            _db = db;
        }

        // DTOs
        public class TransferDeptDto
        {
            public int EmployeeId { get; set; }
            public int NewDepartmentId { get; set; }
            public string Reason { get; set; } = string.Empty;
        }

        public class SuspendDto
        {
            public int EmployeeId { get; set; }
            public string Reason { get; set; } = string.Empty;
        }

        // PUT: api/transfer/department (Điều chuyển phòng ban)
        [HttpPut("department")]
        public async Task<IActionResult> TransferDepartment([FromBody] TransferDeptDto dto)
        {
            var emp = await _db.Employees.FindAsync(dto.EmployeeId);
            if (emp == null) return NotFound(new { message = "Không tìm thấy nhân viên!" });

            var newDept = await _db.Departments.FindAsync(dto.NewDepartmentId);
            if (newDept == null) return NotFound(new { message = "Phòng ban mới không tồn tại!" });

            emp.DepartmentId = dto.NewDepartmentId;
            await _db.SaveChangesAsync();

            return Ok(new { message = $"Đã điều chuyển nhân viên {emp.FullName} sang '{newDept.DepartmentName}' thành công!" });
        }

        // PUT: api/transfer/suspend (Ra quyết định Đình chỉ công tác)
        [HttpPut("suspend")]
        public async Task<IActionResult> SuspendEmployee([FromBody] SuspendDto dto)
        {
            var emp = await _db.Employees.FindAsync(dto.EmployeeId);
            if (emp == null) return NotFound(new { message = "Không tìm thấy nhân viên!" });

            emp.Status = "Đình chỉ";
            emp.IsActive = false; // Ngắt trạng thái hoạt động trong database
            await _db.SaveChangesAsync();

            return Ok(new { message = $"Đã ban hành quyết định ĐÌNH CHỈ CÔNG TÁC đối với nhân viên '{emp.FullName}'!" });
        }

        // PUT: api/transfer/activate (Khôi phục hoạt động sau đình chỉ)
        [HttpPut("activate/{id}")]
        public async Task<IActionResult> ActivateEmployee(int id)
        {
            var emp = await _db.Employees.FindAsync(id);
            if (emp == null) return NotFound(new { message = "Không tìm thấy nhân viên!" });

            emp.Status = "Đang làm việc";
            emp.IsActive = true;
            await _db.SaveChangesAsync();

            return Ok(new { message = $"Đã gỡ bỏ lệnh đình chỉ, khôi phục công tác cho nhân viên '{emp.FullName}'!" });
        }
    }
}