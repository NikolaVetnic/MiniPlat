using MiniPlat.Application.Pagination;
using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Api.Controllers.Topics;

public record CreateTopicResponse(TopicId TopicId);

public record GetTopicByIdResponse(Topic Topic);

public record ListTopicsResponse(PaginatedResult<Topic> Topics);

public record UpdateTopicResponse(Topic Topic);

public record DeleteTopicResponse(bool IsTopicDeleted);
