"use client";

import clsx from "clsx";
import { useFormStatus } from "react-dom";
import {
  createWebhook,
  getWebhooks,
  getWebhookLogs,
  deleteWebhook,
  clearWebhookLogs,
  getDashboardAnalytics,
  type WebhookDefinition,
  type WebhookRequestLog
} from "./lib/actions";
import * as React from "react";
import { toast } from "sonner";
import {
  Terminal,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Code,
  Activity,
  Play,
  ChevronRight,
  ChevronDown,
  Bell,
  Mail,
  Zap,
  Globe
} from "lucide-react";

export default function Page() {
  const [state, dispatch] = React.useActionState(createWebhook, undefined);
  const [webhooks, setWebhooks] = React.useState<WebhookDefinition[]>([]);
  const [selectedSlug, setSelectedSlug] = React.useState<string>("");
  const [logs, setLogs] = React.useState<WebhookRequestLog[]>([]);
  const [analytics, setAnalytics] = React.useState({
    totalEndpoints: 0,
    totalLogs: 0,
    errors: 0,
    successes: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [loadingLogs, setLoadingLogs] = React.useState(false);
  const [expandedLogId, setExpandedLogId] = React.useState<string | null>(null);
  const [origin, setOrigin] = React.useState("http://localhost:3000");

  // Keep track of client origin for rendering trigger URLs
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Fetch all endpoints and summary stats
  const fetchDashboardData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [allWebhooks, stats] = await Promise.all([
        getWebhooks(),
        getDashboardAnalytics()
      ]);
      setWebhooks(allWebhooks);
      setAnalytics(stats);

      // Default select the first webhook if none selected
      if (allWebhooks.length > 0 && !selectedSlug) {
        setSelectedSlug(allWebhooks[0].slug);
      }
    } catch (e) {
      console.error("Failed to load dashboard data", e);
      toast.error("Failed to load webhooks dashboard");
    } finally {
      setLoading(false);
    }
  }, [selectedSlug]);

  // Load request logs for the selected webhook
  const fetchLogs = React.useCallback(async (slug: string) => {
    if (!slug) return;
    setLoadingLogs(true);
    try {
      const logList = await getWebhookLogs(slug);
      setLogs(logList);
    } catch (e) {
      console.error("Failed to load execution logs", e);
      toast.error("Failed to load request logs");
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  React.useEffect(() => {
    if (selectedSlug) {
      fetchLogs(selectedSlug);
    } else {
      setLogs([]);
    }
  }, [selectedSlug, fetchLogs]);

  // Listen to creation action updates
  React.useEffect(() => {
    if (!state) return;

    if ("error" in state) {
      toast.error(state.error);
    } else if ("data" in state) {
      toast.success(`Dynamic Webhook '${state.data.name}' configured successfully!`);
      setSelectedSlug(state.data.slug);
      fetchDashboardData();
    }
  }, [state, fetchDashboardData]);

  // Trigger simulated client-side test (Enhancement 3)
  const handleTestWebhook = async () => {
    if (!selectedSlug) return;
    const webhook = webhooks.find((w) => w.slug === selectedSlug);
    if (!webhook) return;

    const testUrl = `${origin}/api/webhooks/${selectedSlug}`;
    const testMethod = webhook.method === "ALL" ? "POST" : webhook.method;

    toast.promise(
      (async () => {
        const response = await fetch(testUrl, {
          method: testMethod,
          headers: {
            "Content-Type": "application/json",
            "X-Test-Sender": "Dynamic Webhooks Test Client"
          },
          body: testMethod !== "GET" ? JSON.stringify({
            test: true,
            message: "Simulated trigger payload from dashboard",
            timestamp: new Date().toISOString()
          }) : undefined
        });

        const text = await response.text();
        // Reload logs slightly after triggering
        setTimeout(() => {
          fetchLogs(selectedSlug);
          getDashboardAnalytics().then((stats) => setAnalytics(stats));
        }, 1000);

        return `Triggered successfully with Status: ${response.status}. Payload: ${text.substring(0, 50)}`;
      })(),
      {
        loading: "Dispatching simulation payload request to dynamic URL...",
        success: (data) => data,
        error: "Failed to dispatch test request"
      }
    );
  };

  const handleDeleteWebhook = async (slug: string) => {
    if (confirm("Are you sure you want to delete this endpoint? All logged executions will be permanently lost.")) {
      const res = await deleteWebhook(slug);
      if ("error" in res) {
        toast.error(res.error);
      } else {
        toast.success("Webhook endpoint deleted successfully");
        if (selectedSlug === slug) {
          setSelectedSlug("");
        }
        fetchDashboardData();
      }
    }
  };

  const handleClearLogs = async (slug: string) => {
    if (confirm("Are you sure you want to clear request logs for this endpoint?")) {
      const res = await clearWebhookLogs(slug);
      if ("error" in res) {
        toast.error(res.error);
      } else {
        toast.success("Request logs wiped successfully");
        fetchLogs(slug);
        getDashboardAnalytics().then((stats) => setAnalytics(stats));
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const selectedWebhook = webhooks.find((w) => w.slug === selectedSlug);

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header section */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-900 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Terminal className="h-6 w-6" />
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
                Dynamic Endpoint Hub
              </h1>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Create dynamic, fully customizable Webhook endpoints on the fly. Define responses, log parameters in MongoDB, and optionally send React Email alerts with Resend.
            </p>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="self-start md:self-center inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={clsx("h-4 w-4", loading && "animate-spin")} />
            Refresh Hub
          </button>
        </header>

        {/* Dashboard Analytics summary counters */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Endpoints</p>
              <h3 className="text-2xl font-bold mt-1 text-white">{analytics.totalEndpoints}</h3>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Request Logs</p>
              <h3 className="text-2xl font-bold mt-1 text-white">{analytics.totalLogs}</h3>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Successes (2xx)</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-400">{analytics.successes}</h3>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Errors (4xx+)</p>
              <h3 className="text-2xl font-bold mt-1 text-rose-400">{analytics.errors}</h3>
            </div>
          </div>
        </section>

        {/* Form and logs console panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Creator form */}
          <section className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-slate-900/40">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-400" />
                Define Dynamic Webhook
              </h2>
              <p className="text-xs text-slate-400 mt-1">Configure path, routing methods, and mock HTTP responses.</p>
            </div>

            <form action={dispatch} className="p-6 space-y-5">
              {/* Webhook Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Webhook Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Stripe Checkout Completed"
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                />
              </div>

              {/* Endpoint path Suffix / Slug */}
              <div className="space-y-1.5">
                <label htmlFor="slug" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  URL Path Suffix (Slug)
                </label>
                <div className="flex rounded-lg shadow-sm">
                  <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-800 bg-slate-950 px-3 text-xs text-slate-500 select-none">
                    /api/webhooks/
                  </span>
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    placeholder="stripe-checkout (or blank to auto-generate)"
                    className="block w-full rounded-r-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Method and response code settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="method" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    HTTP Method
                  </label>
                  <select
                    id="method"
                    name="method"
                    defaultValue="POST"
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">ALL (Any method)</option>
                    <option value="GET">GET Only</option>
                    <option value="POST">POST Only</option>
                    <option value="PUT">PUT Only</option>
                    <option value="DELETE">DELETE Only</option>
                    <option value="PATCH">PATCH Only</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="status" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Response Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue="200"
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="200">200 OK</option>
                    <option value="201">201 Created</option>
                    <option value="204">204 No Content</option>
                    <option value="400">400 Bad Request</option>
                    <option value="401">401 Unauthorized</option>
                    <option value="403">403 Forbidden</option>
                    <option value="404">404 Not Found</option>
                    <option value="500">500 Server Error</option>
                  </select>
                </div>
              </div>

              {/* Response Content Type */}
              <div className="space-y-1.5">
                <label htmlFor="contentType" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Response Content-Type
                </label>
                <select
                  id="contentType"
                  name="contentType"
                  defaultValue="application/json"
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="application/json">application/json (JSON)</option>
                  <option value="text/plain">text/plain (Plain text)</option>
                  <option value="text/html">text/html (HTML page/payload)</option>
                  <option value="application/xml">application/xml (XML)</option>
                </select>
              </div>

              {/* Response Payload Body */}
              <div className="space-y-1.5">
                <label htmlFor="body" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Response Body Payload
                </label>
                <textarea
                  id="body"
                  name="body"
                  rows={4}
                  required
                  defaultValue='{ "received": true, "status": "processed", "id": 10934 }'
                  placeholder="Enter JSON, text, or HTML template..."
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Alert Notification Email */}
              <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2 mb-2 text-indigo-400">
                  <Bell className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Instant Email Alerts</span>
                </div>
                <label htmlFor="notifyEmail" className="block text-[11px] text-slate-400">
                  Receive a detailed request breakdown to your email using Resend and React Email.
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  <input
                    id="notifyEmail"
                    name="notifyEmail"
                    type="email"
                    placeholder="developer@example.com (optional)"
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <SubmitButton />
              </div>
            </form>
          </section>

          {/* Webhook endpoint list and real-time logs */}
          <section className="lg:col-span-7 space-y-6">

            {/* Endpoints Roster list */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-md font-bold text-white flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-amber-400" />
                Active Custom Endpoints ({webhooks.length})
              </h2>

              {loading ? (
                <div className="flex items-center justify-center py-6 text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin text-indigo-500 mr-2" />
                  Loading active endpoints...
                </div>
              ) : webhooks.length === 0 ? (
                <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-slate-800/60">
                  <Code className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No active endpoints found</p>
                  <p className="text-xs text-slate-500 mt-1">Define your first webhook on the left to start receiving webhooks!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto">
                  {webhooks.map((wh) => {
                    const isSelected = selectedSlug === wh.slug;
                    return (
                      <div
                        key={wh.slug}
                        onClick={() => setSelectedSlug(wh.slug)}
                        className={clsx(
                          "cursor-pointer p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all",
                          isSelected
                            ? "bg-indigo-600/10 border-indigo-500"
                            : "bg-slate-950/40 border-slate-800/80 hover:bg-slate-900"
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{wh.name}</span>
                            <span className={clsx(
                              "text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase",
                              wh.method === "ALL" ? "bg-amber-500/10 text-amber-400" : "bg-indigo-500/10 text-indigo-400"
                            )}>
                              {wh.method}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <span className="font-mono bg-slate-950 p-1 rounded border border-slate-800/80 max-w-[200px] truncate sm:max-w-none">
                              /api/webhooks/{wh.slug}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(`${origin}/api/webhooks/${wh.slug}`);
                              }}
                              className="text-slate-500 hover:text-white p-1"
                              title="Copy Full URL"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-end sm:self-center">
                          {isSelected && (
                            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                          )}
                          <span className="text-[11px] bg-slate-950 px-2 py-1 rounded text-slate-400 border border-slate-800 font-bold">
                            Returns {wh.status}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWebhook(wh.slug);
                            }}
                            className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                            title="Delete Endpoint"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Webhook Log Inspector Console */}
            {selectedWebhook ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-md font-bold text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-indigo-400" />
                      Execution Inspector: {selectedWebhook.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Showing real-time execution logs for endpoint: <code className="text-indigo-300 font-mono">/api/webhooks/{selectedWebhook.slug}</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-center">
                    <button
                      onClick={handleTestWebhook}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all"
                      title="Simulate Request"
                    >
                      <Play className="h-3 w-3" />
                      Test Webhook
                    </button>
                    <button
                      onClick={() => handleClearLogs(selectedWebhook.slug)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-all"
                    >
                      Clear Logs
                    </button>
                  </div>
                </div>

                {/* Logs lists */}
                <div className="p-6 space-y-4">
                  {loadingLogs ? (
                    <div className="flex items-center justify-center py-12 text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin text-indigo-500 mr-2" />
                      Loading executions...
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-12 bg-slate-950/30 rounded-xl border border-slate-800/40">
                      <Clock className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-300">No requests captured yet</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        Use the "Test Webhook" button above to send a mock request, or trigger it manually using curl/Postman.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {logs.map((lg) => {
                        const isExpanded = expandedLogId === lg._id;
                        return (
                          <div
                            key={lg._id}
                            className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden"
                          >
                            {/* Summary trigger line */}
                            <div
                              onClick={() => setExpandedLogId(isExpanded ? null : lg._id || null)}
                              className="cursor-pointer p-4 flex items-center justify-between hover:bg-slate-900/60 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className={clsx(
                                  "text-[10px] px-2 py-0.5 rounded font-mono font-extrabold uppercase",
                                  lg.method === "POST" ? "bg-emerald-500/10 text-emerald-400" : "bg-sky-500/10 text-sky-400"
                                )}>
                                  {lg.method}
                                </span>
                                <div className="text-xs">
                                  <span className="font-semibold text-slate-300">{lg.clientIp}</span>
                                  <span className="text-slate-500 mx-2">•</span>
                                  <span className="text-slate-400">{new Date(lg.timestamp).toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {lg.emailNotified && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                                    <Mail className="h-3 w-3" /> Email Alert
                                  </span>
                                )}
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-slate-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-slate-500" />
                                )}
                              </div>
                            </div>

                            {/* Detailed request headers & body expander */}
                            {isExpanded && (
                              <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-4 text-xs font-mono">
                                {/* Query parameters */}
                                {Object.keys(lg.query).length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Query Params</p>
                                    <pre className="bg-slate-900/80 p-3 rounded border border-slate-800 text-slate-300 overflow-x-auto text-[11px]">
                                      {JSON.stringify(lg.query, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {/* Headers */}
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">HTTP Headers</p>
                                  <pre className="bg-slate-900/80 p-3 rounded border border-slate-800 text-slate-300 overflow-x-auto text-[11px] max-h-[150px] overflow-y-auto">
                                    {JSON.stringify(lg.headers, null, 2)}
                                  </pre>
                                </div>

                                {/* Body payload */}
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payload (Request Body)</p>
                                  <pre className="bg-slate-900/80 p-3 rounded border border-slate-800 text-slate-300 overflow-x-auto text-[11px]">
                                    {lg.body || "(empty)"}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

          </section>

        </div>

      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={clsx(
        "w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200",
        pending && "opacity-50 cursor-not-allowed"
      )}
    >
      {pending ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Configuring endpoint...
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" />
          Create Dynamic Endpoint
        </>
      )}
    </button>
  );
}
