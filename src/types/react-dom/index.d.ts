import type * as React from "react";

/**
 * Minimal local types for `react-dom` so CI type-checks pass
 * without installing `@types/react-dom`. Runtime is unchanged.
 */
declare module "react-dom" {
  export function createPortal(
    children: React.ReactNode,
    container: Element | DocumentFragment,
    key?: null | string
  ): React.ReactPortal;
}
