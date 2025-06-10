using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Exceptions;

namespace MiniPlat.Application.Entities.Lecturers.Queries.GetLecturerByUserId;

public class GetLecturerByUserIdHandler(ILecturersRepository lecturersRepository) : IQueryHandler<GetLecturerByUserIdQuery, GetLecturerByUserIdResult>
{
    public async Task<GetLecturerByUserIdResult> Handle(GetLecturerByUserIdQuery query, CancellationToken cancellationToken)
    {
        var lecturer = await lecturersRepository.GetLecturerByUserId(query.UserId, cancellationToken);
        
        if (lecturer == null)
            throw new LecturerNotFoundException(query.UserId);
        
        return new GetLecturerByUserIdResult(lecturer);
    }
}