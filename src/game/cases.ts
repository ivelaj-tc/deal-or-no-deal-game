class Cases {
    private caseValues: number[];
    private revealedCases: Set<number>;

    constructor() {
        this.caseValues = [];
        this.revealedCases = new Set();
    }

    initializeCases(values: number[]) {
        this.caseValues = values;
    }

    revealCase(index: number): number | null {
        if (index < 0 || index >= this.caseValues.length || this.revealedCases.has(index)) {
            return null;
        }
        this.revealedCases.add(index);
        return this.caseValues[index];
    }

    getRemainingCases(): number[] {
        return this.caseValues
            .map((value, index) => (this.revealedCases.has(index) ? null : value))
            .filter(value => value !== null) as number[];
    }

    getRevealedCases(): number[] {
        return Array.from(this.revealedCases);
    }
}

export default Cases;