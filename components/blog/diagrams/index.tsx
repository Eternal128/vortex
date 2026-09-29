import type { ComponentType } from "react";
import {
  BlockedVsInterleaved,
  EngagementByLength,
  FeelingVsLearning,
  ForgettingReviews,
  InterpolatedQuizzes,
  PretestLoop,
  SpacingRidgeline,
  TestingEffect,
  engagementTable,
  feelingTable,
  interleavingTable,
  spacingTable,
  testingEffectTable,
  type ChartTable,
} from "./learning";
import {
  CreatorFlow,
  IngestionPipeline,
  SearchPipeline,
  SystemArchitecture,
  TrustBoundaries,
  VortexBeforeAfter,
  WritePathGuards,
} from "./system";

/**
 * The diagram registry. Keys match the `diagram.name` options in the Studio schema
 * (`studio/schemaTypes/objects/diagram.ts`); an unknown name renders nothing.
 */
const DIAGRAMS: Record<string, { Component: ComponentType; table?: ChartTable }> = {
  "vortex-before-after": { Component: VortexBeforeAfter },
  "system-architecture": { Component: SystemArchitecture },
  "search-pipeline": { Component: SearchPipeline },
  "ingestion-pipeline": { Component: IngestionPipeline },
  "trust-boundaries": { Component: TrustBoundaries },
  "write-path-guards": { Component: WritePathGuards },
  "creator-flow": { Component: CreatorFlow },
  "spacing-ridgeline": { Component: SpacingRidgeline, table: spacingTable },
  "forgetting-reviews": { Component: ForgettingReviews },
  "testing-effect": { Component: TestingEffect, table: testingEffectTable },
  "engagement-by-length": { Component: EngagementByLength, table: engagementTable },
  "interpolated-quizzes": { Component: InterpolatedQuizzes },
  "feeling-vs-learning": { Component: FeelingVsLearning, table: feelingTable },
  "blocked-vs-interleaved": { Component: BlockedVsInterleaved, table: interleavingTable },
  "pretest-loop": { Component: PretestLoop },
};

/**
 * A figure in a field note. Wide diagrams scroll sideways on narrow screens instead of shrinking
 * their labels below legibility; charts offer the underlying numbers as a table.
 */
export function Diagram({ name, caption }: { name?: string | null; caption?: string | null }) {
  const entry = name ? DIAGRAMS[name] : undefined;
  if (!entry) return null;
  const { Component, table } = entry;

  return (
    <figure className="my-4">
      <div className="overflow-x-auto rounded-xl border border-canvas-line bg-surface p-4 shadow-sm sm:p-6">
        <div className="min-w-[620px]">
          <Component />
        </div>
      </div>
      {caption || table ? (
        <figcaption className="mt-3 flex flex-col gap-2 text-[14px] leading-6 text-neutral-500">
          {caption ? <span>{caption}</span> : null}
          {table ? (
            <details className="group">
              <summary className="w-fit cursor-pointer list-none font-mono text-[12px] tracking-[0.06em] text-neutral-500 uppercase hover:text-neutral-900">
                Show data
              </summary>
              <table className="mt-3 w-full border-collapse text-left text-[14px]">
                <thead>
                  <tr>
                    {table.columns.map((column) => (
                      <th key={column} className="border-b border-canvas-line py-2 pr-4 font-medium text-neutral-900">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="border-b border-canvas-line py-2 pr-4 tabular text-neutral-700">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
