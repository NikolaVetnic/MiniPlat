using FluentValidation;
using MiniPlat.Application.Cqrs;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Application.Entities.Materials.Commands.CreateMaterial;

public class CreateMaterialCommand : ICommand<CreateMaterialResult>
{
    public string Description { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
}

public record CreateMaterialResult(MaterialId MaterialId);

public class CreateMaterialCommandValidator : AbstractValidator<CreateMaterialCommand>
{
    public CreateMaterialCommandValidator()
    {
        // ToDo: Add remaining CreateMaterial command validators
    }
}
