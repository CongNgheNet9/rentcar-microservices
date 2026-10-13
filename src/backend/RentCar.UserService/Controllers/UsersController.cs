using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.Shared.Models;
using RentCar.UserService.Data;
using RentCar.UserService.DTOs;

namespace RentCar.UserService.Controllers;

[ApiController]
[Route("users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly UserDbContext _db;

    public UsersController(UserDbContext db)
    {
        _db = db;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiProblemDetails.Create(
                401,
                "auth.invalid_token",
                "Unauthorized",
                "Invalid user token.",
                Request.Path
            ));
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null)
        {
            return NotFound(ApiProblemDetails.Create(
                404,
                "user.not_found",
                "User Not Found",
                "The requested user account was not found.",
                Request.Path
            ));
        }

        return Ok(new UserDto
        {
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            Status = user.Status
        });
    }
}
