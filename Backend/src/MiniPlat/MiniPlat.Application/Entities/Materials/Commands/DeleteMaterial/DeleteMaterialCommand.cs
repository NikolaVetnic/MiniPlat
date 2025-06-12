using FluentValidation;
using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Materials.Commands.DeleteMaterial;

public record DeleteMaterialCommand(MaterialId Id) : ICommand<DeleteMaterialResult>
{
    public DeleteMaterialCommand(string Id) : this(MaterialId.Of(Guid.Parse(Id))) { }

}

public record DeleteMaterialResult(bool IsMaterialDeleted);

public class DeleteMaterialCommandValidator : AbstractValidator<DeleteMaterialCommand>
{
    public DeleteMaterialCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.")
            .Must(value => Guid.TryParse(value.ToString(), out _)).WithMessage("Id is not valid.");
    }
}
