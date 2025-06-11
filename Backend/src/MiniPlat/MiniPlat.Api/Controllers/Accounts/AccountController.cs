using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MiniPlat.Api.Attributes;
using MiniPlat.Application.Entities.User.Commands.RegisterUser;
using MiniPlat.Application.Entities.User.Commands.RegisterUsers;
using MiniPlat.Domain.Models;

namespace MiniPlat.Api.Controllers.Accounts;

[ApiController]
[Route("api/[controller]")]
[RequireApiKey]
public class AccountController(ISender sender, UserManager<ApplicationUser> userManager) : ControllerBase
{
    [HttpPost("Register")]
    public async Task<IActionResult> Register(RegisterUserCommand command)
    {
        var result = await sender.Send(command);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok("User registered successfully.");
    }

    [HttpPost("RegisterMultiple")]
    public async Task<IActionResult> RegisterMultipleUsers(
        [FromBody] RegisterMultipleUsersRequest request)
    {
        var command = new RegisterMultipleUsersCommand
        {
            Users = request.Users.Select(u => new RegisterUserDto
            {
                Username = u.Username,
                Email = u.Email,
                Password = u.Password,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Title = u.Title,
                Department = u.Department
            }).ToList()
        };

        var result = await sender.Send(command);

        var response = new RegisterMultipleUsersResponse
        {
            Succeeded = result.Succeeded,
            FailedUsers = result.FailedUsers.Select(f => new FailedUserResponse
            {
                Username = f.Username,
                Errors = f.Errors
            }).ToList()
        };

        if (!result.Succeeded)
            return BadRequest(response);

        return Ok(response);
    }
}