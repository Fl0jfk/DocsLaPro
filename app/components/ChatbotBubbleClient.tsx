"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { intranetRolesFromUnknown, isEleveBienEtreProfile } from "@/app/lib/bien-etre-profile";

const ChatbotBubble = dynamic(() => import("./ChatbotBubble"), { ssr: false });
const ChatbotBubbleBienEtre = dynamic(() => import("./ChatbotBubbleBienEtre"), { ssr: false });

export default function ChatbotBubbleClient() {
  const { user, isLoaded } = useUser();
  const bienEtreMode = useMemo(() => {
    if (!isLoaded || !user) return false;
    return isEleveBienEtreProfile(intranetRolesFromUnknown(user.publicMetadata));
  }, [isLoaded, user]);

  if (bienEtreMode) return <ChatbotBubbleBienEtre />;
  return <ChatbotBubble />;
}
