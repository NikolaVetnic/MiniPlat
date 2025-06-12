using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Api.Controllers.Materials;

public record CreateMaterialResponse(MaterialId MaterialId);

public record GetMaterialByIdResponse(Material Material);
