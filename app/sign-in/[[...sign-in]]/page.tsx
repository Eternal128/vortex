import { SignIn } from "@clerk/nextjs";
import { AuthShell, clerkAppearance } from "@/components/auth/auth-shell";

export default function SignInPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to pick up where you left off.">
      <SignIn appearance={clerkAppearance} />
    </AuthShell>
  );
}
