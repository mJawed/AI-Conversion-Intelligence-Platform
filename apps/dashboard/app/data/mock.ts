export type Metric = {
  label: string;
  value: string;
  detail: string;
  change?: string;
  tone?: "neutral" | "positive" | "negative";
};

export type TrendPoint = { label: string; value: number };
export type TopPage = { path: string; visitors: string; share: string };
export type InsightPreview = { category: string; title: string; priority: "High" | "Medium" | "Low"; impact: string };
export type SessionEvent = { time: string; title: string; detail: string; icon: string };
export type Visitor = {
  id: string;
  initials: string;
  name: string;
  status: "Active" | "Converted" | "Returned" | "Bounced";
  currentPage: string;
  device: "Desktop" | "Mobile" | "Tablet" | "Not available";
  country: string;
  browser: string;
  source: string;
  lastSeen: string;
  duration: string;
  scrollDepth: number;
  sessions: number;
  events: number;
  timeline: SessionEvent[];
};
export type FormField = { name: string; completion: number; dropOff: number; errors: number; issue: string };
export type FormAnalytics = { id: string; name: string; path: string; started: string; completed: string; completionRate: string; abandonmentRate: string; avgTime: string; submissions: string; validationErrors?: number; fields: FormField[]; recommendation: { title: string; reason: string; impact: string; priority: "High" | "Medium" | "Low" } };
export type FunnelStep = { name: string; path: string; visitors: string; count: number; conversion: string; dropOff: string; issue?: string };
export type FunnelAnalytics = { id: string; name: string; description: string; totalVisitors: string; conversions: string; conversionRate: string; change: string; steps: FunnelStep[]; explanation: { title: string; reason: string; confidence: string; recommendation: string; impact: string } };
export type BehaviourIssue = { type: "Rage click" | "Dead click" | "Scroll drop-off" | "Exit pattern"; title: string; page: string; detail: string; impact: string; priority: "High" | "Medium" | "Low" };
export type ClickTarget = { selector: string; label: string; clicks: string; rate: string; issue?: string };
export type HeatmapPoint = { x: number; y: number; intensity: number; type: "click" | "dead" };
export type ReplaySession = { id: string; initials: string; page: string; device: string; country: string; duration: string; time: string; events: number; status: "Converted" | "Frustrated" | "Exploring"; summary: string; timeline: SessionEvent[] };
export type AIInsight = { id: string; source?: string; category: "Forms" | "UX" | "CTA" | "Content" | "Funnels"; severity: "High" | "Medium" | "Low"; status: "Open" | "Dismissed" | "Resolved"; title: string; page: string; problem: string; reason: string; evidence: string[]; confidence: string; businessImpact: string; recommendation: string; expectedImprovement: string; created: string };
export type WebsiteSettings = { name: string; domain: string; trackingId: string; timezone: string; currency: string; industry: string; status: "Connected" | "Needs setup"; eventsThisMonth: string; plan: string };

export type NavigationItem = {
  label: string;
  href: string;
  icon: string;
};

export const navigationItems: NavigationItem[] = [
  { label: "Overview", href: "/", icon: "⌂" },
  { label: "Visitors", href: "/visitors", icon: "◉" },
  { label: "Behaviour", href: "/behavior", icon: "⌁" },
  { label: "Heatmaps", href: "/heatmaps", icon: "▦" },
  { label: "Replays", href: "/replays", icon: "▷" },
  { label: "Funnels", href: "/funnels", icon: "↘" },
  { label: "Forms", href: "/forms", icon: "▤" },
  { label: "AI Insights", href: "/insights", icon: "✦" }
  , { label: "Settings", href: "/settings", icon: "⚙" }
];

export const overviewMetrics: Metric[] = [
  { label: "Visitors", value: "24,892", detail: "Unique visitors this period", change: "+18.4%", tone: "positive" },
  { label: "Sessions", value: "31,406", detail: "Total sessions this period", change: "+12.8%", tone: "positive" },
  { label: "Conversion rate", value: "4.82%", detail: "Across 3 active goals", change: "+0.64%", tone: "positive" },
  { label: "Avg. session", value: "02:48", detail: "Average time on site", change: "+8.2%", tone: "positive" },
  { label: "Bounce rate", value: "38.6%", detail: "Visitors leaving after one page", change: "−3.1%", tone: "positive" },
  { label: "Live visitors", value: "37", detail: "Visitors active right now", change: "Live", tone: "neutral" }
];

export const trafficTrend: TrendPoint[] = [
  { label: "Jul 1", value: 38 }, { label: "Jul 5", value: 48 }, { label: "Jul 9", value: 42 },
  { label: "Jul 13", value: 61 }, { label: "Jul 17", value: 56 }, { label: "Jul 21", value: 74 },
  { label: "Jul 25", value: 68 }, { label: "Jul 29", value: 86 }
];

export const topPages: TopPage[] = [
  { path: "/pricing", visitors: "8,492", share: "34.1%" },
  { path: "/", visitors: "6,830", share: "27.4%" },
  { path: "/features", visitors: "3,912", share: "15.7%" },
  { path: "/contact", visitors: "2,104", share: "8.5%" }
];

export const insightPreviews: InsightPreview[] = [
  { category: "Forms", title: "Phone number field causes mobile drop-offs", priority: "High", impact: "+12–18%", },
  { category: "CTA", title: "Primary CTA is below the fold on small screens", priority: "Medium", impact: "+6–9%" },
  { category: "Content", title: "Visitors repeatedly return to the pricing FAQ", priority: "Low", impact: "+3–5%" }
];

export const visitors: Visitor[] = [
  { id: "v-1023", initials: "AS", name: "Anonymous visitor", status: "Active", currentPage: "/pricing", device: "Desktop", country: "United States", browser: "Chrome", source: "Google / Organic", lastSeen: "Now", duration: "03:24", scrollDepth: 81, sessions: 3, events: 28, timeline: [{ time: "Now", title: "Reading pricing", detail: "Scrolled to 81% on /pricing", icon: "◉" }, { time: "1m", title: "Opened FAQ", detail: "Clicked “Compare plans”", icon: "↗" }, { time: "3m", title: "Viewed pricing", detail: "Arrived from Google search", icon: "⌂" }] },
  { id: "v-1018", initials: "MK", name: "Anonymous visitor", status: "Converted", currentPage: "/checkout/success", device: "Mobile", country: "United Kingdom", browser: "Safari", source: "Email / Newsletter", lastSeen: "4m ago", duration: "08:12", scrollDepth: 94, sessions: 2, events: 46, timeline: [{ time: "4m", title: "Completed purchase", detail: "Goal: Purchase · $149", icon: "✓" }, { time: "6m", title: "Submitted checkout", detail: "Checkout form completed", icon: "▤" }, { time: "8m", title: "Viewed pricing", detail: "Returned visitor", icon: "⌂" }] },
  { id: "v-1007", initials: "JD", name: "Anonymous visitor", status: "Returned", currentPage: "/features", device: "Tablet", country: "Canada", browser: "Firefox", source: "Direct", lastSeen: "12m ago", duration: "05:47", scrollDepth: 67, sessions: 5, events: 31, timeline: [{ time: "12m", title: "Compared features", detail: "Moved between /features and /pricing", icon: "↔" }, { time: "14m", title: "Returned to site", detail: "Session 5 for this visitor", icon: "↻" }, { time: "18m", title: "Opened homepage", detail: "Direct visit", icon: "⌂" }] },
  { id: "v-0994", initials: "LP", name: "Anonymous visitor", status: "Bounced", currentPage: "/blog/ai-growth", device: "Mobile", country: "India", browser: "Chrome", source: "LinkedIn / Social", lastSeen: "21m ago", duration: "00:34", scrollDepth: 22, sessions: 1, events: 5, timeline: [{ time: "21m", title: "Session ended", detail: "Left after 34 seconds", icon: "×" }, { time: "22m", title: "Read article", detail: "Scrolled to 22%", icon: "↕" }, { time: "22m", title: "Landing page", detail: "Arrived from LinkedIn", icon: "⌂" }] },
  { id: "v-0982", initials: "RB", name: "Anonymous visitor", status: "Active", currentPage: "/contact", device: "Desktop", country: "Germany", browser: "Edge", source: "Google / Paid", lastSeen: "Now", duration: "01:56", scrollDepth: 48, sessions: 1, events: 14, timeline: [{ time: "Now", title: "Started contact form", detail: "Focused on email field", icon: "▤" }, { time: "1m", title: "Viewed contact", detail: "Arrived from paid search", icon: "⌂" }] }
];

export const forms: FormAnalytics[] = [
  { id: "contact-form", name: "Contact sales form", path: "/contact", started: "1,248", completed: "724", completionRate: "58.0%", abandonmentRate: "42.0%", avgTime: "02:14", submissions: "724", fields: [{ name: "Work email", completion: 94, dropOff: 6, errors: 24, issue: "Healthy" }, { name: "Company size", completion: 88, dropOff: 12, errors: 31, issue: "Consider simplifying options" }, { name: "Phone number", completion: 71, dropOff: 29, errors: 184, issue: "Largest drop-off" }, { name: "Message", completion: 64, dropOff: 36, errors: 42, issue: "Too much effort" }], recommendation: { title: "Phone number validation is creating friction", reason: "29% of users leave at this field and it generates 184 validation errors, mostly on mobile.", impact: "+12–18% completions", priority: "High" } },
  { id: "demo-form", name: "Book a demo", path: "/demo", started: "864", completed: "592", completionRate: "68.5%", abandonmentRate: "31.5%", avgTime: "01:48", submissions: "592", fields: [{ name: "Work email", completion: 97, dropOff: 3, errors: 12, issue: "Healthy" }, { name: "Company", completion: 92, dropOff: 8, errors: 18, issue: "Healthy" }, { name: "Preferred date", completion: 76, dropOff: 24, errors: 67, issue: "Calendar confusion" }, { name: "Notes", completion: 69, dropOff: 31, errors: 8, issue: "Optional field" }], recommendation: { title: "Make notes clearly optional", reason: "The final field sees a 31% drop-off even though it is not required for a demo request.", impact: "+5–8% completions", priority: "Medium" } },
  { id: "newsletter-form", name: "Newsletter signup", path: "/", started: "3,942", completed: "3,228", completionRate: "81.9%", abandonmentRate: "18.1%", avgTime: "00:32", submissions: "3,228", fields: [{ name: "Email address", completion: 82, dropOff: 18, errors: 106, issue: "Email errors" }], recommendation: { title: "Add a clearer value promise", reason: "The form performs well, but a stronger benefit near the field could recover remaining hesitation.", impact: "+3–5% completions", priority: "Low" } }
];

export const funnels: FunnelAnalytics[] = [
  { id: "purchase-funnel", name: "Purchase journey", description: "Homepage to completed purchase", totalVisitors: "12,842", conversions: "618", conversionRate: "4.81%", change: "+0.82%", steps: [{ name: "Landing page", path: "/", visitors: "12,842", count: 100, conversion: "100%", dropOff: "—" }, { name: "Pricing", path: "/pricing", visitors: "8,960", count: 70, conversion: "69.8%", dropOff: "30.2%", issue: "Pricing page" }, { name: "Signup", path: "/signup", visitors: "3,240", count: 48, conversion: "25.2%", dropOff: "63.8%", issue: "Signup form" }, { name: "Checkout", path: "/checkout", visitors: "1,104", count: 31, conversion: "8.6%", dropOff: "65.9%", issue: "Checkout" }, { name: "Purchase", path: "/checkout/success", visitors: "618", count: 22, conversion: "4.8%", dropOff: "44.0%" }], explanation: { title: "Signup is the biggest conversion bottleneck", reason: "Almost two-thirds of visitors who reach signup leave before starting checkout. Mobile visitors see the highest drop-off after the email field.", confidence: "91%", recommendation: "Reduce signup to email and password, then collect profile details after purchase.", impact: "+18–26% funnel completions" } },
  { id: "demo-funnel", name: "Demo request", description: "Content page to booked demo", totalVisitors: "7,420", conversions: "482", conversionRate: "6.49%", change: "+1.14%", steps: [{ name: "Feature page", path: "/features", visitors: "7,420", count: 100, conversion: "100%", dropOff: "—" }, { name: "Use cases", path: "/use-cases", visitors: "4,820", count: 65, conversion: "65.0%", dropOff: "35.0%" }, { name: "Demo form", path: "/demo", visitors: "1,248", count: 39, conversion: "16.8%", dropOff: "74.1%", issue: "Demo form" }, { name: "Booked", path: "/demo/confirmed", visitors: "482", count: 22, conversion: "6.5%", dropOff: "61.4%" }], explanation: { title: "Demo form creates the largest leak", reason: "Visitors reach the demo form but hesitate when asked for a preferred date and company details together.", confidence: "87%", recommendation: "Show available times after the email is submitted and make company size optional.", impact: "+9–14% demo bookings" } },
  { id: "newsletter-funnel", name: "Newsletter signup", description: "Article to newsletter subscription", totalVisitors: "18,304", conversions: "3,228", conversionRate: "17.64%", change: "+2.06%", steps: [{ name: "Article", path: "/blog", visitors: "18,304", count: 100, conversion: "100%", dropOff: "—" }, { name: "CTA view", path: "/blog", visitors: "8,212", count: 56, conversion: "44.9%", dropOff: "55.1%" }, { name: "Email entered", path: "/blog", visitors: "4,014", count: 32, conversion: "21.9%", dropOff: "51.1%" }, { name: "Subscribed", path: "/blog", visitors: "3,228", count: 25, conversion: "17.6%", dropOff: "19.6%" }], explanation: { title: "The content CTA is performing well", reason: "Most remaining losses happen before the form is seen, suggesting the CTA needs stronger visibility rather than form changes.", confidence: "82%", recommendation: "Repeat the signup prompt after the first meaningful section and add a clear benefit.", impact: "+6–10% subscriptions" } }
];

export const clickTargets: ClickTarget[] = [
  { selector: "button.primary-cta", label: "Start free trial", clicks: "4,824", rate: "19.4%" },
  { selector: "a.pricing-link", label: "Compare plans", clicks: "3,106", rate: "12.5%" },
  { selector: "button.faq-toggle", label: "Pricing FAQ", clicks: "2,318", rate: "9.3%" },
  { selector: "a.nav-contact", label: "Contact sales", clicks: "1,842", rate: "7.4%", issue: "Below-fold CTA" }
];

export const behaviourIssues: BehaviourIssue[] = [
  { type: "Rage click", title: "Users repeatedly click the disabled pricing toggle", page: "/pricing", detail: "486 sessions show 3+ clicks within 2 seconds", impact: "+8–12%", priority: "High" },
  { type: "Dead click", title: "Hero illustration looks interactive but has no action", page: "/", detail: "1,208 clicks lead to no navigation or feedback", impact: "+3–6%", priority: "Medium" },
  { type: "Scroll drop-off", title: "Most mobile visitors stop before testimonials", page: "/features", detail: "62% leave before reaching the trust section", impact: "+5–9%", priority: "Medium" },
  { type: "Exit pattern", title: "Visitors return to FAQ before leaving pricing", page: "/pricing", detail: "FAQ revisits are 2.4× higher than the site average", impact: "+4–7%", priority: "Low" }
];

export const scrollPages = [
  { page: "/", visitors: "8,426", depth: 72, fold: 91 },
  { page: "/pricing", visitors: "6,218", depth: 64, fold: 86 },
  { page: "/features", visitors: "4,102", depth: 48, fold: 79 },
  { page: "/blog/ai-growth", visitors: "2,816", depth: 38, fold: 66 }
];

export const heatmapPoints: HeatmapPoint[] = [
  { x: 22, y: 19, intensity: 92, type: "click" }, { x: 31, y: 25, intensity: 75, type: "click" }, { x: 64, y: 31, intensity: 88, type: "click" },
  { x: 75, y: 41, intensity: 62, type: "click" }, { x: 44, y: 49, intensity: 52, type: "click" }, { x: 79, y: 62, intensity: 73, type: "dead" },
  { x: 28, y: 68, intensity: 58, type: "click" }, { x: 56, y: 77, intensity: 42, type: "dead" }, { x: 84, y: 83, intensity: 35, type: "click" },
  { x: 17, y: 87, intensity: 28, type: "click" }
];

export const replaySessions: ReplaySession[] = [
  { id: "r-1023", initials: "AS", page: "/pricing", device: "Desktop", country: "United States", duration: "03:24", time: "2 min ago", events: 28, status: "Frustrated", summary: "Visitor compared plans, opened the FAQ twice, and left after clicking a pricing toggle that did not respond.", timeline: [{ time: "Now", title: "Session ended", detail: "Exited from /pricing", icon: "×" }, { time: "1m", title: "Rage click detected", detail: "3 clicks on pricing toggle", icon: "!" }, { time: "2m", title: "Opened FAQ", detail: "Compared plan details", icon: "↗" }] },
  { id: "r-1018", initials: "MK", page: "/checkout", device: "Mobile", country: "United Kingdom", duration: "08:12", time: "4 min ago", events: 46, status: "Converted", summary: "Visitor returned from an email campaign, completed checkout on mobile, and purchased the Starter plan.", timeline: [{ time: "4m", title: "Purchase completed", detail: "Goal: Purchase · $149", icon: "✓" }, { time: "6m", title: "Submitted checkout", detail: "Form completed on mobile", icon: "▤" }, { time: "8m", title: "Entered checkout", detail: "From /pricing", icon: "⌂" }] },
  { id: "r-1007", initials: "JD", page: "/features", device: "Tablet", country: "Canada", duration: "05:47", time: "12 min ago", events: 31, status: "Exploring", summary: "Returning visitor moved between features and pricing, spending most time reading integrations and security content.", timeline: [{ time: "12m", title: "Returned to pricing", detail: "Compared plan differences", icon: "↔" }, { time: "14m", title: "Read integrations", detail: "Scrolled to 74%", icon: "↕" }, { time: "18m", title: "Opened features", detail: "Direct visit", icon: "⌂" }] },
  { id: "r-0994", initials: "LP", page: "/blog/ai-growth", device: "Mobile", country: "India", duration: "00:34", time: "21 min ago", events: 5, status: "Frustrated", summary: "Visitor landed from LinkedIn, encountered a slow-loading article, and left before reaching the signup CTA.", timeline: [{ time: "21m", title: "Session ended", detail: "Left after 34 seconds", icon: "×" }, { time: "22m", title: "Scrolled article", detail: "Reached 22%", icon: "↕" }, { time: "22m", title: "Landing page", detail: "Arrived from LinkedIn", icon: "⌂" }] }
];

export const aiInsights: AIInsight[] = [
  { id: "ins-001", category: "Forms", severity: "High", status: "Open", title: "Phone number validation is causing mobile drop-offs", page: "/contact", problem: "Visitors abandon the contact form at the phone number field more often than any other field.", reason: "The current validation rejects spaces and international formats. Mobile users account for 71% of the affected sessions.", evidence: ["29% field drop-off", "184 validation errors", "71% of affected users on mobile"], confidence: "93%", businessImpact: "You may be losing approximately 156 qualified leads per month at the highest-intent step.", recommendation: "Accept spaces and international formats, make the country code explicit, and show an inline example before validation.", expectedImprovement: "+12–18% form completions", created: "Today" },
  { id: "ins-002", category: "UX", severity: "High", status: "Open", title: "Pricing toggle receives repeated clicks without feedback", page: "/pricing", problem: "Visitors repeatedly click the pricing toggle but the selected state does not visibly change on the first interaction.", reason: "Rage-click sessions cluster around the toggle on Safari and smaller screens, indicating a feedback or hit-area issue.", evidence: ["486 rage-click sessions", "3.2 clicks per affected session", "2.1× higher on mobile Safari"], confidence: "89%", businessImpact: "Confusion at the plan comparison step can reduce trial starts and increase pricing-page exits.", recommendation: "Increase the toggle hit area, add an immediate selected state, and test the annual/monthly labels with a visible transition.", expectedImprovement: "+8–12% pricing CTA clicks", created: "Yesterday" },
  { id: "ins-003", category: "CTA", severity: "Medium", status: "Open", title: "Primary CTA is below the fold on small screens", page: "/features", problem: "Mobile visitors must scroll before seeing the primary conversion action.", reason: "The hero section uses a large illustration and pushes the CTA below the first viewport for common mobile heights.", evidence: ["62% leave before CTA", "CTA visibility starts at 118% viewport", "Mobile conversion 2.94% vs desktop 7.74%"], confidence: "87%", businessImpact: "High-intent visitors may continue browsing without a clear next step, weakening paid and organic traffic efficiency.", recommendation: "Move the CTA into the first viewport and keep the supporting proof point below it.", expectedImprovement: "+6–9% CTA engagement", created: "2 days ago" },
  { id: "ins-004", category: "Content", severity: "Low", status: "Open", title: "Visitors repeatedly return to the pricing FAQ", page: "/pricing", problem: "Visitors revisit the FAQ section before leaving the pricing journey.", reason: "Repeated FAQ visits suggest the plan comparison does not answer questions early enough in the decision process.", evidence: ["2.4× site-average FAQ revisits", "38% of return visits from pricing", "Most viewed question: plan differences"], confidence: "82%", businessImpact: "Unanswered objections may delay purchase decisions and increase comparison shopping.", recommendation: "Move the top three FAQ answers next to the plan comparison and add a concise plan-difference summary.", expectedImprovement: "+3–5% purchase intent", created: "4 days ago" },
  { id: "ins-005", category: "Funnels", severity: "Medium", status: "Resolved", title: "Signup step is the largest purchase-funnel bottleneck", page: "/signup", problem: "Visitors who reach signup frequently leave before entering checkout.", reason: "The form requests profile details before visitors have experienced the product value.", evidence: ["63.8% step drop-off", "25.2% signup-to-checkout progression", "Highest drop-off on first-time visitors"], confidence: "91%", businessImpact: "The funnel loses potential purchases before checkout intent can be measured.", recommendation: "Reduce signup to email and password, then collect profile details after purchase.", expectedImprovement: "+18–26% funnel completions", created: "1 week ago" }
];

export const websiteSettings: WebsiteSettings = { name: "Acme website", domain: "acme.example.com", trackingId: "trk_x4k39sj92", timezone: "Asia/Kolkata", currency: "USD", industry: "SaaS / Technology", status: "Connected", eventsThisMonth: "31,406", plan: "Growth" };
