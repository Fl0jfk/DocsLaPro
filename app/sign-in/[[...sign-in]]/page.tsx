import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-10">
      <SignIn
        fallbackRedirectUrl="/dashboard"
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