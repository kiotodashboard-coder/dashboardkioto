// Secure API fetch helper that routes requests to the correct host dynamically
const customApiUrl = (import.meta as any).env?.VITE_API_URL || "https://ais-pre-3arbs2kotcgihptz3rbf6o-82971551649.us-east1.run.app";

export async function customFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === "string" ? input : (input as any).url || String(input);
  
  if (url.startsWith("/api/")) {
    const hostname = typeof window !== "undefined" ? window.location.hostname : "";
    const isLocalOrSandbox = hostname === "localhost" || hostname === "127.0.0.1" || hostname.includes("run.app");
    
    // Only prepend Cloud Run URL if we are hosted externally (like on Vercel)
    if (!isLocalOrSandbox) {
      url = `${customApiUrl.replace(/\/$/, "")}${url}`;
    }
  }
  
  return fetch(url, init);
}
