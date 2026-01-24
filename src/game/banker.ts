export type BankerPersonality = 'balanced' | 'generous' | 'aggressive' | 'volatile';

type PersonalityConfig = {
    baseOffer: number;
    early: number;
    mid: number;
    late: number;
    variance: number;
};

const PERSONALITY_PRESETS: Record<BankerPersonality, PersonalityConfig> = {
    balanced: { baseOffer: 100, early: 0.5, mid: 0.6, late: 0.7, variance: 0 },
    generous: { baseOffer: 250, early: 0.65, mid: 0.75, late: 0.85, variance: 0.03 },
    aggressive: { baseOffer: 80, early: 0.42, mid: 0.5, late: 0.6, variance: 0 },
    volatile: { baseOffer: 120, early: 0.55, mid: 0.65, late: 0.8, variance: 0.08 },
};

class Banker {
    private personality: BankerPersonality;
    private baseOffer: number;
    private earlyMultiplier: number;
    private midMultiplier: number;
    private lateMultiplier: number;
    private variance: number;
    private offerMultiplier: number;

    constructor(personality: BankerPersonality = 'balanced') {
        this.personality = personality;
        this.baseOffer = 100;
        this.earlyMultiplier = 0.5;
        this.midMultiplier = 0.6;
        this.lateMultiplier = 0.7;
        this.variance = 0;
        this.offerMultiplier = this.earlyMultiplier;
        this.applyPersonality(personality);
    }

    public setPersonality(personality: BankerPersonality): void {
        this.personality = personality;
        this.applyPersonality(personality);
    }

    private applyPersonality(personality: BankerPersonality): void {
        const preset = PERSONALITY_PRESETS[personality];
        this.baseOffer = preset.baseOffer;
        this.earlyMultiplier = preset.early;
        this.midMultiplier = preset.mid;
        this.lateMultiplier = preset.late;
        this.variance = preset.variance;
        this.offerMultiplier = this.earlyMultiplier;
    }

    public generateOffer(remainingCases: number[], totalValue: number): number {
        const averageValue = totalValue / remainingCases.length;
        const jitter = this.variance
            ? 1 + ((Math.random() * 2 - 1) * this.variance)
            : 1;
        const offer = Math.round(averageValue * this.offerMultiplier * jitter);
        return Math.max(offer, this.baseOffer);
    }

    public adjustStrategy(remainingCases: number[]): void {
        if (remainingCases.length <= 3) {
            this.offerMultiplier = this.lateMultiplier;
        } else if (remainingCases.length <= 6) {
            this.offerMultiplier = this.midMultiplier;
        } else {
            this.offerMultiplier = this.earlyMultiplier;
        }
    }
}

export { PERSONALITY_PRESETS, Banker };
export default Banker;