import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations';
import './globals.css';
import ChatbotBubbleClient from "./components/ChatbotBubbleClient";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={frFR}>
      <html lang="fr">
        <body>
          {children}
          <ChatbotBubbleClient />
        </body>
      </html>
    </ClerkProvider>
  );
}