import { SignUp } from "@clerk/nextjs";
import { AuthShell, clerkAppearance } from "@/components/auth/auth-shell";

export default function SignUpPage() {
  return (
    <AuthShell title="Create your account" subtitle="Free to join. Browse, search and learn in order.">
      <SignUp appearance={clerkAppearance} />
    </AuthShell>
  );
}
