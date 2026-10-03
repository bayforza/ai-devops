/** Runtime-agnostic tool result shape (Cursor SDK / MCP / plain string). */
export type ToolTextResult =
  | string
  | {
      content: Array<{ type: "text"; text: string }>;
      isError: true;
    };
