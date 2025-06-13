using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Exceptions;

namespace MiniPlat.Application.Entities.Lecturers.Queries.GetLecturerByUsername;

public class GetLecturerByUsernameHandler(ILecturersRepository lecturersRepository) : IQueryHandler<GetLecturerByUsernameQuery, GetLecturerByUsernameResult>
{
    public async Task<GetLecturerByUsernameResult> Handle(GetLecturerByUsernameQuery query, CancellationToken cancellationToken)
    {
        var lecturer = await lecturersRepository.GetLecturerByUsername(query.UserId, cancellationToken);
        
        if (lecturer == null)
            throw new LecturerNotFoundException(query.UserId);
        
        return new GetLecturerByUsernameResult(lecturer);
    }
}