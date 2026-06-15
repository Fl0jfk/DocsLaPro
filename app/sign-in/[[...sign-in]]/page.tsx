import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <SignIn
        fallbackRedirectUrl="/dashboard"
        appearance={{
          variables: { colorPrimary: "#111827", colorBackground: "white", borderRadius: "1rem" },
          elements: { logoImage: { width: "100px", height: "auto", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }, logoBox: "my-4"},
        }}
      />
    </div>
  );
}