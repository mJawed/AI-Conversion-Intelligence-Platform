export type Metric = {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "positive";
};

export type NavigationItem = {
  label: string;
  href: string;
  icon: string;
};

export const navigationItems: NavigationItem[] = [
  { label: "Overview", href: "/", icon: "⌂" },
  { label: "Visitors", href: "/visitors", icon: "◉" },
  { label: "Funnels", href: "/funnels", icon: "↘" },
  { label: "Forms", href: "/forms", icon: "▤" },
  { label: "AI Insights", href: "/insights", icon: "✦" }
];

export const overviewMetrics: Metric[] = [
  { label: "Visitors", value: "—", detail: "Connect a website to start collecting data" },
  { label: "Sessions", value: "—", detail: "Your first sessions will appear here" },
  { label: "Conversion rate", value: "—", detail: "Define a goal to measure conversions" }
];
