namespace MiniPlat.Application.Exceptions;

public class SubjectNotFoundException(string userId) : NotFoundException("Subject", userId);