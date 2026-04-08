import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations';
import './globals.css';
import ChatbotBubble from './components/ChatbotBubble';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={frFR}>
      <html lang="fr">
        <body>
          {children}
          <ChatbotBubble />
        </body>
      </html>
    </ClerkProvider>
  );
}