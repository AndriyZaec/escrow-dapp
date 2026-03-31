import { useState } from "react";
import { WalletButton } from "@/components/WalletButton";
import { BalanceCards } from "@/components/BalanceCards";
import { SendForm } from "@/components/SendForm";
import { EscrowPanel } from "@/components/EscrowPanel";
import { Clippy } from "@/components/Clippy";
import { TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useBalance } from "@/hooks/useBalance";
import { useNostalgicMode } from "@/hooks/useNostalgicMode";
import { useWalletConnection } from "@solana/react-hooks";

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
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
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
                className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
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

            <TabsContent active={tab === "escrow"}>
              <EscrowPanel balances={balances} />
            </TabsContent>
            <TabsContent active={tab === "transfer"}>
              <SendForm balances={balances} />
            </TabsContent>
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
