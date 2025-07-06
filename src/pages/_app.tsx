import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Layout/navbar";

export default function App({ 
  Component, 
  pageProps: { session, ...pageProps }
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Navbar />
      <main className="pt-16">
        <Component {...pageProps} />
      </main>
    </SessionProvider>
  );
}
