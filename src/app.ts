// This is the entry point of the application. It initializes the game, sets up the user interface, and manages the game loop.

import http from 'http';
import { Game } from './game/logic';
import { renderUI } from './ui/render';

const game = new Game();

function startGame() {
    game.initialize();
    renderUI(game);

    // Minimal HTTP server to keep the process alive and expose state
    const server = http.createServer((req, res) => {
        if (req.url === '/state') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(game.getState(), null, 2));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(
            'Deal or No Deal running. GET /state to view the current game snapshot.'
        );
    });

    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        console.log(`Server listening on http://localhost:${port}`);
    });
}

startGame();