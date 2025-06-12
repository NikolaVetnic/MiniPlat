using MiniPlat.Application.Cqrs;
using MiniPlat.Application.Pagination;
using MiniPlat.Domain.Models;

namespace MiniPlat.Application.Entities.Topics.Queries.ListTopics;

public record ListTopicsQuery(PaginationRequest PaginationRequest) : IQuery<ListTopicsResult>;

public record ListTopicsResult(PaginatedResult<Topic> Topics);
