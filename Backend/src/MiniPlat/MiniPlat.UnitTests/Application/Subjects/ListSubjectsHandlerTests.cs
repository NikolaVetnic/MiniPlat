using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Entities.Subjects;
using MiniPlat.Application.Entities.Subjects.Queries.ListSubjects;
using MiniPlat.Application.Pagination;

namespace MiniPlat.UnitTests.Application.Subjects;

public class ListSubjectsHandlerTests
{
    private readonly ISubjectsRepository _subjects = Substitute.For<ISubjectsRepository>();

    private ListSubjectsHandler Handler(FakeCurrentUser user) => new(user, _subjects);

    private void Returns(List<Subject> subjects, long totalCount) =>
        _subjects.ListAsync(Arg.Any<SubjectViewer>(), Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>())
            .Returns((subjects, totalCount));

    private Task<ListSubjectsResult> List(FakeCurrentUser user, int pageIndex = 0, int pageSize = 10) =>
        Handler(user).Handle(new ListSubjectsQuery(new PaginationRequest(pageIndex, pageSize)), CancellationToken.None);

    [Fact]
    public async Task The_page_is_returned_with_the_total_the_repository_counted()
    {
        Returns([Some.Subject(), Some.Subject()], totalCount: 57);

        var result = await List(FakeCurrentUser.Anonymous(), pageIndex: 2, pageSize: 25);

        Assert.Equal(2, result.Subjects.PageIndex);
        Assert.Equal(25, result.Subjects.PageSize);
        Assert.Equal(57, result.Subjects.Count);
        Assert.Equal(2, result.Subjects.Data.Count());
    }

    /// <summary>
    /// Clamped before the repository sees it, so a hostile page size never reaches EF as a
    /// database error, and the page the caller is told they received is the one they asked for.
    /// </summary>
    [Fact]
    public async Task An_out_of_range_page_is_clamped_before_the_query_runs()
    {
        Returns([], totalCount: 0);

        var result = await List(FakeCurrentUser.Anonymous(), pageIndex: -4, pageSize: 100_000);

        await _subjects.Received(1).ListAsync(
            Arg.Any<SubjectViewer>(), 0, PaginationRequest.MaxPageSize, Arg.Any<CancellationToken>());
        Assert.Equal(0, result.Subjects.PageIndex);
        Assert.Equal(PaginationRequest.MaxPageSize, result.Subjects.PageSize);
    }

    [Fact]
    public async Task The_caller_is_described_to_the_repository_so_the_database_does_the_filtering()
    {
        Returns([], totalCount: 0);

        await List(FakeCurrentUser.Admin("carol"));

        await _subjects.Received(1).ListAsync(
            Arg.Is<SubjectViewer>(viewer => viewer.Username == "carol" && viewer.IsAdmin),
            Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task A_student_receives_the_listing_with_hidden_topics_stripped()
    {
        Returns([Some.Subject(lecturer: "ana", topics: [Some.Topic(title: "Visible"), Some.Topic(isHidden: true)])], 1);

        var result = await List(FakeCurrentUser.Anonymous());

        Assert.Equal("Visible", result.Subjects.Data.Single().Topics.Single().Title);
    }

    [Fact]
    public async Task A_lecturer_receives_their_own_subjects_whole()
    {
        Returns([Some.Subject(lecturer: "ana", topics: [Some.Topic(), Some.Topic(isHidden: true)])], 1);

        var result = await List(FakeCurrentUser.Named("ana"));

        Assert.Equal(2, result.Subjects.Data.Single().Topics.Count);
    }

    [Fact]
    public async Task An_empty_page_is_returned_as_an_empty_page_and_not_as_an_error()
    {
        Returns([], totalCount: 0);

        var result = await List(FakeCurrentUser.Anonymous(), pageIndex: 99);

        Assert.Empty(result.Subjects.Data);
        Assert.Equal(0, result.Subjects.Count);
    }
}
