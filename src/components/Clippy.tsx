import { useState, useRef } from 'react';

const TIPS = [
  'Did you know? Solana can process 65,000 transactions per second!',
  'Pro tip: Always double-check the mint address before offering tokens.',
  'Welcome to EscrowDApp! Your trustless token exchange awaits.',
  'Remember: on-chain is the real guard. Supabase is just for convenience.',
  'Fun fact: This escrow program closes the offer account when someone takes it.',
  "Clippy says: Don't forget to check your balances after a trade!",
  "I see you're swapping tokens. Would you like help with that?",
  'The 90s called. They want their UI back. Oh wait...',
];

interface ClippyProps {
  nostalgic: boolean;
  onEnable: () => void;
}

export function Clippy({ nostalgic, onEnable }: ClippyProps) {
  const [bubbleOpen, setBubbleOpen] = useState(true);
  const tipIndex = useRef(0);
  const [currentTip, setCurrentTip] = useState(TIPS[0]);

  function handleClick() {
    if (!nostalgic) {
      onEnable();
      tipIndex.current = 0;
      setCurrentTip(TIPS[0]);
      setBubbleOpen(true);
      return;
    }

    if (bubbleOpen) {
      setBubbleOpen(false);
    } else {
      tipIndex.current = (tipIndex.current + 1) % TIPS.length;
      setCurrentTip(TIPS[tipIndex.current]);
      setBubbleOpen(true);
    }
  }

  const bubbleText = nostalgic
    ? currentTip
    : 'Tap on me if you want to shed a tear';

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 50 }}>
      {/* Speech bubble */}
      {bubbleOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 56,
            right: 0,
            width: 220,
            padding: '10px 12px',
            background: nostalgic ? '#ffffcc' : '#1e293b',
            color: nostalgic ? '#000' : '#e2e8f0',
            border: nostalgic ? '2px solid #000' : '1px solid #334155',
            borderRadius: nostalgic ? 2 : 8,
            fontSize: 13,
            lineHeight: 1.4,
            boxShadow: nostalgic
              ? '2px 2px 0 #000'
              : '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {bubbleText}
          {nostalgic && (
            <button
              onClick={e => {
                e.stopPropagation();
                setBubbleOpen(false);
              }}
              style={{
                position: 'absolute',
                top: 2,
                right: 4,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                color: '#666',
                padding: '0 2px',
              }}
            >
              x
            </button>
          )}
          {/* Tail */}
          <div
            style={{
              position: 'absolute',
              bottom: -8,
              right: 18,
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: nostalgic
                ? '8px solid #000'
                : '8px solid #334155',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -6,
              right: 19,
              width: 0,
              height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: nostalgic
                ? '7px solid #ffffcc'
                : '7px solid #1e293b',
            }}
          />
        </div>
      )}

      {/* Clippy button */}
      <button
        onClick={handleClick}
        title={nostalgic ? 'Click for a tip!' : 'Enter nostalgic mode'}
        style={{
          width: 52,
          height: 52,
          borderRadius: nostalgic ? 0 : 12,
          border: nostalgic ? '2px outset #c0c0c0' : '1px solid #334155',
          background: nostalgic ? '#c0c0c0' : '#1e293b',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4,
          boxShadow: nostalgic
            ? 'inset -1px -1px #0a0a0a, inset 1px 1px #fff'
            : '0 2px 8px rgba(0,0,0,0.3)',
          transition: 'all 0.2s',
        }}
      >
        <img src="/clippy.png" alt="Clippy" style={{ width: 40, height: 40, objectFit: 'contain' }} />
      </button>
    </div>
  );
}
