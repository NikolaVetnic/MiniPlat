using MiniPlat.Application.Data.Abstractions;
using MiniPlat.Application.Entities.Subjects;
using MiniPlat.Application.Entities.Subjects.Queries.ListSubjectsByUserId;
using MiniPlat.Application.Pagination;

namespace MiniPlat.UnitTests.Application.Subjects;

public class ListSubjectsByUserIdHandlerTests
{
    private readonly ISubjectsRepository _subjects = Substitute.For<ISubjectsRepository>();

    private ListSubjectsByUserIdHandler Handler(FakeCurrentUser user) => new(user, _subjects);

    private void Returns(List<Subject> subjects, long totalCount) =>
        _subjects.ListByUsernameAsync(Arg.Any<SubjectViewer>(), Arg.Any<string>(), Arg.Any<int>(), Arg.Any<int>(),
                Arg.Any<CancellationToken>())
            .Returns((subjects, totalCount));

    private Task<ListSubjectsByUserIdResult> List(FakeCurrentUser user, int pageIndex = 0, int pageSize = 10) =>
        Handler(user).Handle(new ListSubjectsByUserIdQuery(new PaginationRequest(pageIndex, pageSize)),
            CancellationToken.None);

    [Fact]
    public async Task The_signed_in_username_is_the_one_the_query_filters_on()
    {
        Returns([], 0);

        await List(FakeCurrentUser.Named("ana"));

        await _subjects.Received(1).ListByUsernameAsync(
            Arg.Any<SubjectViewer>(), "ana", Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// The endpoint is behind authentication, so a caller with no username here means the token
    /// was accepted without one - a broken assumption rather than a bad request.
    /// </summary>
    [Fact]
    public async Task A_caller_with_no_username_is_a_broken_assumption_and_not_an_empty_list()
    {
        Returns([], 0);

        await Assert.ThrowsAsync<InvalidOperationException>(() => List(FakeCurrentUser.Anonymous()));
    }

    [Fact]
    public async Task An_out_of_range_page_is_clamped_before_the_query_runs()
    {
        Returns([], 0);

        var result = await List(FakeCurrentUser.Named("ana"), pageIndex: -1, pageSize: 0);

        await _subjects.Received(1).ListByUsernameAsync(
            Arg.Any<SubjectViewer>(), "ana", 0, 1, Arg.Any<CancellationToken>());
        Assert.Equal(0, result.Subjects.PageIndex);
        Assert.Equal(1, result.Subjects.PageSize);
    }

    /// <summary>
    /// This is the lecturer's own dashboard, so their hidden topics have to survive the trip.
    /// </summary>
    [Fact]
    public async Task A_lecturer_sees_their_own_hidden_topics()
    {
        Returns([Some.Subject(lecturer: "ana", topics: [Some.Topic(), Some.Topic(isHidden: true)])], 1);

        var result = await List(FakeCurrentUser.Named("ana"));

        Assert.Equal(2, result.Subjects.Data.Single().Topics.Count);
    }

    [Fact]
    public async Task The_total_the_repository_counted_is_carried_through()
    {
        Returns([Some.Subject(lecturer: "ana")], totalCount: 3);

        var result = await List(FakeCurrentUser.Named("ana"));

        Assert.Equal(3, result.Subjects.Count);
    }
}
