"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
}

export function ReCaptcha({ onVerify, onError }: ReCaptchaProps) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
  const isLoaded = useRef(false);

  useEffect(() => {
    if (!siteKey) {
      console.warn("reCAPTCHA site key not configured. CAPTCHA verification will be skipped.");
      // In development, allow form submission without CAPTCHA
      if (process.env.NODE_ENV === "development") {
        onVerify("dev-token");
      }
      return;
    }

    if (isLoaded.current && window.grecaptcha) {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(siteKey, { action: "register" })
          .then((token) => {
            onVerify(token);
          })
          .catch((error) => {
            console.error("reCAPTCHA error:", error);
            onError?.(error.message || "Failed to verify CAPTCHA");
          });
      });
    }
  }, [siteKey, onVerify, onError]);

  const handleScriptLoad = () => {
    isLoaded.current = true;
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(siteKey, { action: "register" })
          .then((token) => {
            onVerify(token);
          })
          .catch((error) => {
            console.error("reCAPTCHA error:", error);
            onError?.(error.message || "Failed to verify CAPTCHA");
          });
      });
    }
  };

  if (!siteKey) {
    return null; // Don't render if no site key
  }

  return (
    <Script
      src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
      onLoad={handleScriptLoad}
      strategy="lazyOnload"
    />
  );
}
