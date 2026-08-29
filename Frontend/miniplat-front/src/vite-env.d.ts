/// <reference types="vite/client" />

/**
 * Uten denne er import.meta.env.VITE_* av typen any, og en skrivefeil i variabelnavnet
 * blir undefined ved kjøring i stedet for en kompileringsfeil.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ADMIN_USERNAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
