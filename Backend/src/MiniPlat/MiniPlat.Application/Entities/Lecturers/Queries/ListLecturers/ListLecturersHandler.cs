using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;

namespace MiniPlat.Application.Entities.Lecturers.Queries.ListLecturers;

public class ListLecturersHandler(ILecturersRepository lecturersRepository)
    : IQueryHandler<ListLecturersQuery, ListLecturersResult>
{
    public async Task<ListLecturersResult> Handle(ListLecturersQuery query, CancellationToken cancellationToken)
    {
        var lecturers = await lecturersRepository.ListLecturersAsync(cancellationToken);

        var summaries = lecturers
            .Select(l => new LecturerSummary(
                l.User.UserName!,
                l.Title,
                l.User.FirstName,
                l.User.LastName))
            .ToList();

        return new ListLecturersResult(summaries);
    }
}
