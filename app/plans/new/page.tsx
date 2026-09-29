import { currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { PageFrame } from "@/components/layout/page-frame";
import { SiteHeader } from "@/components/layout/site-header";
import { PlanBuilderForm } from "@/components/plans/plan-builder-form";
import { GOAL_MAX } from "@/lib/plans/limits";

export const metadata: Metadata = { title: "Build your own plan" };

/**
 * Behind sign-in (proxy.ts). `?goal=` pre-fills the composer from the home hero's ⌘K bar and the
 * home page teaser. The first name is read on the server and only rendered as text.
 */
export default async function NewPlanPage({ searchParams }: PageProps<"/plans/new">) {
  const [params, user] = await Promise.all([searchParams, currentUser()]);
  const raw = params.goal;
  const goal = (Array.isArray(raw) ? raw[0] : raw)?.slice(0, GOAL_MAX) ?? "";

  return (
    <PageFrame header={<SiteHeader />}>
      <main id="main" className="flex flex-1 flex-col items-center px-5 pt-14 pb-20 sm:px-8 sm:pt-24">
        <PlanBuilderForm initialGoal={goal} firstName={user?.firstName ?? null} />
      </main>
    </PageFrame>
  );
}
