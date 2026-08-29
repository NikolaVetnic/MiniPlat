namespace MiniPlat.Application.Exceptions;

public class TopicNotFoundException(string topicId) : NotFoundException("Topic", topicId);
