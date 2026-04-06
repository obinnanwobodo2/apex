"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const PIXEL_IDS = ["1660410975120063", "1135560875325231"] as const;

function readCookieMap() {
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, entry) => {
      const idx = entry.indexOf("=");
      if (idx === -1) return acc;
      const key = entry.slice(0, idx).trim();
      const value = entry.slice(idx + 1).trim();
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

function hasMarketingConsent() {
  if (typeof document === "undefined") return false;
  const cookies = readCookieMap();
  const values = [
    cookies.apex_cookie_consent,
    cookies.cookie_consent,
    cookies.termly_consent,
    cookies.termly_consent_preferences,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  if (values.length === 0) return false;

  return values.some(
    (value) =>
      value.includes("marketing=true")
      || value.includes("advertising=true")
      || value.includes("\"marketing\":true")
      || value.includes("\"advertising\":true")
      || value.includes("allow_all")
      || value.includes("accept_all")
  );
}

export default function FacebookPixels() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const syncConsent = () => setEnabled(hasMarketingConsent());
    syncConsent();
    window.addEventListener("storage", syncConsent);
    window.addEventListener("apex-consent-updated", syncConsent as EventListener);
    return () => {
      window.removeEventListener("storage", syncConsent);
      window.removeEventListener("apex-consent-updated", syncConsent as EventListener);
    };
  }, []);

  if (!enabled) return null;

  const pixelScript = `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('consent', 'grant');
fbq('init', '${PIXEL_IDS[0]}');
fbq('init', '${PIXEL_IDS[1]}');
fbq('track', 'PageView');
`;

  return <Script id="facebook-pixels-consented" strategy="afterInteractive">{pixelScript}</Script>;
}
