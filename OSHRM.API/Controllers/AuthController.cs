using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OSHRM.API.Models;

namespace OSHRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthDbContext _authContext;

        public AuthController(AuthDbContext authContext)
        {
            _authContext = authContext;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest model)
        {
            if (string.IsNullOrEmpty(model.Email) || string.IsNullOrEmpty(model.Password))
            {
                return BadRequest(new { message = "Vui lòng nhập đầy đủ Email và Mật khẩu!" });
            }

            // Tìm user trong CSDL SQL Server (Database OSHRM)
            var user = await _authContext.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == model.Email.ToLower());

            if (user == null)
            {
                return BadRequest(new { message = "Tài khoản hoặc mật khẩu không chính xác!" });
            }

            // 1. Kiểm tra nếu tài khoản đang trong thời gian bị KHÓA (Lockout Policy)
            if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.Now)
            {
                var remainingSeconds = (int)(user.LockoutEnd.Value - DateTime.Now).TotalSeconds;
                return StatusCode(423, new 
                { 
                    message = "Tài khoản tạm thời bị khóa do nhập sai quá 5 lần!", 
                    remainingSeconds = remainingSeconds 
                });
            }

            // 2. Kiểm tra mật khẩu
            bool isPasswordCorrect = (user.PasswordHash == model.Password);

            if (!isPasswordCorrect)
            {
                user.FailedAttemptCount++;

                // Nếu nhập sai đủ 5 lần -> Khóa tài khoản 5 phút (300 giây) trong SQL Server
                if (user.FailedAttemptCount >= 5)
                {
                    user.LockoutEnd = DateTime.Now.AddMinutes(5);
                    await _authContext.SaveChangesAsync();

                    return StatusCode(423, new 
                    { 
                        message = "Tài khoản của bạn đã bị khóa 5 phút do thử sai quá 5 lần!", 
                        remainingSeconds = 300 
                    });
                }

                await _authContext.SaveChangesAsync();
                int remainingAttempts = 5 - user.FailedAttemptCount;
                return BadRequest(new { message = $"Mật khẩu không chính xác! Bạn còn {remainingAttempts} lần thử." });
            }

            // 3. Đăng nhập THÀNH CÔNG -> Reset bộ đếm sai & LockoutEnd về 0/null
            user.FailedAttemptCount = 0;
            user.LockoutEnd = null;
            await _authContext.SaveChangesAsync();

            return Ok(new
            {
                message = "Đăng nhập thành công!",
                token = "jwt_mock_token_oshrm_2026",
                user = new
                {
                    user.UserId,
                    user.EmployeeCode,
                    user.FullName,
                    user.Email,
                    user.Phone,
                    user.Department,
                    user.SubDepartment,
                    user.JobTitle,
                    user.RoleId
                }
            });
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}