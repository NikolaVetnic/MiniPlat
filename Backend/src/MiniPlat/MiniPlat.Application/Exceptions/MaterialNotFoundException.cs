namespace MiniPlat.Application.Exceptions;

public class MaterialNotFoundException(string materialId) : NotFoundException("Material", materialId);
