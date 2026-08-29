namespace BuildingBlocks.Application.Exceptions;

/// <summary>
/// The caller is authenticated but not allowed to touch this particular resource.
/// Distinct from an authorization policy failure, which never reaches a handler.
/// </summary>
public class ForbiddenException : Exception
{
    public ForbiddenException(string message) : base(message) { }
}
