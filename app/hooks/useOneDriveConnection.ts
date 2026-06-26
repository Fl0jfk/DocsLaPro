"use client";

import { useCallback, useEffect, useState } from "react";
import * as msal from "@azure/msal-browser";
import {
  ONEDRIVE_MSAL_SCOPES,
  buildOneDriveMsalConfig,
  fetchMicrosoftOneDrivePublicConfig,
  storeMsalReturnPath,
} from "@/app/lib/msal-onedrive-client";

export const ONEDRIVE_SCOPES = [...ONEDRIVE_MSAL_SCOPES];

let msalInstance: msal.PublicClientApplication | null = null;

function getMsal() {
  if (!msalInstance) throw new Error("MSAL non initialisé");
  return msalInstance;
}

export type OneDriveConnectionState = {
  msalReady: boolean;
  oneDriveEnabled: boolean;
  connected: boolean;
  checking: boolean;
  accountLabel: string | null;
  accessToken: string | null;
  error: string | null;
  login: () => Promise<void>;
  ensureToken: () => Promise<string | null>;
};

export function useOneDriveConnection(): OneDriveConnectionState {
  const [msalReady, setMsalReady] = useState(false);
  const [oneDriveEnabled, setOneDriveEnabled] = useState(false);
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(false);
  const [accountLabel, setAccountLabel] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applySession = useCallback((account: msal.AccountInfo | null, token: string | null) => {
    setAccessToken(token);
    setConnected(Boolean(token));
    setAccountLabel(account?.username ?? account?.name ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ms = await fetchMicrosoftOneDrivePublicConfig();
        if (!ms) {
          if (!cancelled) {
            setOneDriveEnabled(false);
            setMsalReady(true);
          }
          return;
        }
        if (!cancelled) setOneDriveEnabled(true);

        msalInstance = new msal.PublicClientApplication(buildOneDriveMsalConfig(ms));
        await getMsal().initialize();
        await getMsal().handleRedirectPromise();
        if (cancelled) return;
        setMsalReady(true);

        const accounts = getMsal().getAllAccounts();
        if (accounts.length > 0) {
          try {
            const tokenResponse = await getMsal().acquireTokenSilent({
              account: accounts[0],
              scopes: ONEDRIVE_SCOPES,
            });
            const verifyRes = await fetch("https://graph.microsoft.com/v1.0/me/drive?$select=id", {
              headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
            });
            if (!cancelled) {
              applySession(accounts[0], verifyRes.ok ? tokenResponse.accessToken : null);
            }
          } catch {
            if (!cancelled) applySession(accounts[0], null);
          }
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erreur init OneDrive");
          setMsalReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const ensureToken = useCallback(async (): Promise<string | null> => {
    if (!msalReady || !oneDriveEnabled) {
      setError("OneDrive non activé pour cet établissement.");
      return null;
    }
    setChecking(true);
    setError(null);
    try {
      const accounts = getMsal().getAllAccounts();
      if (accounts.length === 0) {
        applySession(null, null);
        setError("Connectez-vous à OneDrive (bouton Connexion Microsoft).");
        return null;
      }
      let token: string;
      try {
        const tokenResponse = await getMsal().acquireTokenSilent({
          account: accounts[0],
          scopes: ONEDRIVE_SCOPES,
        });
        token = tokenResponse.accessToken;
      } catch (err) {
        if (err instanceof msal.InteractionRequiredAuthError) {
          storeMsalReturnPath();
          await getMsal().acquireTokenRedirect({
            account: accounts[0],
            scopes: ONEDRIVE_SCOPES,
          });
          return null;
        }
        throw err;
      }
      const verifyRes = await fetch("https://graph.microsoft.com/v1.0/me/drive?$select=id", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!verifyRes.ok) throw new Error("Session OneDrive expirée ou accès refusé.");
      applySession(accounts[0], token);
      return token;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      applySession(getMsal().getAllAccounts()[0] ?? null, null);
      setError(msg);
      return null;
    } finally {
      setChecking(false);
    }
  }, [applySession, msalReady, oneDriveEnabled]);

  const login = useCallback(async () => {
    if (!msalReady) return;
    setError(null);
    try {
      storeMsalReturnPath();
      await getMsal().loginRedirect({
        scopes: ONEDRIVE_SCOPES,
        prompt: "select_account",
      });
    } catch (e: unknown) {
      if (e instanceof msal.BrowserAuthError && e.errorCode === "interaction_in_progress") {
        setError("Connexion déjà en cours…");
        return;
      }
      setError(e instanceof Error ? e.message : "Échec connexion OneDrive");
    }
  }, [msalReady]);

  return {
    msalReady,
    oneDriveEnabled,
    connected,
    checking,
    accountLabel,
    accessToken,
    error,
    login,
    ensureToken,
  };
}
