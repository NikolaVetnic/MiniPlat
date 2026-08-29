using MiniPlat.Application.Pagination;

namespace MiniPlat.UnitTests.Application.Pagination;

public class PaginationRequestTests
{
    [Fact]
    public void A_request_that_is_already_in_range_is_left_alone()
    {
        var normalized = new PaginationRequest(2, 25).Normalized();

        Assert.Equal(2, normalized.PageIndex);
        Assert.Equal(25, normalized.PageSize);
    }

    [Theory]
    [InlineData(-1, 0)]
    [InlineData(-1000, 0)]
    [InlineData(0, 0)]
    public void A_negative_page_index_is_pulled_up_to_the_first_page(int given, int expected)
    {
        Assert.Equal(expected, new PaginationRequest(given, 10).Normalized().PageIndex);
    }

    /// <summary>
    /// Clamped rather than rejected, because these are anonymous read endpoints: a zero or
    /// negative page size reaching EF is a database error and a 500, not something a caller
    /// can act on.
    /// </summary>
    [Theory]
    [InlineData(0, 1)]
    [InlineData(-5, 1)]
    [InlineData(1, 1)]
    [InlineData(PaginationRequest.MaxPageSize, PaginationRequest.MaxPageSize)]
    [InlineData(PaginationRequest.MaxPageSize + 1, PaginationRequest.MaxPageSize)]
    [InlineData(int.MaxValue, PaginationRequest.MaxPageSize)]
    public void A_page_size_outside_the_allowed_range_is_clamped(int given, int expected)
    {
        Assert.Equal(expected, new PaginationRequest(0, given).Normalized().PageSize);
    }

    [Fact]
    public void Normalizing_returns_a_new_request_and_leaves_the_original_as_it_was()
    {
        var original = new PaginationRequest(-3, 99_999);

        var normalized = original.Normalized();

        Assert.NotSame(original, normalized);
        Assert.Equal(-3, original.PageIndex);
        Assert.Equal(99_999, original.PageSize);
    }

    /// <summary>The frontend loads the whole catalogue in one request.</summary>
    [Fact]
    public void The_default_page_is_the_first_one_and_holds_ten_items()
    {
        var request = new PaginationRequest();

        Assert.Equal(0, request.PageIndex);
        Assert.Equal(10, request.PageSize);
        Assert.True(PaginationRequest.MaxPageSize >= 1000);
    }
}
