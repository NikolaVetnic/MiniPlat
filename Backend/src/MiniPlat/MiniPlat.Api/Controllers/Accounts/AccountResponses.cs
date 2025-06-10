namespace MiniPlat.Api.Controllers.Accounts;

public class RegisterMultipleUsersResponse
{
    public bool Succeeded { get; set; }
    public List<FailedUserResponse> FailedUsers { get; set; } = [];
}

public class FailedUserResponse
{
    public string Username { get; set; } = string.Empty;
    public IEnumerable<string> Errors { get; set; } = [];
}