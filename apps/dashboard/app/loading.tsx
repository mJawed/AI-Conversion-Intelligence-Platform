import { LoadingState } from "./components/ui";

export default function Loading() {
  return <main className="runtime-state" aria-busy="true" aria-live="polite"><LoadingState /></main>;
}
