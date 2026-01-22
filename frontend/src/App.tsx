import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { baseSepolia } from "viem/chains";
import { CONFIG } from "./lib/config";
import { Home } from "./pages/Home";
import { Markets } from "./pages/Markets";
import { Admin } from "./pages/Admin";
import "./index.css";

const qc = new QueryClient();

export default function App() {
  return (
    <PrivyProvider
      appId={CONFIG.privyAppId}
      config={{
        appearance: { theme: "dark", accentColor: "#FF6B00" },
        embeddedWallets: { createOnLogin: "users-without-wallets" },
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia],
        loginMethods: ["twitter", "wallet"],
      }}
    >
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
