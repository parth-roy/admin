import { createFileRoute } from "@tanstack/react-router";
import { BrokerBountiesView } from "@/components/admin/BrokerBountiesView";

export const Route = createFileRoute("/agents_/payouts")({
  head: () => ({ meta: [{ title: "Agent Payouts & Bounties — SUPER ADMIN" }] }),
  component: BrokerBountiesView,
});
