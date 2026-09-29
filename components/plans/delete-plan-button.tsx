"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Deletes the learner's plan after a confirmation. */
export function DeletePlanButton({ planKey, title }: { planKey: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm(`Delete "${title}"? Its progress and quiz scores go with it.`)) return;
    setBusy(true);
    const response = await fetch(`/api/plans/${planKey}`, { method: "DELETE" }).catch(() => null);
    if (response?.ok) {
      router.push("/my-learning");
      router.refresh();
      return;
    }
    setBusy(false);
    window.alert("We couldn't delete the plan. Please try again.");
  }

  return (
    <Button variant="tertiary" size="md" onClick={remove} disabled={busy}>
      <Trash2 className="size-4" strokeWidth={2} aria-hidden />
      {busy ? "Deleting…" : "Delete plan"}
    </Button>
  );
}
