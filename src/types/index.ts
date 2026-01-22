export interface GameState {
    currentRound: number;
    playerCases: number[];
    bankerOffer: number | null;
    isDealAccepted: boolean;
}

export interface Case {
    id: number;
    value: number;
    isRevealed: boolean;
}

export interface Offer {
    amount: number;
    round: number;
}