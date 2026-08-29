import { createRoot } from "react-dom/client";

import AppWrapper from "./AppLayout";

const container = document.getElementById("root");

if (!container)
  throw new Error("Missing #root element - check index.html.");

createRoot(container).render(<AppWrapper />);
