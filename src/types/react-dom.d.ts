// src/types/react-dom.d.ts
import type * as React from "react";

/**
 * Minimal type shim so TS can typecheck `createPortal` on CI.
 * This avoids needing @types/react-dom and does not change runtime.
 */
declare module "react-dom" {
  export function createPortal(
    children: React.ReactNode,
    container: Element | DocumentFragment,
    key?: null | string
  ): React.ReactPortal;
}
