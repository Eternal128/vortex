"use client";

import { SignInButton } from "@clerk/nextjs";
import { Bookmark, CheckCircle2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import { CourseResumeLink } from "@/components/course/course-resume-link";
import { Button } from "@/components/ui/button";

export type EnrollState = "signed-out" | "not-enrolled" | "enrolled";

interface CourseHeroActionsProps {
  /** Resume point (or the first lesson); null when the curriculum is empty. */
  continueHref: string | null;
  courseSlug: string;
  courseId: string;
  enrollState: EnrollState;
  /** 0–100, real progress including partly watched lessons. */
  percentComplete: number;
  /** The learner has watched at least part of a lesson. */
  started: boolean;
}

async function enroll(courseId: string) {
  const response = await fetch("/api/enroll", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ courseId }),
  });
  return response.ok;
}

/**
 * The course hero's primary action. Signed out, "Enroll for free" signs the learner in and comes
 * back with `?enroll=1`, which finishes the enrollment. Enrolled, it becomes Start or Continue.
 */
export function CourseHeroActions({
  continueHref,
  courseSlug,
  courseId,
  enrollState,
  percentComplete,
  started,
}: CourseHeroActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const autoEnrolled = useRef(false);

  // Back from sign-in with ?enroll=1: finish what the learner asked for, then tidy the URL.
  useEffect(() => {
    if (enrollState !== "not-enrolled" || searchParams.get("enroll") !== "1" || autoEnrolled.current) return;
    autoEnrolled.current = true;
    void enroll(courseId).then((ok) => {
      if (ok) posthog.capture("course_enrolled", { course_slug: courseSlug, source: "after_sign_in" });
      router.replace(pathname, { scroll: false });
      router.refresh();
    });
  }, [enrollState, searchParams, courseId, courseSlug, pathname, router]);

  async function onEnroll() {
    setBusy(true);
    setFailed(false);
    const ok = await enroll(courseId);
    if (ok) {
      posthog.capture("course_enrolled", { course_slug: courseSlug, source: "course_hero" });
      router.refresh();
    } else {
      setFailed(true);
    }
    setBusy(false);
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        {enrollState === "enrolled" ? (
          continueHref && (
            <CourseResumeLink
              href={continueHref}
              courseSlug={courseSlug}
              location="hero"
              percentComplete={percentComplete}
              label={started ? "Continue" : "Start course"}
              className="h-12 px-6"
            />
          )
        ) : enrollState === "signed-out" ? (
          <SignInButton mode="modal" forceRedirectUrl={`${pathname}?enroll=1`} signUpForceRedirectUrl={`${pathname}?enroll=1`}>
            <Button className="h-12 px-6">Enroll for free</Button>
          </SignInButton>
        ) : (
          <Button className="h-12 px-6" onClick={onEnroll} disabled={busy}>
            {busy ? "Enrolling…" : "Enroll for free"}
          </Button>
        )}
        <Button
          type="button"
          variant="tertiary"
          className="h-12 px-6"
          onClick={() => posthog.capture("course_bookmarked", { course_slug: courseSlug })}
        >
          <Bookmark className="size-5" strokeWidth={2} aria-hidden />
          Bookmark
        </Button>
      </div>
      {enrollState === "enrolled" && (
        <p className="flex items-center gap-2 text-body text-neutral-500">
          <CheckCircle2 className="size-4 text-success" strokeWidth={2.25} aria-hidden />
          <span className="font-semibold text-success">Enrolled</span>
          <span>{started ? `${percentComplete}% complete` : "Not started yet"}</span>
        </p>
      )}
      {failed && (
        <p role="alert" className="text-body text-error">
          We couldn&rsquo;t enroll you just now. Please try again.
        </p>
      )}
    </div>
  );
}
