import type { Metadata } from "next";
import { PageFrame } from "@/components/layout/page-frame";
import { SiteHeader } from "@/components/layout/site-header";
import { SearchForm } from "@/components/search/search-form";
import { SearchResults } from "@/components/search/search-results";
import { container } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { MAX_QUERY_LENGTH, SORTS, type SearchSort } from "@/lib/search/types";
import { SEARCH_QUERY_PARAM, SEARCH_SORT_PARAM } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Search",
  description: "Search every lesson and video moment on Vortex in plain English.",
};

function firstValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const query = firstValue(params[SEARCH_QUERY_PARAM]).trim().slice(0, MAX_QUERY_LENGTH);
  const sortParam = firstValue(params[SEARCH_SORT_PARAM]);
  const sort: SearchSort = SORTS.find((option) => option === sortParam) ?? "relevance";

  // Keyed on the query so the field always reflects the URL after a new search.
  const searchField = (
    <SearchForm
      key={query}
      id="search-page-input"
      defaultValue={query}
      label="Search your learning"
      placeholder="Search anything..."
      className="mx-auto mt-8 w-full max-w-181"
    />
  );

  return (
    <PageFrame>
      <SiteHeader />

      <main id="main" className={cn(container, "flex flex-1 flex-col pt-14 pb-20")}>
        <div className="flex flex-col items-center text-center">
          <p className="eyebrow text-neutral-500">{query ? "Search results" : "Search"}</p>

          <h1 className="mt-4 max-w-[22ch] text-[34px] leading-[1.05] font-semibold tracking-[-0.045em] text-balance text-neutral-900 sm:text-[48px]">
            {query ? (
              <>
                Results for{" "}
                <span className="font-pixel font-normal tracking-normal">&ldquo;{query}&rdquo;</span>
              </>
            ) : (
              <>Search your learning</>
            )}
          </h1>

          {!query && (
            <p className="mt-5 text-body-lg text-neutral-500">
              Ask in plain English and Vortex finds the exact lesson and moment.
            </p>
          )}
        </div>

        {query ? (
          // Keyed so a new query or sort remounts into the loading state rather than showing the
          // previous results while the next search runs.
          <SearchResults
            key={`${query}|${sort}`}
            query={query}
            sort={sort}
            searchField={searchField}
          />
        ) : (
          searchField
        )}
      </main>
    </PageFrame>
  );
}
