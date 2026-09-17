"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function AffiliateTourDetailRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params?.id) {
      const search = typeof window !== "undefined" ? window.location.search : "";
      router.replace(`/leader/admin/tours/${params.id}${search}`);
    }
  }, [router, params]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-gray-600 font-medium">
          Redirecting to Adventure Leader Tour Operations...
        </p>
      </div>
    </div>
  );
}
