using MiniPlat.Domain.Models;
using MiniPlat.Domain.ValueObjects;

namespace MiniPlat.Api.Controllers.Topics;

public record CreateTopicResponse(TopicId TopicId);

public record GetTopicByIdResponse(Topic Topic);
