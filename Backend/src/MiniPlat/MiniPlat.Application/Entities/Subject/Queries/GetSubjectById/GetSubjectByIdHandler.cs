using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Exceptions;

namespace MiniPlat.Application.Entities.Subject.Queries.GetSubjectById;

internal class GetSubjectByIdHandler(ISubjectsRepository subjectsRepository) : IQueryHandler<GetSubjectByIdQuery, GetSubjectByIdResult>
{
    public async Task<GetSubjectByIdResult> Handle(GetSubjectByIdQuery query, CancellationToken cancellationToken)
    {
        var subject = await subjectsRepository.GetSubjectById(query.Id, cancellationToken);
    
        if (subject == null)
            throw new SubjectNotFoundException(query.Id.ToString());

        return new GetSubjectByIdResult(subject);
    }
}
