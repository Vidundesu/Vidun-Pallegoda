"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { BarChart3, Sparkles, Target, FileText, Search, ExternalLink, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';

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

// Loading Modal Component with Stages
const LoadingModal = ({ isOpen, currentStage }: { isOpen: boolean; currentStage: number }) => {
  const stages = [
    { icon: '🔍', text: 'Analyzing URL structure...', subtext: 'Fetching page content' },
    { icon: '📊', text: 'Extracting factual metrics...', subtext: 'Counting words, images, and links' },
    { icon: '🧠', text: 'AI reasoning in progress...', subtext: 'Generating intelligent insights' },
    { icon: '💡', text: 'Crafting recommendations...', subtext: 'Building actionable strategies' },
    { icon: '✨', text: 'Finalizing analysis...', subtext: 'Almost there!' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-3xl p-12 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center space-y-8">
          {/* Animated Icon */}
          <div className="relative">
            <div className="text-7xl animate-bounce">
              {stages[currentStage]?.icon}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          </div>

          {/* Stage Text */}
          <div className="space-y-2">
            <h3 className="text-2xl font-medium text-gray-900">
              {stages[currentStage]?.text}
            </h3>
            <p className="text-gray-500">
              {stages[currentStage]?.subtext}
            </p>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2">
            {stages.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentStage
                    ? 'bg-blue-600 w-8'
                    : idx < currentStage
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Stage Counter */}
          <div className="text-sm text-gray-400">
            Stage {currentStage + 1} of {stages.length}
          </div>
        </div>
      </div>
    </div>
  );
};

// Navigation Component
const Sidebar = ({ currentPage, setCurrentPage }: { currentPage: string; setCurrentPage: (page: string) => void }) => {
  const navItems = [
    { id: 'main', label: 'Main', icon: BarChart3 },
    { id: 'metrics', label: 'Factual Metrics', icon: TrendingUp },
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
    { id: 'recommendations', label: 'Recommendations', icon: Target },
    { id: 'logs', label: 'Logs', icon: FileText }
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col">
      <div className="p-8 border-b border-gray-100">
        <h1 className="text-2xl font-medium tracking-tight text-gray-900">SEO Auditor + <span className='bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent'>Gemini 3.1 Pro</span></h1>
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  return (
    <div className="space-y-12">
      {/* URL Input Section */}
      <div className="max-w-3xl">
        <h2 className="text-3xl font-light text-gray-900 mb-2">Analyze URL | <span className='bg-gradient-to-r from-[#2c004a] to-purple-500 bg-clip-text text-transparent'>Eight 25 Media</span> </h2>
        <p className="text-gray-500 mb-8">Enter a URL to analyze performance, accessibility, and SEO metrics</p>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
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
          <button
            onClick={() => window.location.hash = '#logs'}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
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
                <span className={`px-3 py-1 ${log.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'} text-xs font-medium rounded-full`}>
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

// Factual Metrics Page
const FactualMetricsPage = ({
  result,
  url,
  onNext
}: {
  result: AuditResult | null;
  url: string | null;
  onNext: () => void;
}) => {
  if (!result || !url) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-light text-gray-900 mb-2">No Metrics Available</h2>
        <p className="text-gray-500">Please analyze a URL first to view factual metrics</p>
      </div>
    );
  }

  const { metrics } = result;

  return (
    <div className="space-y-8">
      {/* Header with URL */}
      <div className="">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink size={20} className="text-blue-600" />
              <h2 className="text-3xl font-light text-gray-900 mb-2">Factual Metrics</h2>
            </div>
            <a
              href={url}
              className="text-blue-600 hover:text-blue-700 font-medium text-lg break-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              {url}
            </a>
          </div>
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Word Count */}
        <MetricBox
          icon="📝"
          label="Total Word Count"
          value={metrics.wordCount.toLocaleString()}
          description="Total words on the page"
          color="blue"
        />

        {/* Heading Counts */}
        <MetricBox
          icon="📑"
          label="Heading Structure"
          value={
            <div className="space-y-1 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">H1:</span>
                <span className="font-medium">{metrics.headings.h1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">H2:</span>
                <span className="font-medium">{metrics.headings.h2}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">H3:</span>
                <span className="font-medium">{metrics.headings.h3}</span>
              </div>
            </div>
          }
          description="Heading hierarchy on page"
          color="purple"
        />

        {/* CTAs */}
        <MetricBox
          icon="🎯"
          label="Call-to-Actions"
          value={metrics.ctaCount}
          description="Buttons and primary action links"
          color="orange"
        />

        {/* Links */}
        <MetricBox
          icon="🔗"
          label="Links"
          value={
            <div className="space-y-1 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Internal:</span>
                <span className="font-medium">{metrics.links.internal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">External:</span>
                <span className="font-medium">{metrics.links.external}</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">{metrics.links.internal + metrics.links.external}</span>
              </div>
            </div>
          }
          description="Internal vs external links"
          color="green"
        />

        {/* Images */}
        <MetricBox
          icon="🖼️"
          label="Images"
          value={metrics.imageCount}
          description="Total images on the page"
          color="pink"
        />

        {/* Missing Alt Text */}
        <MetricBox
          icon="⚠️"
          label="Missing Alt Text"
          value={`${Math.round(metrics.imagesMissingAltPercent)}%`}
          description={`${Math.round((metrics.imageCount * metrics.imagesMissingAltPercent) / 100)} of ${metrics.imageCount} images`}
          color={metrics.imagesMissingAltPercent > 50 ? "red" : metrics.imagesMissingAltPercent > 20 ? "yellow" : "green"}
        />
      </div>

      {/* Meta Information */}
      <div className="space-y-4">
        <h3 className="text-xl font-medium text-gray-900">Meta Information</h3>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">Meta Title</label>
              <div className="text-gray-900 bg-gray-50 p-4 rounded-lg font-medium">
                {metrics.metaTitle || <span className="text-gray-400 italic">No meta title found</span>}
              </div>
              {metrics.metaTitle && (
                <div className="text-xs text-gray-500 mt-1">
                  Length: {metrics.metaTitle.length} characters
                  {metrics.metaTitle.length > 60 ? ' (⚠️ Too long - recommended max 60)' : ''}
                  {metrics.metaTitle.length < 30 ? ' (⚠️ Too short - recommended min 30)' : ''}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">Meta Description</label>
              <div className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                {metrics.metaDescription || <span className="text-gray-400 italic">No meta description found</span>}
              </div>
              {metrics.metaDescription && (
                <div className="text-xs text-gray-500 mt-1">
                  Length: {metrics.metaDescription.length} characters
                  {metrics.metaDescription.length > 160 ? ' (⚠️ Too long - recommended max 160)' : ''}
                  {metrics.metaDescription.length < 120 ? ' (⚠️ Too short - recommended min 120)' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-8">
        <button
          onClick={onNext}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-3 font-medium text-lg shadow-lg hover:shadow-xl"
        >
          Next: AI Insights
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

// Metric Box Component
const MetricBox = ({
  icon,
  label,
  value,
  description,
  color
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
  description: string;
  color: string;
}) => {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    orange: 'from-orange-50 to-orange-100 border-orange-200',
    green: 'from-green-50 to-green-100 border-green-200',
    pink: 'from-pink-50 to-pink-100 border-pink-200',
    red: 'from-red-50 to-red-100 border-red-200',
    yellow: 'from-yellow-50 to-yellow-100 border-yellow-200',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} rounded-xl border p-6 hover:shadow-lg transition-all duration-200`}>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-sm font-medium text-gray-500 mb-2">{label}</h3>
      <div className="text-3xl font-light text-gray-900 mb-2">
        {value}
      </div>
      <p className="text-xs text-gray-600">{description}</p>
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

  if (insights.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">✨</div>
        <h2 className="text-2xl font-light text-gray-900 mb-2">No AI Insights Available</h2>
        <p className="text-gray-500">Analyze a URL to generate intelligent insights</p>
      </div>
    );
  }

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

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🎯</div>
        <h2 className="text-2xl font-light text-gray-900 mb-2">No Recommendations Available</h2>
        <p className="text-gray-500">Analyze a URL to receive actionable recommendations</p>
      </div>
    );
  }

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
                <p className="text-gray-600 leading-relaxed mb-6 whitespace-pre-line">{rec.description}</p>

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

                {rec.steps.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Key Points</h4>
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
                )}
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

      {logs.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-light text-gray-900 mb-2">No Logs Yet</h2>
          <p className="text-gray-500">Your analysis history will appear here</p>
        </div>
      ) : (
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
      )}
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
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentAnalysisUrl, setCurrentAnalysisUrl] = useState<string | null>(null);

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

  // Simulate loading stages
  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setLoadingStage((prev) => {
          if (prev < 4) return prev + 1;
          return prev;
        });
      }, 800);

      return () => clearInterval(interval);
    } else {
      setLoadingStage(0);
    }
  }, [isAnalyzing]);

  const handleAnalyze = async (url: string) => {
    setError(null);
    setIsAnalyzing(true);
    setLoadingStage(0);
    setCurrentAnalysisUrl(url);

    const now = new Date().toISOString();
    const logId = `${now}-${Math.random().toString(16).slice(2)}`;

    try {
      const result = await postAudit(url);
      setLogs((prev) => [
        { id: logId, url, timestamp: now, status: "completed", result },
        ...prev,
      ]);

      // Redirect to metrics page after successful analysis
      setCurrentPage('metrics');
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

  const handleNextToInsights = () => {
    setCurrentPage('insights');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'main':
        return <MainPage logs={logs} onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} error={error} />;
      case 'metrics':
        return <FactualMetricsPage result={latestCompleted?.result ?? null} url={currentAnalysisUrl} onNext={handleNextToInsights} />;
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

      <LoadingModal isOpen={isAnalyzing} currentStage={loadingStage} />

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