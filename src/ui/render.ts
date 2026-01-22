import { Game } from '../game/logic';

// Minimal CLI-oriented renderer so the game can run without a browser
export function renderUI(game: Game): void {
    const state = game.getState();
    // Provide a brief summary of the initialized game
    console.log('Deal or No Deal started');
    console.log(`Round: ${state.currentRound}`);
    console.log(`Cases remaining: ${state.remainingValues.length}`);
    if (state.playerCaseIndex === null) {
        console.log('Select your case with game.selectPlayerCase(index).');
    }
}
