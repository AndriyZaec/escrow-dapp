import { useState, lazy, Suspense } from "react";
import { WalletButton } from "@/components/WalletButton";
import { BalanceCards } from "@/components/BalanceCards";
import { Clippy } from "@/components/Clippy";

const EscrowPanel = lazy(() => import("@/components/EscrowPanel").then(m => ({ default: m.EscrowPanel })));
const SendForm = lazy(() => import("@/components/SendForm").then(m => ({ default: m.SendForm })));
import { TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useBalance } from "@/hooks/useBalance";
import { useNostalgicMode } from "@/hooks/useNostalgicMode";
import { useWalletConnection } from "@solana/react-hooks";
import { ArrowLeftRight } from "lucide-react";

type Tab = "escrow" | "transfer";

export default function App() {
  const { connected } = useWalletConnection();
  const balances = useBalance();
  const { nostalgic, enableNostalgic, disableNostalgic } = useNostalgicMode();
  const [tab, setTab] = useState<Tab>("escrow");

  return (
    <div className={`min-h-screen bg-slate-950${nostalgic ? " theme-98" : ""}`}>
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <ArrowLeftRight className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-100">
              Escrow<span className="text-blue-400">DApp</span>
            </span>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
              Devnet
            </span>
          </div>
          <div className="flex items-center gap-2">
            {nostalgic && (
              <button
                onClick={disableNostalgic}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Back to Modern
              </button>
            )}
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Balances */}
        <BalanceCards balances={balances} />

        {/* Tabbed content when connected */}
        {connected && (
          <div>
            <TabsList>
              <TabsTrigger
                active={tab === "escrow"}
                onClick={() => setTab("escrow")}
              >
                Offers
              </TabsTrigger>
              <TabsTrigger
                active={tab === "transfer"}
                onClick={() => setTab("transfer")}
              >
                Transfer
              </TabsTrigger>
            </TabsList>

            <Suspense fallback={<div className="py-8 text-center text-sm text-slate-500">Loading…</div>}>
              <TabsContent active={tab === "escrow"}>
                <EscrowPanel balances={balances} nostalgic={nostalgic} />
              </TabsContent>
              <TabsContent active={tab === "transfer"}>
                <SendForm balances={balances} />
              </TabsContent>
            </Suspense>
          </div>
        )}

        {/* Not connected state */}
        {!connected && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-slate-500 text-sm">
              Connect your wallet to send tokens and interact with the escrow.
            </p>
          </div>
        )}
      </main>

      <Clippy nostalgic={nostalgic} onEnable={enableNostalgic} />
    </div>
  );
}
