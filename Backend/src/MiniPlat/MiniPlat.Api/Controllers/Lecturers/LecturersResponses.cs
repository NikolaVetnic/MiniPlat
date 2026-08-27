using MiniPlat.Application.Entities.Lecturers.Queries.ListLecturers;
using MiniPlat.Domain.Models;

namespace MiniPlat.Api.Controllers.Lecturers;

public record GetLecturerByUsernameResponse(Lecturer Lecturer);

public record ListLecturersResponse(IReadOnlyList<LecturerSummary> Lecturers);
