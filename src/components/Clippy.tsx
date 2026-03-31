import { useState, useRef, useEffect, useCallback } from "react";

const SHARED_TIPS = [
  "Did you know? Solana can process 65,000 transactions per second!",
  "Pro tip: Always double-check the mint address before offering tokens.",
  "Welcome to EscrowDApp! Your trustless token exchange awaits.",
  "Fun fact: This escrow program closes the offer account when someone takes it.",
  "Clippy says: Don't forget to check your balances after a trade!",
  "I see you're swapping tokens. Would you like help with that?",
];

const MODERN_TIPS = ["Tap on me if you want to shed a tear", ...SHARED_TIPS];
const NOSTALGIC_TIPS = [...SHARED_TIPS, "The 90s called. They want their UI back. Oh wait..."];

const TIP_SHOW_MS = 6000;
const TIP_HIDE_MS = 10000;

interface ClippyProps {
  nostalgic: boolean;
  onEnable: () => void;
}

export function Clippy({ nostalgic, onEnable }: ClippyProps) {
  const tips = nostalgic ? NOSTALGIC_TIPS : MODERN_TIPS;
  const [bubbleOpen, setBubbleOpen] = useState(true);
  const tipIndex = useRef(0);
  const [currentTip, setCurrentTip] = useState(tips[0]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Reset to first tip when switching modes
  useEffect(() => {
    tipIndex.current = 0;
    setCurrentTip(tips[0]);
  }, [nostalgic, tips]);

  const nextTip = useCallback(() => {
    tipIndex.current = (tipIndex.current + 1) % tips.length;
    setCurrentTip(tips[tipIndex.current]);
  }, [tips]);

  // Auto show/hide cycle — runs in both modes, starts with current tip
  useEffect(() => {
    function cycle() {
      setBubbleOpen(true);

      timerRef.current = setTimeout(() => {
        setBubbleOpen(false);

        timerRef.current = setTimeout(() => {
          nextTip();
          cycle();
        }, TIP_HIDE_MS);
      }, TIP_SHOW_MS);
    }

    cycle();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [nostalgic, nextTip]);

  function handleClick() {
    if (!nostalgic) {
      onEnable();
      tipIndex.current = 0;
      setCurrentTip(NOSTALGIC_TIPS[0]);
      setBubbleOpen(true);
      return;
    }

    // Manual toggle — reset auto-cycle
    if (timerRef.current) clearTimeout(timerRef.current);
    if (bubbleOpen) {
      setBubbleOpen(false);
    } else {
      nextTip();
      setBubbleOpen(true);
    }
  }

  const bubbleText = currentTip;

  return (
    <div className="clippy-container" style={{ position: "fixed", bottom: 48, right: 48, zIndex: 50 }}>
      {/* Speech bubble */}
      {bubbleOpen && (
        <div
          style={{
            position: "absolute",
            bottom: 136,
            right: 0,
            width: 230,
            padding: "10px 12px",
            background: nostalgic ? "#ffffcc" : "#1e293b",
            color: nostalgic ? "#000" : "#e2e8f0",
            border: nostalgic ? "2px solid #000" : "1px solid #334155",
            borderRadius: nostalgic ? 2 : 8,
            fontSize: 13,
            lineHeight: 1.4,
            boxShadow: nostalgic
              ? "2px 2px 0 #000"
              : "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {bubbleText}
          {/* Tail */}
          <div
            style={{
              position: "absolute",
              bottom: -8,
              right: 52,
              width: 0,
              height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: nostalgic ? "8px solid #000" : "8px solid #334155",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -6,
              right: 53,
              width: 0,
              height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderTop: nostalgic ? "7px solid #ffffcc" : "7px solid #1e293b",
            }}
          />
        </div>
      )}

      {/* Clippy — no box, just the image */}
      <button
        onClick={handleClick}
        title={nostalgic ? "Click for a tip!" : "Enter nostalgic mode"}
        style={{
          width: 128,
          height: 128,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          filter: nostalgic ? "none" : "drop-shadow(0 2px 6px rgba(0,0,0,0.4))",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <img
          src="/clippy.png"
          alt="Clippy"
          style={{ width: 120, height: 120, objectFit: "contain" }}
        />
      </button>
    </div>
  );
}
