using MiniPlat.Application.Entities.Lecturers.Queries.GetLecturerByUsername;
using MiniPlat.Application.Entities.Lecturers.Queries.ListLecturers;

namespace MiniPlat.Api.Controllers.Lecturers;

public record GetLecturerByUsernameResponse(LecturerDetails Lecturer);

public record ListLecturersResponse(IReadOnlyList<LecturerSummary> Lecturers);
