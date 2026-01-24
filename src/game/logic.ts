import Banker, { BankerPersonality } from './banker';
import Cases from './cases';
import { GameState, Offer } from '../types';

// Typical Deal or No Deal case values
export const CASE_VALUES: number[] = [
    0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000,
    5000, 10000, 25000, 50000, 75000, 100000, 200000, 300000,
    400000, 500000, 750000, 1000000,
];

const shuffle = <T,>(values: T[]): T[] => {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

export type GameSnapshot = GameState & {
    playerCaseIndex: number | null;
    openedCases: Array<{ index: number; value: number }>;
    remainingValues: number[];
    offers: Offer[];
};

export class Game {
    private banker: Banker;
    private cases: Cases;
    private state: GameSnapshot;

    constructor(personality: BankerPersonality = 'balanced') {
        this.banker = new Banker(personality);
        this.cases = new Cases();
        this.state = {
            currentRound: 1,
            playerCases: [],
            bankerOffer: null,
            isDealAccepted: false,
            bankerPersonality: personality,
            playerCaseIndex: null,
            openedCases: [],
            remainingValues: [],
            offers: [],
        };
    }

    public initialize(): void {
        const randomized = shuffle(CASE_VALUES);
        this.cases.initializeCases(randomized);
        const personality = this.state.bankerPersonality ?? 'balanced';
        this.banker.setPersonality(personality as BankerPersonality);
        this.state = {
            currentRound: 1,
            playerCases: [],
            bankerOffer: null,
            isDealAccepted: false,
            bankerPersonality: personality,
            playerCaseIndex: null,
            openedCases: [],
            remainingValues: randomized,
            offers: [],
        };
    }

    public selectPlayerCase(index: number): boolean {
        if (this.state.playerCaseIndex !== null) return false;
        if (!this.isValidIndex(index)) return false;
        this.state.playerCaseIndex = index;
        this.state.playerCases = [index];
        return true;
    }

    public revealCase(index: number): number | null {
        if (!this.isValidIndex(index)) return null;
        if (this.state.playerCaseIndex === index) return null; // cannot open your own case
        const value = this.cases.revealCase(index);
        if (value === null) return null;

        this.state.openedCases.push({ index, value });
        this.state.remainingValues = this.cases.getRemainingCases();
        return value;
    }

    public getBankerOffer(): number | null {
        const remaining = this.cases.getRemainingCases();
        if (remaining.length <= 2) return null;
        const total = remaining.reduce((sum, value) => sum + value, 0);
        this.banker.adjustStrategy(remaining);
        const offer = this.banker.generateOffer(remaining, total);
        this.state.bankerOffer = offer;
        this.state.offers.push({ amount: offer, round: this.state.currentRound });
        return offer;
    }

    public setBankerPersonality(personality: BankerPersonality): void {
        this.state.bankerPersonality = personality;
        this.banker.setPersonality(personality);
    }

    public revealPlayerCase(): { index: number; value: number } | null {
        if (this.state.playerCaseIndex === null) return null;
        const playerIndex = this.state.playerCaseIndex;
        const alreadyOpened = this.state.openedCases.some((c) => c.index === playerIndex);
        if (alreadyOpened) return null;
        const value = this.cases.revealCase(playerIndex);
        if (value === null) return null;

        this.state.openedCases.push({ index: playerIndex, value });
        this.state.remainingValues = this.cases.getRemainingCases();
        // Lock the game after final reveal
        this.state.isDealAccepted = true;

        return { index: playerIndex, value };
    }

    public playerDecision(decision: 'deal' | 'no deal'): void {
        if (decision === 'deal') {
            this.state.isDealAccepted = true;
        } else {
            this.state.bankerOffer = null;
            this.state.currentRound += 1;
        }
    }

    public getState(): GameSnapshot {
        return { ...this.state };
    }

    public getRemainingCaseCount(): number {
        return this.cases.getRemainingCases().length;
    }

    public getPlayerCaseValue(): number | null {
        if (this.state.playerCaseIndex === null) return null;
        const idx = this.state.playerCaseIndex;
        const cases = this.cases.getRemainingCases();
        // Remaining cases mirror unrevealed values, but player's case is still hidden in revealed list
        // So we need to look back into openedCases + remainingValues to find the original slot
        // Simpler: reconstruct full case list from opened + remaining
        const totalCases = this.state.openedCases.length + cases.length + 1; // player case included
        const reconstructed: Array<number | null> = new Array(totalCases).fill(null);
        this.state.openedCases.forEach(({ index, value }) => {
            reconstructed[index] = value;
        });
        // remaining cases are in order; fill nulls
        let remIdx = 0;
        for (let i = 0; i < reconstructed.length; i += 1) {
            if (reconstructed[i] === null) {
                reconstructed[i] = cases[remIdx] ?? null;
                remIdx += 1;
            }
        }
        return reconstructed[idx] ?? null;
    }

    public reset(): GameSnapshot {
        this.initialize();
        return this.getState();
    }

    private isValidIndex(index: number): boolean {
        const max = CASE_VALUES.length;
        return Number.isInteger(index) && index >= 0 && index < max;
    }
}

export default Game;
export type { BankerPersonality } from './banker';