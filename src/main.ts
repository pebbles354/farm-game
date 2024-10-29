import * as PIXI from 'pixi.js';
import { Game } from './game/game.ts';
import './style.css';
import { loadSpritesheets } from './SpritesheetLoader.ts';

// Create the PIXI application
const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0x7cba3d,
  resolution: window.devicePixelRatio || 1,
  antialias: true,
  autoDensity: true,
});

// Add the canvas to the DOM
document.getElementById('app').appendChild(app.view);

// Start the game
const game = new Game(app);
game.init();

// Handle window resizing
window.addEventListener('resize', () => {
  app.renderer.resize(window.innerWidth, window.innerHeight);
});