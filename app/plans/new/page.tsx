import type { Metadata } from "next";
import { PageFrame } from "@/components/layout/page-frame";
import { SiteHeader } from "@/components/layout/site-header";
import { PlanBuilderForm } from "@/components/plans/plan-builder-form";

export const metadata: Metadata = { title: "Build your own plan" };

/** Behind sign-in (proxy.ts). `?goal=` pre-fills the field from the home page teaser. */
export default async function NewPlanPage({ searchParams }: PageProps<"/plans/new">) {
  const raw = (await searchParams).goal;
  const goal = (Array.isArray(raw) ? raw[0] : raw)?.slice(0, 120) ?? "";

  return (
    <PageFrame header={<SiteHeader />}>
      <main id="main" className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pt-12 pb-20 sm:px-10">
        <p className="text-action text-primary-600">Build your own plan</p>
        <h1 className="mt-2 text-display-1 text-neutral-900">Learn anything. We&rsquo;ll build the course.</h1>
        <p className="mt-4 text-body-lg text-neutral-500">
          Tell us your goal. Vortex designs a step-by-step syllabus and fills every lesson with the
          best YouTube video it can find, with progress tracking and a quiz after each one.
        </p>
        <div className="mt-10">
          <PlanBuilderForm initialGoal={goal} />
        </div>
      </main>
    </PageFrame>
  );
}
