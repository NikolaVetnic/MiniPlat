using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Exceptions;

namespace MiniPlat.Application.Entities.Subjects.Queries.GetSubjectById;

internal class GetSubjectByIdHandler(ICurrentUser currentUser, ISubjectsRepository subjectsRepository) : IQueryHandler<GetSubjectByIdQuery, GetSubjectByIdResult>
{
    public async Task<GetSubjectByIdResult> Handle(GetSubjectByIdQuery query, CancellationToken cancellationToken)
    {
        var subject = await subjectsRepository.GetById(query.Id, cancellationToken);
    
        if (subject == null)
            throw new SubjectNotFoundException(query.Id.ToString());

        // Same rule the list uses, so a subject cannot be reached by id once it is filtered out
        // of the listing.
        if (!SubjectViewer.For(currentUser).CanSee.Compile()(subject))
            throw new SubjectNotFoundException(query.Id.ToString());

        return new GetSubjectByIdResult(subject.Redact(currentUser));
    }
}
