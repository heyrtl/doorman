export interface MarkdownPage {
  markdown: string;
  /** Use a body-bearing status, e.g. 200 or 404. */
  status?: number;
  headers?: HeadersInit;
}
export interface DoormanOptions {
  /** Return null for routes that should continue through the existing app. */
  resolve: (request: Request) => MarkdownPage | null | undefined | Promise<MarkdownPage | null | undefined>;
  /** Additional request header dimensions, e.g. Accept-Language. */
  vary?: string[];
}
export type Handler = (request: Request) => Response | Promise<Response>;
export function prefersMarkdown(accept: string | null | undefined): boolean;
export function mergeVary(headers: Headers, ...dimensions: string[]): void;
export function createDoorman(options: DoormanOptions): (request: Request, next: Handler) => Promise<Response>;
