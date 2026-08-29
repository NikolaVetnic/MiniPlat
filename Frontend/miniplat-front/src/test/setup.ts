import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Without globals: true, Testing Library does not register its own cleanup, and two
// render() calls in one file leave both trees in the document.
afterEach(() => {
  cleanup();
});
