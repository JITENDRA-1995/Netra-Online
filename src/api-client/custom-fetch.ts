export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

export type ErrorType<T = unknown> = ApiError<T>;

export type BodyType<T> = T;

export type AuthTokenGetter = () => Promise<string | null> | string | null;

const NO_BODY_STATUS = new Set([204, 205, 304]);
const DEFAULT_JSON_ACCEPT = "application/json, application/problem+json";

// ---------------------------------------------------------------------------
// Module-level configuration
// ---------------------------------------------------------------------------

let _baseUrl: string | null = null;
let _authTokenGetter: AuthTokenGetter | null = null;

/**
 * Set a base URL that is prepended to every relative request URL
 * (i.e. paths that start with `/`).
 *
 * Useful for Expo bundles that need to call a remote API server.
 * Pass `null` to clear the base URL.
 */
export function setBaseUrl(url: string | null): void {
  _baseUrl = url ? url.replace(/\/+$/, "") : null;
}

/**
 * Register a getter that supplies a bearer auth token.  Before every fetch
 * the getter is invoked; when it returns a non-null string, an
 * `Authorization: Bearer <token>` header is attached to the request.
 *
 * Useful for Expo bundles making token-gated API calls.
 * Pass `null` to clear the getter.
 *
 * NOTE: This function should never be used in web applications where session
 * token cookies are automatically associated with API calls by the browser.
 */
export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  _authTokenGetter = getter;
}

function isRequest(input: RequestInfo | URL): input is Request {
  return typeof Request !== "undefined" && input instanceof Request;
}

function resolveMethod(input: RequestInfo | URL, explicitMethod?: string): string {
  if (explicitMethod) return explicitMethod.toUpperCase();
  if (isRequest(input)) return input.method.toUpperCase();
  return "GET";
}

// Use loose check for URL — some runtimes (e.g. React Native) polyfill URL
// differently, so `instanceof URL` can fail.
function isUrl(input: RequestInfo | URL): input is URL {
  return typeof URL !== "undefined" && input instanceof URL;
}

function applyBaseUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (!_baseUrl) return input;
  const url = resolveUrl(input);
  // Only prepend to relative paths (starting with /)
  if (!url.startsWith("/")) return input;

  const absolute = `${_baseUrl}${url}`;
  if (typeof input === "string") return absolute;
  if (isUrl(input)) return new URL(absolute);
  return new Request(absolute, input as Request);
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (isUrl(input)) return input.toString();
  return input.url;
}

function mergeHeaders(...sources: Array<HeadersInit | undefined>): Headers {
  const headers = new Headers();

  for (const source of sources) {
    if (!source) continue;
    new Headers(source).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
}

function getMediaType(headers: Headers): string | null {
  const value = headers.get("content-type");
  return value ? value.split(";", 1)[0].trim().toLowerCase() : null;
}

// Check for JSON media type
function isJsonMediaType(mediaType: string | null): boolean {
  return mediaType === "application/json" || Boolean(mediaType?.endsWith("+json"));
}

function isTextMediaType(mediaType: string | null): boolean {
  return Boolean(
    mediaType &&
      (mediaType.startsWith("text/") ||
        mediaType === "application/xml" ||
        mediaType === "text/xml" ||
        mediaType.endsWith("+xml") ||
        mediaType === "application/x-www-form-urlencoded"),
  );
}

function hasNoBody(response: Response, method: string): boolean {
  if (method === "HEAD") return true;
  if (NO_BODY_STATUS.has(response.status)) return true;
  if (response.headers.get("content-length") === "0") return true;
  if (response.body === null) return true;
  return false;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function looksLikeJson(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function getStringField(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const candidate = (value as Record<string, unknown>)[key];
  if (typeof candidate !== "string") return undefined;

  const trimmed = candidate.trim();
  return trimmed === "" ? undefined : trimmed;
}

function truncate(text: string, maxLength = 300): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function buildErrorMessage(response: Response, data: unknown): string {
  const prefix = `HTTP ${response.status} ${response.statusText}`;

  if (typeof data === "string") {
    const text = data.trim();
    return text ? `${prefix}: ${truncate(text)}` : prefix;
  }

  const title = getStringField(data, "title");
  const detail = getStringField(data, "detail");
  const message =
    getStringField(data, "message") ??
    getStringField(data, "error_description") ??
    getStringField(data, "error");

  if (title && detail) return `${prefix}: ${title} — ${detail}`;
  if (detail) return `${prefix}: ${detail}`;
  if (message) return `${prefix}: ${message}`;
  if (title) return `${prefix}: ${title}`;

  return prefix;
}

export class ApiError<T = unknown> extends Error {
  readonly name = "ApiError";
  readonly status: number;
  readonly statusText: string;
  readonly data: T | null;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;

  constructor(
    response: Response,
    data: T | null,
    requestInfo: { method: string; url: string },
  ) {
    super(buildErrorMessage(response, data));
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.data = data;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
  }
}

export class ResponseParseError extends Error {
  readonly name = "ResponseParseError";
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;
  readonly rawBody: string;
  readonly cause: unknown;

  constructor(
    response: Response,
    rawBody: string,
    cause: unknown,
    requestInfo: { method: string; url: string },
  ) {
    super(
      `Failed to parse response from ${requestInfo.method} ${response.url || requestInfo.url} ` +
        `(${response.status} ${response.statusText}) as JSON`,
    );
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
    this.rawBody = rawBody;
    this.cause = cause;
  }
}

async function parseJsonBody(
  response: Response,
  requestInfo: { method: string; url: string },
): Promise<unknown> {
  const raw = await response.text();
  const normalized = stripBom(raw);

  if (normalized.trim() === "") {
    return null;
  }

  try {
    return JSON.parse(normalized);
  } catch (cause) {
    throw new ResponseParseError(response, raw, cause, requestInfo);
  }
}

async function parseErrorBody(response: Response, method: string): Promise<unknown> {
  if (hasNoBody(response, method)) {
    return null;
  }

  const mediaType = getMediaType(response.headers);

  if (mediaType && !isJsonMediaType(mediaType) && !isTextMediaType(mediaType)) {
    return typeof response.blob === "function" ? response.blob() : response.text();
  }

  const raw = await response.text();
  const normalized = stripBom(raw);
  const trimmed = normalized.trim();

  if (trimmed === "") {
    return null;
  }

  if (isJsonMediaType(mediaType) || looksLikeJson(normalized)) {
    try {
      return JSON.parse(normalized);
    } catch {
      return raw;
    }
  }

  return raw;
}

function inferResponseType(response: Response): "json" | "text" | "blob" {
  const mediaType = getMediaType(response.headers);

  if (isJsonMediaType(mediaType)) return "json";
  if (isTextMediaType(mediaType) || mediaType == null) return "text";
  return "blob";
}

async function parseSuccessBody(
  response: Response,
  responseType: "json" | "text" | "blob" | "auto",
  requestInfo: { method: string; url: string },
): Promise<unknown> {
  if (hasNoBody(response, requestInfo.method)) {
    return null;
  }

  const effectiveType =
    responseType === "auto" ? inferResponseType(response) : responseType;

  switch (effectiveType) {
    case "json":
      return parseJsonBody(response, requestInfo);

    case "text": {
      const text = await response.text();
      return text === "" ? null : text;
    }

    case "blob":
      if (typeof response.blob !== "function") {
        throw new TypeError(
          "Blob responses are not supported in this runtime. " +
            "Use responseType \"json\" or \"text\" instead.",
        );
      }
      return response.blob();
  }
}

async function handleMockRequest(url: string, options: any): Promise<any> {
  let state = localStorage.getItem("netra_db_state");
  if (!state) {
    const initialState = {
      clients: [
        {
          id: 1,
          name: "Acme Corp",
          email: "contact@acme.com",
          company: "Acme Corporation",
          phone: "123-456-7890",
          industry: "Technology",
          totalProjects: 3,
          totalRevenue: 45000,
          createdAt: "2026-01-10T12:00:00Z",
        },
        {
          id: 2,
          name: "Globex Corp",
          email: "billing@globex.net",
          company: "Globex Corporation",
          phone: "987-654-3210",
          industry: "Manufacturing",
          totalProjects: 1,
          totalRevenue: 12500,
          createdAt: "2026-02-15T12:00:00Z",
        },
        {
          id: 3,
          name: "Initech",
          email: "support@initech.com",
          company: "Initech LLC",
          phone: "555-0199",
          industry: "Finance",
          totalProjects: 2,
          totalRevenue: 28000,
          createdAt: "2026-03-01T12:00:00Z",
        },
        {
          id: 4,
          name: "Umbrella Corp",
          email: "info@umbrella.com",
          company: "Umbrella Pharma",
          phone: "555-6666",
          industry: "Healthcare",
          totalProjects: 1,
          totalRevenue: 80000,
          createdAt: "2026-04-05T12:00:00Z",
        },
        {
          id: 5,
          name: "Wayne Enterprises",
          email: "bruce@wayne.com",
          company: "Wayne Enterprises",
          phone: "555-1939",
          industry: "Defense",
          totalProjects: 4,
          totalRevenue: 150000,
          createdAt: "2026-04-20T12:00:00Z",
        }
      ],
      projects: [
        {
          id: 1,
          name: "Brand Identity Redesign",
          clientId: 1,
          clientName: "Acme Corp",
          description: "Complete visual rebranding and identity guidelines.",
          status: "active",
          category: "branding",
          deadline: "2026-06-30",
          budget: 15000,
          progress: 65,
          createdAt: "2026-03-10T12:00:00Z",
        },
        {
          id: 2,
          name: "High-Fidelity Mobile UI",
          clientId: 1,
          clientName: "Acme Corp",
          description: "UX design and wireframing for the customer facing iOS/Android app.",
          status: "active",
          category: "web",
          deadline: "2026-07-15",
          budget: 18000,
          progress: 40,
          createdAt: "2026-03-20T12:00:00Z",
        },
        {
          id: 3,
          name: "Netra Nexus Dashboard",
          clientId: 3,
          clientName: "Initech",
          description: "Dashboard interface design and integration.",
          status: "active",
          category: "web",
          deadline: "2026-06-15",
          budget: 20000,
          progress: 85,
          createdAt: "2026-04-01T12:00:00Z",
        },
        {
          id: 4,
          name: "3D Product Renders",
          clientId: 2,
          clientName: "Globex Corp",
          description: "Photorealistic 3D product catalog packaging animations.",
          status: "completed",
          category: "motion",
          deadline: "2026-05-01",
          budget: 12500,
          progress: 100,
          createdAt: "2026-02-18T12:00:00Z",
        },
        {
          id: 5,
          name: "Enterprise Web Portal",
          clientId: 5,
          clientName: "Wayne Enterprises",
          description: "Responsive website design and CMS integration.",
          status: "active",
          category: "web",
          deadline: "2026-08-30",
          budget: 50000,
          progress: 15,
          createdAt: "2026-05-01T12:00:00Z",
        }
      ],
      invoices: [
        {
          id: 1,
          invoiceNumber: "INV-0001",
          clientId: 2,
          projectId: 4,
          amount: 12500,
          status: "paid",
          dueDate: "2026-03-18",
          paidAt: "2026-03-05",
          createdAt: "2026-02-18T12:00:00Z",
        },
        {
          id: 2,
          invoiceNumber: "INV-0002",
          clientId: 1,
          projectId: 1,
          amount: 5000,
          status: "paid",
          dueDate: "2026-04-10",
          paidAt: "2026-04-02",
          createdAt: "2026-03-10T12:00:00Z",
        },
        {
          id: 3,
          invoiceNumber: "INV-0003",
          clientId: 3,
          projectId: 3,
          amount: 10000,
          status: "paid",
          dueDate: "2026-05-01",
          paidAt: "2026-04-28",
          createdAt: "2026-04-01T12:00:00Z",
        },
        {
          id: 4,
          invoiceNumber: "INV-0004",
          clientId: 1,
          projectId: 1,
          amount: 10000,
          status: "sent",
          dueDate: "2026-06-30",
          paidAt: null,
          createdAt: "2026-05-10T12:00:00Z",
        },
        {
          id: 5,
          invoiceNumber: "INV-0005",
          clientId: 5,
          projectId: 5,
          amount: 15000,
          status: "draft",
          dueDate: "2026-08-30",
          paidAt: null,
          createdAt: "2026-05-20T12:00:00Z",
        }
      ],
      activity: [
        {
          id: 1,
          type: "client_added",
          description: 'New client "Wayne Enterprises" added',
          entityType: "client",
          entityId: 5,
          createdAt: "2026-05-22T12:00:00Z",
        },
        {
          id: 2,
          type: "invoice_paid",
          description: 'Invoice INV-0003 marked as paid',
          entityType: "invoice",
          entityId: 3,
          createdAt: "2026-05-21T15:30:00Z",
        },
        {
          id: 3,
          type: "client_added",
          description: 'New client "Acme Corporation" added',
          entityType: "client",
          entityId: 1,
          createdAt: "2026-05-20T09:15:00Z",
        }
      ]
    };
    localStorage.setItem("netra_db_state", JSON.stringify(initialState));
    state = JSON.stringify(initialState);
  }
  const db = JSON.parse(state);
  const save = () => localStorage.setItem("netra_db_state", JSON.stringify(db));

  const cleanUrl = url.split("?")[0].replace(/\/$/, "");
  const method = (options.method || "GET").toUpperCase();

  // 1. GET /api/dashboard/stats
  if (cleanUrl.endsWith("/api/dashboard/stats") && method === "GET") {
    const activeProjects = db.projects.filter((p: any) => p.status === "active").length;
    const totalRevenue = db.invoices
      .filter((i: any) => i.status === "paid")
      .reduce((sum: number, i: any) => sum + Number(i.amount), 0);
    const pendingInvoices = db.invoices
      .filter((i: any) => i.status === "sent" || i.status === "draft")
      .reduce((sum: number, i: any) => sum + Number(i.amount), 0);
    const overdueInvoicesCount = db.invoices.filter((i: any) => i.status === "overdue").length;

    return {
      totalRevenue,
      activeProjects,
      totalClients: db.clients.length,
      pendingInvoices,
      revenueGrowth: 12.5,
      projectsThisMonth: 1,
      overdueInvoicesCount,
      teamCount: 3,
    };
  }

  // 2. GET /api/dashboard/revenue-trend
  if (cleanUrl.endsWith("/api/dashboard/revenue-trend") && method === "GET") {
    const months = ["Jun 2025", "Jul 2025", "Aug 2025", "Sep 2025", "Oct 2025", "Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026"];
    return months.map((month, idx) => ({
      month,
      revenue: [15000, 18000, 12000, 24000, 31000, 28000, 45000, 32000, 29000, 38000, 42000, 27500][idx],
      expenses: [8000, 9000, 6000, 11000, 14000, 13000, 19000, 15000, 13000, 16000, 17000, 12000][idx]
    }));
  }

  // 3. GET /api/dashboard/project-breakdown
  if (cleanUrl.endsWith("/api/dashboard/project-breakdown") && method === "GET") {
    const counts: Record<string, number> = {};
    const values: Record<string, number> = {};
    for (const p of db.projects) {
      counts[p.category] = (counts[p.category] || 0) + 1;
      values[p.category] = (values[p.category] || 0) + Number(p.budget);
    }
    return Object.entries(counts).map(([category, count]) => ({
      category,
      count,
      value: values[category]
    }));
  }

  // 4. GET /api/dashboard/recent-activity
  if (cleanUrl.endsWith("/api/dashboard/recent-activity") && method === "GET") {
    return db.activity.slice(0, 10);
  }

  // 5. GET /api/clients
  if (cleanUrl.endsWith("/api/clients") && method === "GET") {
    return db.clients;
  }

  // 6. POST /api/clients
  if (cleanUrl.endsWith("/api/clients") && method === "POST") {
    const input = JSON.parse(options.body);
    const newClient = {
      id: db.clients.length > 0 ? Math.max(...db.clients.map((c: any) => c.id)) + 1 : 1,
      name: input.name,
      email: input.email,
      company: input.company,
      phone: input.phone || null,
      industry: input.industry || "Technology",
      totalProjects: 0,
      totalRevenue: 0,
      createdAt: new Date().toISOString()
    };
    db.clients.push(newClient);
    save();
    return newClient;
  }

  // 7. PATCH /api/clients/:id
  if (/\/api\/clients\/\d+$/.test(cleanUrl) && method === "PATCH") {
    const id = Number(cleanUrl.split("/").pop());
    const input = JSON.parse(options.body);
    const clientIdx = db.clients.findIndex((c: any) => c.id === id);
    if (clientIdx !== -1) {
      db.clients[clientIdx] = { ...db.clients[clientIdx], ...input };
      save();
      return db.clients[clientIdx];
    }
  }

  // 8. DELETE /api/clients/:id
  if (/\/api\/clients\/\d+$/.test(cleanUrl) && method === "DELETE") {
    const id = Number(cleanUrl.split("/").pop());
    db.clients = db.clients.filter((c: any) => c.id !== id);
    save();
    return { success: true };
  }

  // 9. GET /api/projects
  if (cleanUrl.endsWith("/api/projects") && method === "GET") {
    return db.projects;
  }

  // 10. POST /api/projects
  if (cleanUrl.endsWith("/api/projects") && method === "POST") {
    const input = JSON.parse(options.body);
    const client = db.clients.find((c: any) => c.id === Number(input.clientId));
    const newProject = {
      id: db.projects.length > 0 ? Math.max(...db.projects.map((p: any) => p.id)) + 1 : 1,
      name: input.name,
      description: input.description || null,
      status: input.status || "active",
      category: input.category || "branding",
      clientId: Number(input.clientId),
      clientName: client ? client.name : "Unknown",
      deadline: input.deadline,
      budget: Number(input.budget),
      progress: Number(input.progress || 0),
      createdAt: new Date().toISOString()
    };
    db.projects.push(newProject);
    if (client) {
      client.totalProjects = (client.totalProjects || 0) + 1;
    }
    save();
    return newProject;
  }

  // 11. PATCH /api/projects/:id
  if (/\/api\/projects\/\d+$/.test(cleanUrl) && method === "PATCH") {
    const id = Number(cleanUrl.split("/").pop());
    const input = JSON.parse(options.body);
    const projectIdx = db.projects.findIndex((p: any) => p.id === id);
    if (projectIdx !== -1) {
      db.projects[projectIdx] = { ...db.projects[projectIdx], ...input };
      save();
      return db.projects[projectIdx];
    }
  }

  // 12. DELETE /api/projects/:id
  if (/\/api\/projects\/\d+$/.test(cleanUrl) && method === "DELETE") {
    const id = Number(cleanUrl.split("/").pop());
    db.projects = db.projects.filter((p: any) => p.id !== id);
    save();
    return { success: true };
  }

  // 13. GET /api/invoices
  if (cleanUrl.endsWith("/api/invoices") && method === "GET") {
    return db.invoices;
  }

  // 14. POST /api/invoices
  if (cleanUrl.endsWith("/api/invoices") && method === "POST") {
    const input = JSON.parse(options.body);
    const client = db.clients.find((c: any) => c.id === Number(input.clientId));
    const project = db.projects.find((p: any) => p.id === Number(input.projectId));
    const nextNum = db.invoices.length > 0 ? Math.max(...db.invoices.map((i: any) => {
      const match = i.invoiceNumber.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    })) + 1 : 1;
    const newInvoice = {
      id: db.invoices.length > 0 ? Math.max(...db.invoices.map((i: any) => i.id)) + 1 : 1,
      invoiceNumber: `INV-${String(nextNum).padStart(4, '0')}`,
      clientId: Number(input.clientId),
      clientName: client ? client.company : "Unknown",
      projectId: input.projectId ? Number(input.projectId) : null,
      projectName: project ? project.name : null,
      amount: Number(input.amount),
      status: input.status || "draft",
      dueDate: input.dueDate,
      paidAt: input.status === "paid" ? new Date().toISOString().split("T")[0] : null,
      createdAt: new Date().toISOString()
    };
    db.invoices.push(newInvoice);
    if (newInvoice.status === "paid" && client) {
      client.totalRevenue = Number(client.totalRevenue || 0) + Number(input.amount);
    }
    // Add activity log
    db.activity.unshift({
      id: db.activity.length > 0 ? Math.max(...db.activity.map((a: any) => a.id)) + 1 : 1,
      type: "invoice_sent",
      description: `Invoice ${newInvoice.invoiceNumber} created for ${newInvoice.clientName}`,
      entityType: "invoice",
      entityId: newInvoice.id,
      createdAt: new Date().toISOString()
    });
    save();
    return newInvoice;
  }

  // 15. PATCH /api/invoices/:id
  if (/\/api\/invoices\/\d+$/.test(cleanUrl) && method === "PATCH") {
    const id = Number(cleanUrl.split("/").pop());
    const input = JSON.parse(options.body);
    const invoiceIdx = db.invoices.findIndex((i: any) => i.id === id);
    if (invoiceIdx !== -1) {
      const oldInvoice = db.invoices[invoiceIdx];
      db.invoices[invoiceIdx] = { ...oldInvoice, ...input };
      
      // If status changed to paid, update client total revenue
      if (input.status === "paid" && oldInvoice.status !== "paid") {
        const client = db.clients.find((c: any) => c.id === oldInvoice.clientId);
        if (client) {
          client.totalRevenue = Number(client.totalRevenue || 0) + Number(oldInvoice.amount);
        }
        // Add activity
        db.activity.unshift({
          id: db.activity.length > 0 ? Math.max(...db.activity.map((a: any) => a.id)) + 1 : 1,
          type: "invoice_paid",
          description: `Invoice ${oldInvoice.invoiceNumber} marked as paid`,
          entityType: "invoice",
          entityId: oldInvoice.id,
          createdAt: new Date().toISOString()
        });
      }
      save();
      return db.invoices[invoiceIdx];
    }
  }

  return null;
}

export async function customFetch<T = unknown>(
  input: RequestInfo | URL,
  options: CustomFetchOptions = {},
): Promise<T> {
  const urlStr = resolveUrl(input);

  // 1. Detect if we are in production (e.g. Vercel) and the request is to a relative API path.
  // In production, there is no hosted Express API, so relative fetches to /api will fail or hang.
  // We instantly bypass fetch and use the client-side localStorage mock database.
  const isLocalhost = typeof window !== "undefined" && (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "[::1]" ||
    window.location.hostname === ""
  );
  const isRelativeApi = urlStr.startsWith("/api") || urlStr.startsWith("/");

  if (typeof window !== "undefined" && !isLocalhost && isRelativeApi) {
    console.info("Production environment (Vercel) detected. Intercepting and serving instantly via client-side database mock:", urlStr);
    const mockRes = await handleMockRequest(urlStr, options);
    if (mockRes !== null) {
      return mockRes as T;
    }
  }

  try {
    const targetInput = applyBaseUrl(input);
    const { responseType = "auto", headers: headersInit, ...init } = options;

    const method = resolveMethod(targetInput, init.method);

    if (init.body != null && (method === "GET" || method === "HEAD")) {
      throw new TypeError(`customFetch: ${method} requests cannot have a body.`);
    }

    const headers = mergeHeaders(isRequest(targetInput) ? targetInput.headers : undefined, headersInit);

    if (
      typeof init.body === "string" &&
      !headers.has("content-type") &&
      looksLikeJson(init.body)
    ) {
      headers.set("content-type", "application/json");
    }

    if (responseType === "json" && !headers.has("accept")) {
      headers.set("accept", DEFAULT_JSON_ACCEPT);
    }

    if (_authTokenGetter && !headers.has("authorization")) {
      const token = await _authTokenGetter();
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
    }

    const requestInfo = { method, url: resolveUrl(targetInput) };

    // 2. Set a 1500ms timeout on the network fetch to prevent hanging in case of offline local server
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 1500) : null;

    let response: Response;
    try {
      response = await fetch(targetInput, { 
        ...init, 
        method, 
        headers,
        signal: controller ? controller.signal : undefined
      });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorData = await parseErrorBody(response, method);
      throw new ApiError(response, errorData, requestInfo);
    }

    return (await parseSuccessBody(response, responseType, requestInfo)) as T;
  } catch (error) {
    if (typeof window !== "undefined" && (
      error instanceof TypeError || 
      String(error).includes("fetch") || 
      String(error).includes("Failed to fetch") || 
      String(error).includes("NetworkError") ||
      String(error).includes("Failed to execute 'fetch'") ||
      String(error).includes("aborted") ||
      (error && (error as any).name === "AbortError")
    )) {
      console.warn("API connection failed or timed out. falling back to client-side localStorage mock database.", error);
      const mockRes = await handleMockRequest(urlStr, options);
      if (mockRes !== null) {
        return mockRes as T;
      }
    }
    throw error;
  }
}
