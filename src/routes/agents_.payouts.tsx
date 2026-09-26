import { createFileRoute } from "@tanstack/react-router";
import BrokerBountiesPage from "./broker-bounties";

export const Route = createFileRoute("/agents_/payouts")({
  head: () => ({ meta: [{ title: "Agent Payouts & Bounties — SUPER ADMIN" }] }),
  component: AgentPayoutsRoute,
});

export default function AgentPayoutsRoute() {
  return <BrokerBountiesPage />;
}
