"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "hsl(222.2 84% 4.9%)",
            color: "hsl(210 40% 98%)",
            border: "1px solid hsl(217.2 32.6% 17.5%)",
          },
        }}
      />
    </SessionProvider>
  );
}
