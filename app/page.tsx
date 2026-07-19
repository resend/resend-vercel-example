"use client";

import clsx from "clsx";
import { useFormStatus } from "react-dom";
import { sendInvitation, getInvitations, getAnalytics, clearInvitationHistory, type Invitation } from "./lib/actions";
import * as React from "react";
import { toast } from "sonner";
import {
  Mail,
  Users,
  PlusCircle,
  CheckCircle,
  XCircle,
  Trash2,
  Briefcase,
  Shield,
  Clock,
  UserPlus,
  Building,
  RefreshCw,
  Search
} from "lucide-react";

export default function Page() {
  const [state, dispatch] = React.useActionState(sendInvitation, undefined);
  const [invitations, setInvitations] = React.useState<Invitation[]>([]);
  const [analytics, setAnalytics] = React.useState({
    total: 0,
    sent: 0,
    failed: 0,
    uniqueTeams: 0,
    uniqueInvitees: 0,
  });
  const [loadingHistory, setLoadingHistory] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<"All" | "Sent" | "Failed">("All");

  // Load invitation history and aggregations
  const loadData = React.useCallback(async () => {
    setLoadingHistory(true);
    try {
      const [invList, stats] = await Promise.all([
        getInvitations(),
        getAnalytics()
      ]);
      setInvitations(invList);
      setAnalytics(stats);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
    if (!state) return;

    if ("data" in state) {
      toast.success(state.data);
      // reload history and statistics
      loadData();
    } else if ("error" in state) {
      toast.error(state.error);
    }
  }, [state, loadData]);

  // Clean / Clear History action
  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to clear all invitation history from MongoDB?")) {
      const res = await clearInvitationHistory();
      if ("data" in res) {
        toast.success(res.data);
        loadData();
      } else {
        toast.error(res.error);
      }
    }
  };

  // Filter & Search Logic
  const filteredInvitations = React.useMemo(() => {
    return invitations.filter((inv) => {
      const matchesSearch =
        inv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.invitedByUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === "All" || inv.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [invitations, searchQuery, filterStatus]);

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header section with brand and clear button */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <UserPlus className="h-6 w-6" />
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
                Enterprise Inviter Hub
              </h1>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Add multiple team members, manage active rosters, view dynamic analytics, and customize invitations. Powered by React Email, Resend, and MongoDB.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loadingHistory}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={clsx("h-4 w-4", loadingHistory && "animate-spin")} />
              Refresh
            </button>
            <button
              onClick={handleClearHistory}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear Logs
            </button>
          </div>
        </header>

        {/* Dynamic Analytics KPIs Cards (Enhancement 1) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Invites</p>
              <h3 className="text-2xl font-bold mt-1 text-white">{analytics.total}</h3>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Sent (Delivered)</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-400">{analytics.sent}</h3>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Failed Invites</p>
              <h3 className="text-2xl font-bold mt-1 text-rose-400">{analytics.failed}</h3>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Unique Teams</p>
              <h3 className="text-2xl font-bold mt-1 text-white">{analytics.uniqueTeams}</h3>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Unique Invitees</p>
              <h3 className="text-2xl font-bold mt-1 text-white">{analytics.uniqueInvitees}</h3>
            </div>
          </div>
        </section>

        {/* Main section containing Form and History Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left panel: Elegant configuration form */}
          <section className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-slate-900/40">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-indigo-400" />
                Dispatch Invitations
              </h2>
              <p className="text-xs text-slate-400 mt-1">Configure your personalized invitation settings and hit invite.</p>
            </div>

            <form action={dispatch} className="p-6 space-y-5">

              {/* Recipient Email Address Input */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Recipients Email Address (Bulk-ready)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4.5 w-4.5 text-slate-500" aria-hidden="true" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    required
                    defaultValue="delivered@resend.dev"
                    placeholder="jane@example.com, john@example.com"
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950 pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Separate multiple emails with commas to perform bulk invitations.
                </p>
              </div>

              {/* Dynamic Settings Fields (Enhancement 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Team Name */}
                <div className="space-y-1.5">
                  <label htmlFor="teamName" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Team Name
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Building className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <input
                      id="teamName"
                      name="teamName"
                      type="text"
                      defaultValue="Enigma"
                      placeholder="e.g. Acme Corp"
                      className="block w-full rounded-lg border border-slate-800 bg-slate-950 pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                    />
                  </div>
                </div>

                {/* Role dropdown */}
                <div className="space-y-1.5">
                  <label htmlFor="role" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Assigned Role
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Briefcase className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <select
                      id="role"
                      name="role"
                      defaultValue="Member"
                      className="block w-full rounded-lg border border-slate-800 bg-slate-950 pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow appearance-none"
                    >
                      <option value="Owner">Owner (Admin)</option>
                      <option value="Member">Member</option>
                      <option value="Developer">Developer</option>
                      <option value="Billing">Billing Admin</option>
                    </select>
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Inviter Name */}
                <div className="space-y-1.5">
                  <label htmlFor="invitedByUsername" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Inviter Name
                  </label>
                  <input
                    id="invitedByUsername"
                    name="invitedByUsername"
                    type="text"
                    defaultValue="Alan Turing"
                    placeholder="Alan Turing"
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  />
                </div>

                {/* Inviter Email */}
                <div className="space-y-1.5">
                  <label htmlFor="invitedByEmail" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Inviter Email
                  </label>
                  <input
                    id="invitedByEmail"
                    name="invitedByEmail"
                    type="email"
                    defaultValue="alan.turing@example.com"
                    placeholder="alan.turing@example.com"
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  />
                </div>

              </div>

              <div className="pt-2">
                <SubmitButton />
              </div>
            </form>
          </section>

          {/* Right panel: Live MongoDB Invitation Logs Dashboard */}
          <section className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-[500px]">

            {/* Controls header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-sky-400" />
                  Roster & Invitation Logs
                </h2>
                <p className="text-xs text-slate-400 mt-1">Real-time status tracking pulled from MongoDB.</p>
              </div>

              {/* Status Filter buttons */}
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(["All", "Sent", "Failed"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={clsx(
                      "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                      filterStatus === status
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/20">
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search by email, team, inviter or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Logs list / Table */}
            <div className="flex-1 overflow-x-auto">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                  <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
                  <p className="text-sm">Fetching real-time records...</p>
                </div>
              ) : filteredInvitations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                  <div className="p-4 bg-slate-800/40 rounded-full text-slate-500 mb-3">
                    <Mail className="h-8 w-8" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">No invitations found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    {searchQuery || filterStatus !== "All"
                      ? "No records match your search query or filter selection."
                      : "Start typing recipient emails and click invite to record history."}
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
                  <thead className="bg-slate-950/40 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                    <tr>
                      <th className="px-6 py-3">Recipient</th>
                      <th className="px-6 py-3">Team & Role</th>
                      <th className="px-6 py-3">Sender Details</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Sent At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/10">
                    {filteredInvitations.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-white">{inv.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-slate-300 font-medium">{inv.teamName}</span>
                            <span className="text-slate-500 flex items-center gap-1 mt-0.5">
                              <Shield className="h-3 w-3" />
                              {inv.role}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-slate-300">{inv.invitedByUsername}</div>
                          <div className="text-slate-500 text-[11px]">{inv.invitedByEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={clsx(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium",
                            inv.status === "Sent"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          )}>
                            {inv.status === "Sent" ? (
                              <>
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Delivered
                              </>
                            ) : (
                              <>
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                                Failed
                              </>
                            )}
                          </span>
                          {inv.errorMessage && (
                            <p className="text-rose-500 text-[10px] mt-1 max-w-[200px] truncate" title={inv.errorMessage}>
                              {inv.errorMessage}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-slate-500">
                          {new Date(inv.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bottom pagination or info status footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/20 flex items-center justify-between text-[11px] text-slate-500">
              <p>Showing {filteredInvitations.length} of {invitations.length} historical logs</p>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                MongoDB Live connection ok
              </div>
            </div>

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
          Disbursing invites...
        </>
      ) : (
        <>
          <Mail className="h-4 w-4" />
          Send Invitations
        </>
      )}
    </button>
  );
}
