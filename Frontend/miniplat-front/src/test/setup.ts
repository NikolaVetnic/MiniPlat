import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Uten globals: true registrerer ikke Testing Library sin egen opprydding seg, og
// to render() i samme fil etterlater begge trærne i dokumentet.
afterEach(() => {
  cleanup();
});
