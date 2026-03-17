"use client";

import React, { useMemo, useState } from 'react';
import { BarChart3, Sparkles, Target, FileText, Search, ExternalLink } from 'lucide-react';

import type { AuditResponse } from "@/core/contracts";
import type { AuditResult, RecommendationPriority } from "@/core/types";

type AuditStatus = "completed" | "failed";

type DashboardLog = {
  id: string;
  url: string;
  timestamp: string;
  status: AuditStatus;
  result?: AuditResult;
  error?: string;
};

type InsightSeverity = "high" | "medium" | "low";
type DashboardInsight = {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  category: string;
  impact: "High" | "Medium" | "Low";
};

type DashboardRecommendation = {
  id: string;
  title: string;
  priority: RecommendationPriority;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  description: string;
  steps: string[];
};

async function postAudit(url: string): Promise<AuditResult> {
  const response = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const json = (await response.json()) as AuditResponse;

  if (!response.ok || !json.success) {
    const message = !json.success ? json.error : "Audit request failed";
    throw new Error(message);
  }

  return json.data;
}

// Navigation Component
const Sidebar = ({ currentPage, setCurrentPage }: { currentPage: string; setCurrentPage: (page: string) => void }) => {
  const navItems = [
    { id: 'main', label: 'Main', icon: BarChart3 },
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
    { id: 'recommendations', label: 'Recommendations', icon: Target },
    { id: 'logs', label: 'Logs', icon: FileText }
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col">
      <div className="p-8 border-b border-gray-100">
        <h1 className="text-2xl font-medium tracking-tight text-gray-900">SEO Auditor + <span className='bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent'>Gemini 3.1 Pro</span>  </h1>
        <p className="text-sm text-gray-500 mt-1">Analytics Dashboard</p>
      </div>

      <nav className="flex-1 p-6">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={20} strokeWidth={1.5} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-6 border-t border-gray-100">
        <div className="text-xs text-gray-400">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

// Main Page Component
const MainPage = ({
  logs,
  onAnalyze,
  isAnalyzing,
  error,
}: {
  logs: DashboardLog[];
  onAnalyze: (url: string) => Promise<void>;
  isAnalyzing: boolean;
  error: string | null;
}) => {
  const [url, setUrl] = useState('');

  const handleAnalyze = async () => {
    if (!url || isAnalyzing) return;
    await onAnalyze(url);
    setUrl('');
  };

  return (
    <div className="space-y-12">
      {/* URL Input Section */}
      <div className="max-w-3xl">
        <h2 className="text-3xl font-light text-gray-900 mb-2">Analyze URL | Eight 25 Media</h2>
        <p className="text-gray-500 mb-8">Enter a URL to analyze performance, accessibility, and SEO metrics</p>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 border text-gray-600 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!url || isAnalyzing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-medium"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing
                </>
              ) : (
                <>
                  <Search size={18} />
                  Analyze
                </>
              )}
            </button>
          </div>

          {error ? (
            <div className="mt-4 text-sm text-red-600">{error}</div>
          ) : null}
        </div>
      </div>

      {/* History Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-light text-gray-900">Recent Analysis</h2>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All →
          </button>
        </div>

        <div className="grid gap-4">
          {logs.slice(0, 3).map((log) => (
            <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ExternalLink size={16} className="text-gray-400" />
                    <a href={log.url} className="text-blue-600 hover:text-blue-700 font-medium" target="_blank" rel="noopener noreferrer">
                      {log.url}
                    </a>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                  {log.status}
                </span>
              </div>

              {log.result ? (
                <div className="grid grid-cols-4 gap-4">
                  <MetricCard label="Word Count" value={log.result.metrics.wordCount} color="blue" />
                  <MetricCard label="Images" value={log.result.metrics.imageCount} color="green" />
                  <MetricCard
                    label="Missing Alt"
                    value={`${Math.round(log.result.metrics.imagesMissingAltPercent)}%`}
                    color="purple"
                  />
                  <MetricCard label="CTAs" value={log.result.metrics.ctaCount} color="orange" />
                </div>
              ) : (
                <div className="text-sm text-gray-500">{log.error ?? "No results available"}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// AI Insights Page
const AIInsightsPage = ({ insights }: { insights: DashboardInsight[] }) => {
  const getSeverityColor = (severity: InsightSeverity) => {
    const colors = {
      high: 'bg-red-50 text-red-700 border-red-200',
      medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      low: 'bg-blue-50 text-blue-700 border-blue-200'
    };
    return colors[severity] || colors.low;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-light text-gray-900 mb-2">AI Insights</h2>
        <p className="text-gray-500">Intelligent analysis and patterns detected across your URLs</p>
      </div>

      <div className="grid gap-6">
        {insights.map((insight) => (
          <div key={insight.id} className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles size={20} className="text-blue-500" />
                  <h3 className="text-xl font-medium text-gray-900">{insight.title}</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">{insight.description}</p>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-xs font-medium border ${getSeverityColor(insight.severity)}`}>
                {insight.impact} Impact
              </span>
            </div>

            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                Category: <span className="font-medium text-gray-700">{insight.category}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Recommendations Page
const RecommendationsPage = ({ recommendations }: { recommendations: DashboardRecommendation[] }) => {
  const getPriorityColor = (priority: RecommendationPriority) => {
    const colors = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    };
    return colors[priority] || colors.low;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-light text-gray-900 mb-2">Recommendations</h2>
        <p className="text-gray-500">Actionable steps to improve your website performance</p>
      </div>

      <div className="grid gap-6">
        {recommendations.map((rec) => (
          <div key={rec.id} className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg transition-all duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className={`w-1 h-full ${getPriorityColor(rec.priority)} rounded-full`} />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Target size={20} className="text-blue-500" />
                  <h3 className="text-xl font-medium text-gray-900">{rec.title}</h3>
                </div>
                <p className="text-gray-600 leading-relaxed mb-6">{rec.description}</p>

                <div className="flex items-center gap-6 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Priority:</span>
                    <span className="font-medium text-gray-900 capitalize">{rec.priority}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Effort:</span>
                    <span className="font-medium text-gray-900 capitalize">{rec.effort}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Impact:</span>
                    <span className="font-medium text-gray-900 capitalize">{rec.impact}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Implementation Steps</h4>
                  <ol className="space-y-2">
                    {rec.steps.map((step, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-gray-600">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {idx + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Logs Page
const LogsPage = ({ logs }: { logs: DashboardLog[] }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-light text-gray-900 mb-2">Analysis Logs</h2>
        <p className="text-gray-500">Complete history of all URL analyses</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Word Count</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Images</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Missing Alt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <a href={log.url} className="text-blue-600 hover:text-blue-700 text-sm font-medium" target="_blank" rel="noopener noreferrer">
                      {log.url}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 ${log.status === "failed" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"} text-xs font-medium rounded-full`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.result?.metrics.wordCount ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.result?.metrics.imageCount ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.result
                      ? `${Math.round(log.result.metrics.imagesMissingAltPercent)}%`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Utility Components
const MetricCard = ({ label, value, color }: { label: string; value: string | number; color: "blue" | "green" | "purple" | "orange" }) => {
  const colors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };

  return (
    <div className="text-center">
      <div className={`text-2xl font-light ${colors[color]} mb-1`}>
        {typeof value === 'number' ? value : value}
      </div>
      <div className="text-xs text-gray-500 font-medium">{label}</div>
    </div>
  );
};

// Main App Component
export default function AssignmentDashboard() {
  const [currentPage, setCurrentPage] = useState('main');
  const [logs, setLogs] = useState<DashboardLog[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latestCompleted = useMemo(() => {
    return logs.find((l) => l.status === "completed" && l.result);
  }, [logs]);

  const insights = useMemo<DashboardInsight[]>(() => {
    const analysis = latestCompleted?.result?.analysis;
    if (!analysis) return [];

    return [
      {
        id: "seoStructure",
        title: "SEO Structure",
        description: analysis.seoStructure,
        severity: "medium",
        category: "seo",
        impact: "Medium",
      },
      {
        id: "messagingClarity",
        title: "Messaging Clarity",
        description: analysis.messagingClarity,
        severity: "low",
        category: "content",
        impact: "Low",
      },
      {
        id: "ctaUsage",
        title: "CTA Usage",
        description: analysis.ctaUsage,
        severity: "medium",
        category: "conversion",
        impact: "Medium",
      },
      {
        id: "contentDepth",
        title: "Content Depth",
        description: analysis.contentDepth,
        severity: "medium",
        category: "content",
        impact: "Medium",
      },
      {
        id: "uxConcerns",
        title: "UX Concerns",
        description: analysis.uxConcerns,
        severity: "low",
        category: "ux",
        impact: "Low",
      },
    ];
  }, [latestCompleted]);

  const recommendations = useMemo<DashboardRecommendation[]>(() => {
    const recs = latestCompleted?.result?.recommendations;
    if (!recs) return [];

    const priorityToImpact: Record<RecommendationPriority, "low" | "medium" | "high"> = {
      high: "high",
      medium: "medium",
      low: "low",
    };

    return recs.map((r, idx) => ({
      id: `${idx}-${r.priority}`,
      title: r.recommendation,
      priority: r.priority,
      effort: "medium",
      impact: priorityToImpact[r.priority],
      description: `${r.reasoning}${r.metricReference ? `\n\nMetric: ${r.metricReference}` : ""}`,
      steps: [r.recommendation, r.metricReference].filter(Boolean) as string[],
    }));
  }, [latestCompleted]);

  const handleAnalyze = async (url: string) => {
    setError(null);
    setIsAnalyzing(true);

    const now = new Date().toISOString();
    const logId = `${now}-${Math.random().toString(16).slice(2)}`;

    try {
      const result = await postAudit(url);
      setLogs((prev) => [
        { id: logId, url, timestamp: now, status: "completed", result },
        ...prev,
      ]);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Analysis failed";
      setError(message);
      setLogs((prev) => [
        { id: logId, url, timestamp: now, status: "failed", error: message },
        ...prev,
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'main':
        return <MainPage logs={logs} onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} error={error} />;
      case 'insights':
        return <AIInsightsPage insights={insights} />;
      case 'recommendations':
        return <RecommendationsPage recommendations={recommendations} />;
      case 'logs':
        return <LogsPage logs={logs} />;
      default:
        return <MainPage logs={logs} onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} error={error} />;
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@300;400;500;700&display=swap');

        * {
          font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        body {
          background: #fafafa;
          margin: 0;
          padding: 0;
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

        <main className="ml-64 p-12">
          <div className="max-w-7xl">
            {renderPage()}
          </div>
        </main>
      </div>
    </>
  );
}