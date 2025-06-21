const YouTubeEmbed = ({
  videoId,
  title = "Embedded YouTube",
  maxWidth = "800px",
}) => (
  <div style={{ width: "100%", maxWidth, margin: "2rem auto" }}>
    <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: "none",
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media"
        allowFullScreen
      />
    </div>
  </div>
);

export default YouTubeEmbed; // ✅ This is required
