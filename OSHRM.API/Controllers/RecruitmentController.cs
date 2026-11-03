using Microsoft.AspNetCore.Mvc;
using OSHRM.API.DTOs;

namespace OSHRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecruitmentController : ControllerBase
    {
        // Mockup dữ liệu bộ nhớ tĩnh phục vụ module Tuyển dụng
        private static List<CandidateDto> _candidates = new List<CandidateDto>
        {
            new CandidateDto { CandidateId = 1, FullName = "Trần Văn An", Email = "an.tv@gmail.com", Phone = "0912345678", Position = "DevOps Engineer", DepartmentName = "Công nghệ thông tin", Stage = "Interview", AppliedDate = "25/10/2026", Score = 85 },
            new CandidateDto { CandidateId = 2, FullName = "Nguyễn Thị Hương", Email = "huong.nt@gmail.com", Phone = "0988776655", Position = "HR Executive", DepartmentName = "Hành chính nhân sự", Stage = "Screening", AppliedDate = "26/10/2026", Score = 78 },
            new CandidateDto { CandidateId = 3, FullName = "Phạm Quốc Bảo", Email = "bao.pq@gmail.com", Phone = "0905112233", Position = "Backend .NET Developer", DepartmentName = "Công nghệ thông tin", Stage = "Applied", AppliedDate = "28/10/2026", Score = 90 },
            new CandidateDto { CandidateId = 4, FullName = "Lê Hoàng Yến", Email = "yen.lh@gmail.com", Phone = "0934567890", Position = "Business Analyst", DepartmentName = "Công nghệ thông tin", Stage = "Offer", AppliedDate = "20/10/2026", Score = 92 }
        };

        [HttpGet("list")]
        public IActionResult GetCandidates()
        {
            return Ok(_candidates);
        }

        [HttpPost("create")]
        public IActionResult CreateCandidate([FromBody] CreateCandidateDto dto)
        {
            if (string.IsNullOrEmpty(dto.FullName))
                return BadRequest(new { message = "Tên ứng viên không được để trống!" });

            int newId = _candidates.Any() ? _candidates.Max(c => c.CandidateId) + 1 : 1;
            var newCandidate = new CandidateDto
            {
                CandidateId = newId,
                FullName = dto.FullName,
                Email = dto.Email,
                Phone = dto.Phone,
                Position = dto.Position,
                DepartmentName = string.IsNullOrEmpty(dto.DepartmentName) ? "Công nghệ thông tin" : dto.DepartmentName,
                Stage = "Applied",
                AppliedDate = DateTime.Now.ToString("dd/MM/yyyy"),
                Score = 80
            };

            _candidates.Add(newCandidate);
            return Ok(new { message = $"Đã tiếp nhận hồ sơ ứng viên {dto.FullName} thành công!", data = newCandidate });
        }

        [HttpPut("update-stage")]
        public IActionResult UpdateStage([FromBody] UpdateStageDto dto)
        {
            var candidate = _candidates.FirstOrDefault(c => c.CandidateId == dto.CandidateId);
            if (candidate == null)
                return NotFound(new { message = "Không tìm thấy hồ sơ ứng viên!" });

            candidate.Stage = dto.NewStage;
            return Ok(new { message = $"Đã chuyển trạng thái ứng viên sang '{dto.NewStage}'!" });
        }

        [HttpDelete("delete/{id}")]
        public IActionResult DeleteCandidate(int id)
        {
            var candidate = _candidates.FirstOrDefault(c => c.CandidateId == id);
            if (candidate == null)
                return NotFound(new { message = "Không tìm thấy hồ sơ ứng viên!" });

            _candidates.Remove(candidate);
            return Ok(new { message = "Đã loại hồ sơ ứng viên thành công!" });
        }
    }
}