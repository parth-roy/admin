import { createFileRoute } from "@tanstack/react-router";
import { BrokerBountiesView } from "@/components/admin/BrokerBountiesView";

export const Route = createFileRoute("/broker-bounties")({
  head: () => ({ meta: [{ title: "Agent Bounties & Commission — SUPER ADMIN" }] }),
  component: BrokerBountiesView,
});
