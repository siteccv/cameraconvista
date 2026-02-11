import { useEffect, useRef, useCallback } from "react";
import { getConsentState, type ConsentState } from "./CookieConsent";

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "";
const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID || "";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

function loadGoogleAnalytics(gaId: string) {
  if (!gaId || document.getElementById("ga-script")) return;
  const script = document.createElement("script");
  script.id = "ga-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", gaId, { anonymize_ip: true });
}

function loadMetaPixel(pixelId: string) {
  if (!pixelId || document.getElementById("fb-pixel-script")) return;
  window.fbq = window.fbq || function () {
    (window.fbq as unknown as { callMethod?: (...a: unknown[]) => void; queue: unknown[] }).queue =
      (window.fbq as unknown as { queue: unknown[] }).queue || [];
    if ((window.fbq as unknown as { callMethod?: (...a: unknown[]) => void }).callMethod) {
      (window.fbq as unknown as { callMethod: (...a: unknown[]) => void }).callMethod(...Array.from(arguments));
    } else {
      (window.fbq as unknown as { queue: unknown[] }).queue.push(arguments);
    }
  };
  window._fbq = window.fbq;

  const script = document.createElement("script");
  script.id = "fb-pixel-script";
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
}

export function ConsentTracking() {
  const appliedRef = useRef<ConsentState>({ analytics: false, marketing: false });

  const applyConsent = useCallback((state: ConsentState) => {
    if (state.analytics && !appliedRef.current.analytics) {
      loadGoogleAnalytics(GA_ID);
    }
    if (state.marketing && !appliedRef.current.marketing) {
      loadMetaPixel(FB_PIXEL_ID);
    }
    appliedRef.current = { ...state };
  }, []);

  useEffect(() => {
    applyConsent(getConsentState());
  }, [applyConsent]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ConsentState>).detail;
      if (detail) applyConsent(detail);
    };
    window.addEventListener("ccv_consent_update", handler);
    return () => window.removeEventListener("ccv_consent_update", handler);
  }, [applyConsent]);

  return null;
}
