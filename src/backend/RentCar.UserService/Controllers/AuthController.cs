using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.Shared.Constants;
using RentCar.Shared.Models;
using RentCar.Shared.Security;
using RentCar.UserService.Data;
using RentCar.UserService.DTOs;
using RentCar.UserService.Entities;
using RentCar.UserService.Services;

namespace RentCar.UserService.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly UserDbContext _db;
    private readonly JwtSettings _jwtSettings;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserDbContext db,
        JwtSettings jwtSettings,
        IEmailService emailService,
        ILogger<AuthController> logger)
    {
        _db = db;
        _jwtSettings = jwtSettings;
        _emailService = emailService;
        _logger = logger;
    }

    [HttpPost("send-verification-code")]
    public async Task<IActionResult> SendVerificationCode([FromBody] SendVerificationCodeRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiProblemDetails.Create(
                400,
                "validation.failed",
                "Validation Error",
                "Invalid email format.",
                Request.Path
            ));
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        // Check if user already exists
        var exists = await _db.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail);
        if (exists)
        {
            return Conflict(ApiProblemDetails.Create(
                409,
                "user.email_already_exists",
                "Email Already Registered",
                "An account with this email address already exists. Please sign in instead.",
                Request.Path
            ));
        }

        // Generate 6-digit verification code
        var code = RandomNumberGenerator.GetInt32(100000, 999999).ToString();

        // Expire previous unused codes for this email
        var previousCodes = await _db.EmailVerifications
            .Where(v => v.Email.ToLower() == normalizedEmail && !v.IsUsed)
            .ToListAsync();

        foreach (var prev in previousCodes)
        {
            prev.IsUsed = true;
        }

        var verification = new EmailVerification
        {
            EmailVerificationId = Guid.NewGuid(),
            Email = normalizedEmail,
            Code = code,
            Purpose = request.Purpose ?? "Register",
            IsUsed = false,
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10)
        };

        _db.EmailVerifications.Add(verification);
        await _db.SaveChangesAsync();

        // Send via Email Service (Real SMTP or Console logger)
        await _emailService.SendVerificationCodeAsync(normalizedEmail, code, verification.Purpose);

        return Ok(new SendVerificationCodeResponse
        {
            Message = "Verification code sent to your email successfully.",
            Email = normalizedEmail,
            SimulatedCode = code,
            ExpiresInSeconds = 600
        });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return UnprocessableEntity(ApiProblemDetails.Create(
                422,
                "validation.failed",
                "Validation Error",
                "One or more validation errors occurred.",
                Request.Path,
                ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>())
            ));
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var exists = await _db.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail);
        if (exists)
        {
            return Conflict(ApiProblemDetails.Create(
                409,
                "user.email_already_exists",
                "Email Conflict",
                "A user with this email address already exists.",
                Request.Path
            ));
        }

        // Verify OTP code
        var enteredCode = request.VerificationCode?.Trim();
        if (string.IsNullOrEmpty(enteredCode))
        {
            return BadRequest(ApiProblemDetails.Create(
                400,
                "auth.verification_code_required",
                "Verification Code Required",
                "Please enter the verification code sent to your Gmail.",
                Request.Path
            ));
        }

        var verification = await _db.EmailVerifications
            .Where(v => v.Email.ToLower() == normalizedEmail &&
                        v.Code == enteredCode &&
                        !v.IsUsed &&
                        v.ExpiresAtUtc > DateTime.UtcNow)
            .OrderByDescending(v => v.CreatedAtUtc)
            .FirstOrDefaultAsync();

        if (verification == null)
        {
            return BadRequest(ApiProblemDetails.Create(
                400,
                "auth.invalid_verification_code",
                "Invalid Verification Code",
                "Verification code is invalid or has expired. Please request a new code.",
                Request.Path
            ));
        }

        // Mark code as used
        verification.IsUsed = true;

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        var user = new User
        {
            UserId = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Email = normalizedEmail,
            PasswordHash = passwordHash,
            Role = UserRoles.Customer, // Registration always creates Customer
            Status = "Active",
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = JwtTokenGenerator.GenerateToken(
            user.UserId,
            user.Name,
            user.Email,
            user.Role,
            _jwtSettings,
            out var expiresUtc);

        var userDto = new UserDto
        {
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            Status = user.Status
        };

        return StatusCode(StatusCodes.Status201Created, new AuthResponse
        {
            AccessToken = token,
            TokenType = "Bearer",
            ExpiresIn = (int)(expiresUtc - DateTime.UtcNow).TotalSeconds,
            User = userDto
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiProblemDetails.Create(
                400,
                "request.invalid_format",
                "Bad Request",
                "Invalid login request format.",
                Request.Path
            ));
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(ApiProblemDetails.Create(
                401,
                "auth.invalid_credentials",
                "Authentication Failed",
                "Invalid email or password.",
                Request.Path
            ));
        }

        if (user.Status != "Active")
        {
            return Unauthorized(ApiProblemDetails.Create(
                401,
                "auth.account_inactive",
                "Account Inactive",
                "Your account is inactive. Please contact support.",
                Request.Path
            ));
        }

        var token = JwtTokenGenerator.GenerateToken(
            user.UserId,
            user.Name,
            user.Email,
            user.Role,
            _jwtSettings,
            out var expiresUtc);

        var userDto = new UserDto
        {
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            Status = user.Status
        };

        return Ok(new AuthResponse
        {
            AccessToken = token,
            TokenType = "Bearer",
            ExpiresIn = (int)(expiresUtc - DateTime.UtcNow).TotalSeconds,
            User = userDto
        });
    }
}
