import * as PIXI from 'pixi.js';

export class DebugButton {
  private button: PIXI.Container;

  constructor(app: PIXI.Application, onDebug: () => void) {
    this.button = new PIXI.Container();
    
    // Create button background
    const background = new PIXI.Graphics();
    background.beginFill(0x000000, 0.5);
    background.drawRect(0, 0, 40, 40);
    background.endFill();
    
    // Create "D" text
    const text = new PIXI.Text('D', {
      fill: 0xFFFFFF,
      fontSize: 24,
      fontWeight: 'bold'
    });
    text.position.set(13, 8);
    
    this.button.addChild(background);
    this.button.addChild(text);
    
    // Position in top right corner, next to pause button
    this.button.position.set(
      app.screen.width - 100,
      10
    );
    
    // Make interactive
    this.button.eventMode = 'static';
    this.button.cursor = 'pointer';
    this.button.on('pointerdown', onDebug);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.button.position.set(
        app.screen.width - 100,
        10
      );
    });
  }

  public getContainer(): PIXI.Container {
    return this.button;
  }
} 