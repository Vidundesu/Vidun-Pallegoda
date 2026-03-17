"use client";

import { useState } from "react";

export default function AuditApp() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const handleSubmit = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white font-sans p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6">AI Website Audit</h1>

        {/* Input */}
        <div className="flex gap-2 mb-8">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter website URL..."
            className="flex-1 px-4 py-3 rounded-xl bg-[#111827] border border-[#1F2937] focus:outline-none"
          />
          <button
            onClick={handleSubmit}
            className="px-6 py-3 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] transition"
          >
            Analyze
          </button>
        </div>

        {loading && <p className="text-gray-400">Analyzing...</p>}

        {data && (
          <div className="space-y-8">
            {/* Metrics */}
            <Section title="Factual Metrics">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Metric label="Word Count" value={data.metrics.wordCount} />
                <Metric label="H1" value={data.metrics.headings.h1} />
                <Metric label="H2" value={data.metrics.headings.h2} />
                <Metric label="H3" value={data.metrics.headings.h3} />
                <Metric label="CTAs" value={data.metrics.ctas} />
                <Metric label="Images" value={data.metrics.images.total} />
                <Metric
                  label="Missing Alt %"
                  value={data.metrics.images.missingAlt}
                />
              </div>
            </Section>

            {/* AI Insights */}
            <Section title="AI Insights">
              <Insight title="SEO Structure" text={data.analysis.seo} />
              <Insight title="Messaging" text={data.analysis.messaging} />
              <Insight title="CTA Usage" text={data.analysis.cta} />
              <Insight title="Content Depth" text={data.analysis.contentDepth} />
              <Insight title="UX Issues" text={data.analysis.uxIssues} />
            </Section>

            {/* Recommendations */}
            <Section title="Recommendations">
              <div className="space-y-4">
                {data.recommendations.map((rec: any, i: number) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-[#111827] border border-[#1F2937]"
                  >
                    <div className="flex justify-between mb-2">
                      <p className="font-medium">{rec.recommendation}</p>
                      <span className="text-xs px-2 py-1 rounded bg-[#4F46E5]/20 text-[#A5B4FC]">
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{rec.reasoning}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6">
        {children}
      </div>
    </div>
  );
}

function Metric({ label, value }: any) {
  return (
    <div className="p-4 rounded-xl bg-[#020617] border border-[#1E293B]">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-lg font-medium">{value}</p>
    </div>
  );
}

function Insight({ title, text }: any) {
  return (
    <div className="mb-4">
      <p className="font-medium mb-1">{title}</p>
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}
