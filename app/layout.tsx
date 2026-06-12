import './globals.css';
import ChatbotBubbleClient from "./components/ChatbotBubbleClient";
import TenantClerkProvider from "./components/TenantClerkProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <TenantClerkProvider>
          {children}
          <ChatbotBubbleClient/>
        </TenantClerkProvider>
      </body>
    </html>
  );
}