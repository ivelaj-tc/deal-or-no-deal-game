"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Game, { CASE_VALUES, GameSnapshot } from '@/game/logic';
import CaseButton from '@/ui/components/CaseButton';

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

// Classic Deal or No Deal offer thresholds (cases opened) per round
const OFFER_THRESHOLDS = [6, 11, 15, 18, 20, 21, 22, 23, 24, 25];

const shouldTriggerOffer = (openedCount: number, offersMade: number, playerCaseIndex: number | null) => {
  if (playerCaseIndex === null) return false;
  const threshold = OFFER_THRESHOLDS[offersMade];
  if (threshold === undefined) return false;
  return openedCount >= threshold;
};

const MoneyColumn = ({ values, remaining }: { values: number[]; remaining: Set<number> }) => (
  <div className="money-column">
    {values.map((val) => {
      const live = remaining.has(val);
      return (
        <div key={val} className={`money-row ${live ? 'live' : 'dead'}`}>
          <span>{formatCurrency(val)}</span>
        </div>
      );
    })}
  </div>
);

const REVEAL_SOUND = '/sounds/reveal.mp3';
const OFFER_SOUND = '/sounds/offer.mp3';

const playSound = (src: string) => {
  try {
    const audio = new Audio(src);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {
    // ignore audio errors (e.g., autoplay restrictions)
  }
};

export default function HomePage() {
  const game = useMemo(() => new Game(), []);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [lastReveal, setLastReveal] = useState<{ index: number; value: number } | null>(null);
  const [modalReveal, setModalReveal] = useState<{ index: number; value: number | null } | null>(null);
  const [modalOffer, setModalOffer] = useState<number | null>(null);
  const [queuedOffer, setQueuedOffer] = useState<number | null>(null);
  const [modalResult, setModalResult] = useState<number | null>(null);
  const [revealingIndex, setRevealingIndex] = useState<number | null>(null);
  const [pendingPlayerReveal, setPendingPlayerReveal] = useState(false);
  const [offerVisible, setOfferVisible] = useState(false);
  const [offerButtonsVisible, setOfferButtonsVisible] = useState(false);
  const [displayRemaining, setDisplayRemaining] = useState<number[]>(CASE_VALUES);
  const [pendingRemaining, setPendingRemaining] = useState<number[] | null>(null);
  const [status, setStatus] = useState('Pick your case to start.');
  const revealTimerRef = useRef<number | null>(null);
  const offerTimerRef = useRef<number | null>(null);
  const offerButtonsTimerRef = useRef<number | null>(null);

  const applyPendingRemaining = useCallback(() => {
    if (pendingRemaining) {
      setDisplayRemaining(pendingRemaining);
      setPendingRemaining(null);
    }
  }, [pendingRemaining]);

  useEffect(() => {
    if (modalReveal && modalReveal.value !== null) {
      playSound(REVEAL_SOUND);
    }
    if (modalOffer !== null) {
      playSound(OFFER_SOUND);
    }
  }, [modalReveal, modalOffer]);

  useEffect(() => {
    game.initialize();
    const state = game.getState();
    setSnapshot(state);
    setDisplayRemaining(state.remainingValues);
    setPendingRemaining(null);
  }, [game]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalReveal) {
        if (modalReveal.value !== null) setLastReveal(modalReveal as { index: number; value: number });
        applyPendingRemaining();
        setModalReveal(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [modalReveal, applyPendingRemaining]);

  useEffect(() => {
    if (!modalReveal || modalReveal.value === null) return undefined;
    const timer = window.setTimeout(() => {
      setLastReveal(modalReveal as { index: number; value: number });
      applyPendingRemaining();
      setModalReveal(null);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [modalReveal, applyPendingRemaining]);

  useEffect(() => () => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
    }
    if (offerTimerRef.current) {
      window.clearTimeout(offerTimerRef.current);
    }
    if (offerButtonsTimerRef.current) {
      window.clearTimeout(offerButtonsTimerRef.current);
    }
  }, []);

  const refresh = useCallback(
    (message?: string) => {
      const state = game.getState();
      setSnapshot(state);
      if (message) setStatus(message);
    },
    [game],
  );

  useEffect(() => {
    if (!modalReveal && queuedOffer !== null) {
      setModalOffer(queuedOffer);
      refresh(`Banker offers ${formatCurrency(queuedOffer)}.`);
      setQueuedOffer(null);
    }
  }, [modalReveal, queuedOffer, refresh]);

  useEffect(() => {
    if (offerTimerRef.current) {
      window.clearTimeout(offerTimerRef.current);
      offerTimerRef.current = null;
    }
    if (offerButtonsTimerRef.current) {
      window.clearTimeout(offerButtonsTimerRef.current);
      offerButtonsTimerRef.current = null;
    }
    if (modalOffer !== null) {
      setOfferVisible(false);
      setOfferButtonsVisible(false);
      offerTimerRef.current = window.setTimeout(() => {
        setOfferVisible(true);
        offerTimerRef.current = null;
      }, 2000);
      offerButtonsTimerRef.current = window.setTimeout(() => {
        setOfferButtonsVisible(true);
        offerButtonsTimerRef.current = null;
      }, 2000);
    } else {
      setOfferVisible(false);
      setOfferButtonsVisible(false);
    }
  }, [modalOffer]);

  const handleCaseClick = (index: number) => {
    // Block interaction while an offer is up, a reveal is in progress, or one is queued
    if (
      !snapshot ||
      snapshot.isDealAccepted ||
      modalOffer !== null ||
      modalReveal !== null ||
      queuedOffer !== null ||
      revealTimerRef.current !== null ||
      pendingPlayerReveal
    ) {
      return;
    }

    // First click chooses the player's case; subsequent clicks reveal other cases
    if (snapshot.playerCaseIndex === null) {
      const chosen = game.selectPlayerCase(index);
      if (chosen) {
        refresh(`You picked case ${index + 1}. Now open other cases.`);
      }
      return;
    }

    const value = game.revealCase(index);
    if (value === null) {
      setStatus('Case already opened or invalid.');
      return;
    }

    // Show modal immediately but keep value blank; reveal value after a delay
    const remainingBeforeReveal = snapshot.remainingValues;
    refresh(`Opening case ${index + 1}...`);
    playSound(REVEAL_SOUND);
    setDisplayRemaining(remainingBeforeReveal);
    setModalReveal({ index, value: null });
    setRevealingIndex(index);
    window.setTimeout(() => setRevealingIndex((current: number | null) => (current === index ? null : current)), 2400);

    // Banker offers only after required cases are opened for the current round
    const nextState = game.getState();
    const openedCount = nextState.openedCases.length;
    const offersMade = nextState.offers.length;
    const isFinalTwo = nextState.remainingValues.length === 2;
    const shouldOffer = !isFinalTwo && shouldTriggerOffer(openedCount, offersMade, nextState.playerCaseIndex);
    let pendingOffer: number | null = null;
    if (shouldOffer) {
      pendingOffer = game.getBankerOffer();
      setQueuedOffer(pendingOffer);
    }
    if (isFinalTwo) {
      setPendingPlayerReveal(true);
    }

    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
    }
    revealTimerRef.current = window.setTimeout(() => {
      setModalReveal({ index, value });
      const updated = game.getState();
      setSnapshot(updated);
      setPendingRemaining(updated.remainingValues);
      refresh(`Case ${index + 1} had ${formatCurrency(value)}.`);
      revealTimerRef.current = null;
    }, 6000);
  };

  useEffect(() => {
    if (!pendingPlayerReveal || modalReveal !== null || modalOffer !== null || revealTimerRef.current !== null) return;
    const stateBefore = game.getState();
    if (stateBefore.playerCaseIndex === null) {
      setPendingPlayerReveal(false);
      return;
    }

    const finalReveal = game.revealPlayerCase();
    if (!finalReveal) {
      setPendingPlayerReveal(false);
      return;
    }

    const afterReveal = game.getState();
    setModalReveal({ index: finalReveal.index, value: null });
    setRevealingIndex(finalReveal.index);
    setPendingRemaining(afterReveal.remainingValues);
    refresh('Final reveal: your case.');

    revealTimerRef.current = window.setTimeout(() => {
      setModalReveal({ index: finalReveal.index, value: finalReveal.value });
      setSnapshot(afterReveal);
      setModalResult(finalReveal.value);
      refresh(`Your case had ${formatCurrency(finalReveal.value)}. Game over.`);
      revealTimerRef.current = null;
    }, 5000);

    setPendingPlayerReveal(false);
  }, [pendingPlayerReveal, modalReveal, modalOffer, game, refresh]);

  const acceptOffer = () => {
    if (!snapshot || snapshot.bankerOffer === null) return;
    game.playerDecision('deal');
    const playerValue = game.getPlayerCaseValue();
    if (offerTimerRef.current) {
      window.clearTimeout(offerTimerRef.current);
      offerTimerRef.current = null;
    }
    if (offerButtonsTimerRef.current) {
      window.clearTimeout(offerButtonsTimerRef.current);
      offerButtonsTimerRef.current = null;
    }
    setOfferVisible(false);
    setOfferButtonsVisible(false);
    setModalOffer(null);
    setQueuedOffer(null);
    setModalResult(playerValue ?? null);
    refresh(
      `You accepted ${formatCurrency(snapshot.bankerOffer)}.${
        playerValue !== null ? ` Your case had ${formatCurrency(playerValue)}.` : ''
      } Game over!`,
    );
  };

  const rejectOffer = () => {
    if (!snapshot || snapshot.bankerOffer === null) return;
    game.playerDecision('no deal');
    if (offerTimerRef.current) {
      window.clearTimeout(offerTimerRef.current);
      offerTimerRef.current = null;
    }
    if (offerButtonsTimerRef.current) {
      window.clearTimeout(offerButtonsTimerRef.current);
      offerButtonsTimerRef.current = null;
    }
    setOfferVisible(false);
    setOfferButtonsVisible(false);
    setModalOffer(null);
    setQueuedOffer(null);
    refresh('No deal. Keep opening cases.');
  };

  const resetGame = () => {
    const fresh = game.reset();
    setSnapshot(fresh);
    setDisplayRemaining(fresh.remainingValues);
    setPendingRemaining(null);
    setLastReveal(null);
    setPendingPlayerReveal(false);
    setModalResult(null);
    setOfferVisible(false);
    setOfferButtonsVisible(false);
    setStatus('Pick your case to start.');
  };

  if (!snapshot) return null;

  const openedSet = new Set(snapshot.openedCases.map((c) => c.index));
  const remainingValues = [...displayRemaining].sort((a, b) => b - a);
  const remainingSet = new Set(displayRemaining);
  const mid = Math.ceil(CASE_VALUES.length / 2);
  const leftValues = [...CASE_VALUES].slice(0, mid).sort((a, b) => a - b);
  const rightValues = [...CASE_VALUES].slice(mid).sort((a, b) => a - b);

  return (
    <main className="page">
      <header className="header">
        <div>
          <p className="eyebrow">Classic TV game</p>
          <h1>Deal or No Deal</h1>
          <p className="status">{status}</p>
        </div>
        <div className="actions">
          {snapshot.isDealAccepted && (
            <button onClick={resetGame}>Play again</button>
          )}
        </div>
      </header>

      <section className="stage">
        <div className="money-board">
          <MoneyColumn values={leftValues} remaining={remainingSet} />
        </div>

        <div className="center-stack">
          <div className="panel">
            <div className="panel-head">
              <div className="tag">Cases</div>
              <div className="meta">
                <span>Remaining: {remainingValues.length}</span>
                {snapshot.playerCaseIndex !== null && <span>Your case: {snapshot.playerCaseIndex + 1}</span>}
              </div>
            </div>
            <div className="cases-grid">
              {CASE_VALUES.map((_, index) => {
                const isPlayerCase = snapshot.playerCaseIndex === index;
                const isOpened = openedSet.has(index);

                return (
                  <CaseButton
                    key={index}
                    index={index}
                    isOpened={isOpened}
                    isPlayerCase={isPlayerCase}
                    isRevealing={revealingIndex === index}
                    disabled={snapshot.isDealAccepted}
                    onClick={() => handleCaseClick(index)}
                  />
                );
              })}
            </div>
          </div>

          <div className="panel info">
            <div className="card">
              <h3>Last reveal</h3>
              {lastReveal ? (
                <p>
                  Case {lastReveal.index + 1} had <strong>{formatCurrency(lastReveal.value)}</strong>
                </p>
              ) : (
                <p>No case opened yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="money-board">
          <MoneyColumn values={rightValues} remaining={remainingSet} />
        </div>
      </section>

      {modalReveal && (
        <div className="modal-backdrop">
          <div className="modal-card suitcase">
            <p className="eyebrow">Case {modalReveal.index + 1}</p>
            <div className="suitcase-video-frame">
              <video
                className={`suitcase-video ${modalReveal.value !== null ? 'open' : ''}`}
                src="/suitcase.webm"
                autoPlay
                muted
                playsInline
              />
              <div className="value-slot overlay">
                <h2 className={`flip-value ${modalReveal.value !== null ? 'flip-active' : ''}`}>
                  {modalReveal.value === null ? '' : formatCurrency(modalReveal.value)}
                </h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOffer !== null && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <p className="eyebrow">Banker wants to make an offer:</p>
            <h2 className={`flip-value ${offerVisible ? 'flip-active' : ''}`}>
              {offerVisible ? formatCurrency(modalOffer) : ''}
            </h2>
            {offerButtonsVisible && (
              <div className="deal-actions">
                <button onClick={acceptOffer}>Deal</button>
                <button onClick={rejectOffer}>No Deal</button>
              </div>
            )}
          </div>
        </div>
      )}

      {modalResult !== null && (
        <div className="modal-backdrop" onClick={() => setModalResult(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow">Your case</p>
            <h2 className="flip-value flip-active">{formatCurrency(modalResult)}</h2>
            <p className="muted">You stuck with your original case.</p>
            <div className="deal-actions">
              <button onClick={() => setModalResult(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
