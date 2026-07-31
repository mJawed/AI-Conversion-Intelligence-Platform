"use client";

import { useState } from "react";
import type { FormAnalytics } from "../data/mock";

export function FormsView({ forms }: Readonly<{ forms: FormAnalytics[] }>) {
  const [selectedId, setSelectedId] = useState(forms[0]?.id ?? "");
  const selected = forms.find((form) => form.id === selectedId) ?? forms[0];
  if (!selected) return null;

  return (
    <div className="forms-explorer">
      <div className="form-tabs" role="tablist" aria-label="Forms"><span className="tab-label">Tracked forms</span>{forms.map((form) => <button className={form.id === selected.id ? "form-tab active" : "form-tab"} key={form.id} onClick={() => setSelectedId(form.id)} type="button" role="tab" aria-selected={form.id === selected.id}>{form.name}</button>)}</div>
      <section className="form-summary-grid"><SummaryMetric label="Started" value={selected.started} detail="Visitors began this form" /><SummaryMetric label="Completed" value={selected.completed} detail={`${selected.submissions} submissions`} /><SummaryMetric label="Completion rate" value={selected.completionRate} detail="From start to submit" tone="positive" /><SummaryMetric label="Abandonment" value={selected.abandonmentRate} detail="Visitors who left before submit" tone="negative" /><SummaryMetric label="Avg. completion time" value={selected.avgTime} detail="From first focus to submit" /></section>
      <div className="forms-content-grid"><FieldDropoff form={selected} /><FormRecommendation recommendation={selected.recommendation} /></div>
      <div className="forms-content-grid forms-bottom-grid"><ValidationErrors form={selected} /><CompletionChart /></div>
    </div>
  );
}

function SummaryMetric({ label, value, detail, tone }: Readonly<{ label: string; value: string; detail: string; tone?: "positive" | "negative" }>) {
  return <article className="form-summary-card"><span>{label}</span><strong>{value}</strong><p className={tone ? `summary-${tone}` : ""}>{detail}</p></article>;
}

function FieldDropoff({ form }: Readonly<{ form: FormAnalytics }>) {
  return <section className="widget field-widget" aria-labelledby="field-dropoff-heading"><div className="widget-heading"><div><p className="eyebrow">Form friction</p><h2 id="field-dropoff-heading">Field drop-off</h2></div><span className="list-meta">{form.name}</span></div><div className="field-table"><div className="field-table-heading"><span>Field</span><span>Completion</span><span>Drop-off</span><span>Signal</span></div>{form.fields.map((field) => <div className="field-row" key={field.name}><strong>{field.name}</strong><div className="field-progress"><i style={{ width: `${field.completion}%` }} /><span>{field.completion}%</span></div><b className={field.dropOff > 20 ? "dropoff-high" : "dropoff-low"}>{field.dropOff}%</b><span className="field-issue">{field.issue}</span></div>)}</div></section>;
}

function FormRecommendation({ recommendation }: Readonly<{ recommendation: FormAnalytics["recommendation"] }>) {
  return <section className="form-recommendation" aria-labelledby="form-recommendation-heading"><div className="recommendation-top"><span className={`priority priority-${recommendation.priority.toLowerCase()}`}>{recommendation.priority} priority</span><span className="recommendation-spark">✦</span></div><p className="eyebrow">CRO recommendation</p><h2 id="form-recommendation-heading">{recommendation.title}</h2><p className="recommendation-reason">{recommendation.reason}</p><div className="recommendation-impact"><span>Expected improvement</span><strong>{recommendation.impact}</strong></div><button className="button button-dark" type="button">View recommendation →</button></section>;
}

function ValidationErrors({ form }: Readonly<{ form: FormAnalytics }>) {
  return <section className="widget" aria-labelledby="validation-heading"><div className="widget-heading"><div><p className="eyebrow">Friction signals</p><h2 id="validation-heading">Validation errors</h2></div><span className="list-meta">Last 30 days</span></div><div className="error-list">{form.fields.filter((field) => field.errors > 0).map((field) => <div className="error-row" key={field.name}><span className="error-icon">!</span><div><strong>{field.name}</strong><p>{field.issue}</p></div><b>{field.errors}</b></div>)}</div></section>;
}

function CompletionChart() {
  const points = [{ label: "Mon", value: 42 }, { label: "Tue", value: 58 }, { label: "Wed", value: 51 }, { label: "Thu", value: 72 }, { label: "Fri", value: 64 }, { label: "Sat", value: 38 }, { label: "Sun", value: 45 }];
  return <section className="widget completion-widget" aria-labelledby="completion-heading"><div className="widget-heading"><div><p className="eyebrow">Time analysis</p><h2 id="completion-heading">Completion time</h2></div><span className="list-meta">Minutes per submission</span></div><div className="completion-bars">{points.map((point) => <div className="completion-bar" key={point.label}><div className="bar-track"><i style={{ height: `${point.value}%` }} /></div><span>{point.label}</span></div>)}</div><div className="completion-average"><span>Average completion time</span><strong>02:14</strong></div></section>;
}
