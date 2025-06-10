namespace MiniPlat.Api.Controllers.Accounts;

public class RegisterMultipleUsersRequest
{
    public List<RegisterUserRequest> Users { get; set; } = [];
}

public class RegisterUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;

    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
}
