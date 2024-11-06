import * as PIXI from 'pixi.js';

export class PauseButton {
  private button: PIXI.Container;
  private isPaused: boolean = false;
  private callback: (isPaused: boolean) => void;

  constructor(app: PIXI.Application, callback: (isPaused: boolean) => void) {
    this.callback = callback;
    this.button = new PIXI.Container();
    
    // Create button background
    const background = new PIXI.Graphics();
    background.beginFill(0x000000, 0.5);
    background.drawRect(0, 0, 40, 40);
    background.endFill();
    
    // Create pause/play icon
    const icon = new PIXI.Graphics();
    this.drawPauseIcon(icon);
    
    this.button.addChild(background);
    this.button.addChild(icon);
    
    // Position in top right corner
    this.button.position.set(
      app.screen.width - 50,
      10
    );
    
    // Make interactive
    this.button.eventMode = 'static';
    this.button.cursor = 'pointer';
    this.button.on('pointerdown', () => this.togglePause());
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.button.position.set(
        app.screen.width - 50,
        10
      );
    });
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    const icon = this.button.getChildAt(1) as PIXI.Graphics;
    icon.clear();
    
    if (this.isPaused) {
      this.drawPlayIcon(icon);
    } else {
      this.drawPauseIcon(icon);
    }
    
    this.callback(this.isPaused);
  }

  private drawPauseIcon(graphics: PIXI.Graphics): void {
    graphics.beginFill(0xFFFFFF);
    graphics.drawRect(10, 10, 6, 20);
    graphics.drawRect(24, 10, 6, 20);
    graphics.endFill();
  }

  private drawPlayIcon(graphics: PIXI.Graphics): void {
    graphics.beginFill(0xFFFFFF);
    graphics.moveTo(10, 10);
    graphics.lineTo(30, 20);
    graphics.lineTo(10, 30);
    graphics.closePath();
    graphics.endFill();
  }

  public getContainer(): PIXI.Container {
    return this.button;
  }
} 