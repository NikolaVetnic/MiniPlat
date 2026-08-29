namespace MiniPlat.Application.Pagination;

public record PaginationRequest(int PageIndex = 0, int PageSize = 10)
{
    /// <summary>Highest page size a caller may ask for. The frontend loads the whole catalogue in
    /// one request, so this has to stay well above the number of subjects the school runs.</summary>
    public const int MaxPageSize = 1000;

    /// <summary>
    /// Clamped rather than rejected: these are public read endpoints, and a negative page size
    /// reaching EF becomes a database error and a 500 rather than something the caller can act on.
    /// </summary>
    public PaginationRequest Normalized() => this with
    {
        PageIndex = Math.Max(0, PageIndex),
        PageSize = Math.Clamp(PageSize, 1, MaxPageSize)
    };
}
