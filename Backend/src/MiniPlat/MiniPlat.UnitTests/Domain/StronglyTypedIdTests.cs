using MiniPlat.Domain.Abstractions;

namespace MiniPlat.UnitTests.Domain;

public class StronglyTypedIdTests
{
    public static TheoryData<string, Func<Guid, StronglyTypedId>> Factories => new()
    {
        { nameof(SubjectId), guid => SubjectId.Of(guid) },
        { nameof(TopicId), guid => TopicId.Of(guid) },
        { nameof(MaterialId), guid => MaterialId.Of(guid) },
        { nameof(LecturerId), guid => LecturerId.Of(guid) }
    };

    [Theory]
    [MemberData(nameof(Factories))]
    public void Of_rejects_the_empty_guid(string name, Func<Guid, StronglyTypedId> of)
    {
        var exception = Assert.Throws<ArgumentException>(() => of(Guid.Empty));

        Assert.Contains(name, exception.Message);
        Assert.Equal("value", exception.ParamName);
    }

    [Theory]
    [MemberData(nameof(Factories))]
    public void Of_keeps_the_guid_it_was_given(string _, Func<Guid, StronglyTypedId> of)
    {
        var guid = Guid.NewGuid();

        var id = of(guid);

        Assert.Equal(guid, id.Value);
        Assert.Equal(guid.ToString(), id.ToString());
    }

    [Theory]
    [MemberData(nameof(Factories))]
    public void Two_ids_over_the_same_guid_are_equal(string _, Func<Guid, StronglyTypedId> of)
    {
        var guid = Guid.NewGuid();

        var left = of(guid);
        var right = of(guid);

        Assert.NotSame(left, right);
        Assert.Equal(left, right);
        Assert.Equal(left.GetHashCode(), right.GetHashCode());
    }

    [Fact]
    public void Ids_over_different_guids_are_not_equal()
    {
        Assert.NotEqual(SubjectId.Of(Guid.NewGuid()), SubjectId.Of(Guid.NewGuid()));
    }

    [Fact]
    public void Ids_of_different_types_are_never_equal_even_over_the_same_guid()
    {
        var guid = Guid.NewGuid();

        Assert.False(SubjectId.Of(guid).Equals(TopicId.Of(guid)));
        Assert.False(TopicId.Of(guid).Equals(MaterialId.Of(guid)));
    }

    [Fact]
    public void Equality_operator_compares_the_value_rather_than_the_reference()
    {
        var guid = Guid.NewGuid();

        Assert.True(SubjectId.Of(guid) == SubjectId.Of(guid));
        Assert.False(SubjectId.Of(guid) != SubjectId.Of(guid));
        Assert.True(SubjectId.Of(guid) != SubjectId.Of(Guid.NewGuid()));
    }

    [Fact]
    public void Equality_operator_handles_null_on_either_side()
    {
        SubjectId? missing = null;

        Assert.True(missing == null);
        Assert.False(SubjectId.Of(Guid.NewGuid()) == missing);
        Assert.True(SubjectId.Of(Guid.NewGuid()) != missing);
    }

    /// <summary>
    /// ReorderTopics compares the submitted ids against the subject's own through hash sets, so
    /// value equality has to reach GetHashCode and not only Equals.
    /// </summary>
    [Fact]
    public void A_hash_set_treats_equal_ids_as_one_entry()
    {
        var guid = Guid.NewGuid();

        var set = new HashSet<TopicId> { TopicId.Of(guid), TopicId.Of(guid) };

        Assert.Single(set);
        Assert.Contains(TopicId.Of(guid), set);
    }
}
