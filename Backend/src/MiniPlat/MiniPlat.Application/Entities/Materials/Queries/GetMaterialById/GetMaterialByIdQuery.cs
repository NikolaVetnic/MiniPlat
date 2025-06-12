using FluentValidation;
using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Materials.Queries.GetMaterialById;

public record GetMaterialByIdQuery(MaterialId Id) : IQuery<GetMaterialByIdResult>
{
    public GetMaterialByIdQuery(string Id) : this(MaterialId.Of(Guid.Parse(Id))) { }
}

public record GetMaterialByIdResult(Material Material);

public class GetMaterialByIdQueryValidator : AbstractValidator<GetMaterialByIdQuery>
{
    public GetMaterialByIdQueryValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.")
            .Must(value => Guid.TryParse(value.ToString(), out _)).WithMessage("Id is not valid.");
    }
}
