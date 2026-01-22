class Banker {
    private offerMultiplier: number;
    private baseOffer: number;

    constructor() {
        this.offerMultiplier = 0.5; // Starting multiplier for offers
        this.baseOffer = 100; // Base offer amount
    }

    public generateOffer(remainingCases: number[], totalValue: number): number {
        const averageValue = totalValue / remainingCases.length;
        const offer = Math.round(averageValue * this.offerMultiplier);
        return Math.max(offer, this.baseOffer); // Ensure the offer is at least the base offer
    }

    public adjustStrategy(remainingCases: number[]): void {
        // Adjust the offer multiplier based on the number of remaining cases
        if (remainingCases.length <= 3) {
            this.offerMultiplier = 0.7; // Increase offer multiplier when fewer cases remain
        } else if (remainingCases.length <= 6) {
            this.offerMultiplier = 0.6; // Moderate offer multiplier
        } else {
            this.offerMultiplier = 0.5; // Default offer multiplier
        }
    }
}

export default Banker;