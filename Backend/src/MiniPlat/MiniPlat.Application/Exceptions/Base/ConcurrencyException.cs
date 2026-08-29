namespace BuildingBlocks.Application.Exceptions;

/// <summary>
/// The caller's copy was out of date - someone else changed the row first. Distinct from a
/// validation failure: the request was fine, the world moved.
/// </summary>
public class ConcurrencyException(string message) : Exception(message);
