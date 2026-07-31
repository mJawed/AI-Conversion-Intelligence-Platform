"use client";

import { useEffect, useState } from "react";
import { getApiHealth } from "../lib/api-client";

type ConnectionState = "checking" | "online" | "offline";

export function ApiStatus() {
  const [state, setState] = useState<ConnectionState>("checking");

  useEffect(() => {
    let active = true;
    getApiHealth().then(() => { if (active) setState("online"); }).catch(() => { if (active) setState("offline"); });
    return () => { active = false; };
  }, []);

  return <span className={`api-status api-${state}`}><i /> API {state === "checking" ? "checking" : state}</span>;
}
