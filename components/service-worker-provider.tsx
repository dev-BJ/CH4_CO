"use client";

import type React from "react";
import { useEffect } from "react";
import useSWR from "swr";
import { type ThresholdSettings, DEFAULT_THRESHOLDS } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const { data: thresholdsData } = useSWR<{
    thresholds: ThresholdSettings;
    success: boolean;
  }>("/api/thresholds", fetcher);

  const thresholds = thresholdsData?.thresholds || DEFAULT_THRESHOLDS;

  const sendAlert = () => {
    fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "IoT Alert",
        body: "Sensor threshold exceeded",
      }),
    }).catch((e) => console.error("Push error:", e));
  };

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(async (registration) => {
        console.log("[App] Service Worker registered:", registration.scope);

        // Ensure the service worker is ready before sending START_POLLING
        const readyReg = await navigator.serviceWorker.ready;

        readyReg.active?.postMessage({ type: "START_POLLING" });
      })
      .catch((error) => {
        console.error("[App] Service Worker registration failed:", error);
      });

    // SW message listener
    const onMessage = (event: MessageEvent) => {
      if (event.data.type !== "NEW_DATA") return;

      const data = event.data.data;
      console.log("[App] New data received from SW:", data);

      // Broadcast to components
      window.dispatchEvent(new CustomEvent("sensor-data-update", { detail: data }));

      // --------------------------
      // Threshold checks
      // --------------------------

      if (data.ch4 > thresholds.ch4Max) sendAlert();

      if (data.co > thresholds.coMax) sendAlert();

      if (data.humidity < thresholds.humidityMin || data.humidity > thresholds.humidityMax)
        sendAlert();

      if (data.temperature < thresholds.temperatureMin || data.temperature > thresholds.temperatureMax)
        sendAlert();
    };

    navigator.serviceWorker.addEventListener("message", onMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, [thresholds]); // re-evaluates if thresholds change

  return <>{children}</>;
}
