import { SignIn } from "@clerk/nextjs";
import { headers } from "next/headers";
import { getTenant } from "@/app/lib/tenant-context";
import { clerkAfterSignInUrl } from "@/app/lib/tenant-auth-urls";

export default async function SignInPage() {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "";
  const tenant = await getTenant();
  const afterSignIn = clerkAfterSignInUrl(tenant, host);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-10">
      <SignIn
        fallbackRedirectUrl={afterSignIn}
        forceRedirectUrl={afterSignIn}
        appearance={{
          variables: {
            colorPrimary: "#2F6B4A",
            colorBackground: "white",
            colorText: "#14231A",
            colorInputBackground: "#FAFAF7",
            borderRadius: "1rem",
          },
          elements: {
            card: "shadow-xl shadow-emerald-900/10 border border-emerald-100",
            formButtonPrimary:
              "bg-gradient-to-r from-[#2F6B4A] to-[#1E4A32] hover:brightness-110",
            logoImage: {
              width: "100px",
              height: "auto",
              filter: "drop-shadow(0 4px 14px rgba(47,107,74,0.25))",
            },
            logoBox: "my-4",
          },
        }}
      />
    </div>
  );
}
