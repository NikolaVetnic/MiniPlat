const Highlight = ({ color = "#5bc0de", textColor = "#fff", children }) => (
  <span
    style={{
      backgroundColor: color,
      color: textColor,
      padding: "0.15rem 0.5rem",
      borderRadius: "0.75rem",
      fontSize: "0.85em",
      fontWeight: "bold",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

export default Highlight;
