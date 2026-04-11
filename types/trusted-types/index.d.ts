import * as lib from "./lib";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface -- interface to allow module augmentation
  interface TrustedHTML extends lib.TrustedHTML {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TrustedScript extends lib.TrustedScript {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TrustedScriptURL extends lib.TrustedScriptURL {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TrustedTypePolicy extends lib.TrustedTypePolicy {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TrustedTypePolicyFactory extends lib.TrustedTypePolicyFactory {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TrustedTypePolicyOptions extends lib.TrustedTypePolicyOptions {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Window extends lib.TrustedTypesWindow {}
}

interface InternalTrustedTypePolicyFactory extends lib.TrustedTypePolicyFactory {
  TrustedHTML: typeof lib.TrustedHTML;
  TrustedScript: typeof lib.TrustedScript;
  TrustedScriptURL: typeof lib.TrustedScriptURL;
}

declare const trustedTypes: InternalTrustedTypePolicyFactory;

declare class TrustedTypesEnforcer {
  constructor(config: TrustedTypeConfig);
  install: () => void;
  uninstall: () => void;
}

declare class TrustedTypeConfig {
  constructor(
    isLoggingEnabled: boolean,
    isEnforcementEnabled: boolean,
    allowedPolicyNames: string[],
    allowDuplicates: boolean,
    cspString?: string | null,
    windowObject?: Window,
  );
}

export {
  TrustedTypeConfig,
  TrustedTypePolicy,
  TrustedTypePolicyFactory,
  trustedTypes,
  TrustedTypesEnforcer,
};
