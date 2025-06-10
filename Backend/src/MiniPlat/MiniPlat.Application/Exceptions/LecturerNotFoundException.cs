namespace MiniPlat.Application.Exceptions;

public class LecturerNotFoundException(string userId) : NotFoundException("Lecturer", userId);