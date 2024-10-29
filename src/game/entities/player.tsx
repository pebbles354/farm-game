import * as PIXI from 'pixi.js';
import { characters, Character } from '../../../data/characters';
import { Assets } from 'pixi.js';
import { data as f1Data } from '../../../data/spritesheets/f1';

export class Player {
  private speed: number;
  private tileSize: number;
  private sprite: PIXI.AnimatedSprite;
  private keys: { [key: string]: boolean };
  private character: Character;
  private spritesheet: PIXI.Spritesheet | null = null;

  constructor(x: number, y: number, tileSize: number) {
    this.speed = 4;
    this.tileSize = tileSize;
    
    // Select a character (for example, the first one)
    this.character = characters[0];
    console.log('Selected character:', this.character);
    
    // Create an AnimatedSprite for the character
    this.sprite = new PIXI.AnimatedSprite([PIXI.Texture.EMPTY]);
    
    // Set sprite properties
    this.sprite.anchor.set(0.5);
    
    // Set position
    this.sprite.position.set(x, y);
    
    // Initialize movement state
    this.keys = {};
    this.setupKeyboardListeners();

    // Load character sprite
    this.loadCharacterSprite();
  }

  private async loadCharacterSprite(): Promise<void> {
    const texture = await Assets.load('assets/32x32folk.png');
    this.spritesheet = new PIXI.Spritesheet(texture, f1Data);
    await this.spritesheet.parse();

    if (this.spritesheet.animations['down']) {
      this.sprite.textures = this.spritesheet.animations['down'];
      this.sprite.play();
    }
  }

  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.keys[e.key] = true;
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keys[e.key] = false;
    });
  }

  public update(): void {
    if (!this.spritesheet) return;

    let isMoving = false;
    let direction = '';

    // Handle movement
    if (this.keys['ArrowLeft']) {
      this.sprite.x -= this.speed;
      direction = 'left';
      isMoving = true;
    }
    if (this.keys['ArrowRight']) {
      this.sprite.x += this.speed;
      direction = 'right';
      isMoving = true;
    }
    if (this.keys['ArrowUp']) {
      this.sprite.y -= this.speed;
      direction = 'up';
      isMoving = true;
    }
    if (this.keys['ArrowDown']) {
      this.sprite.y += this.speed;
      direction = 'down';
      isMoving = true;
    }

    // Update animation based on movement
    if (isMoving && this.spritesheet.animations[direction]) {
      this.sprite.textures = this.spritesheet.animations[direction];
      if (!this.sprite.playing) {
        this.sprite.play();
      }
    } else if (!isMoving) {
      this.sprite.stop();
      // Set to first frame of current direction
      if (direction && this.spritesheet.animations[direction]) {
        this.sprite.texture = this.spritesheet.animations[direction][0];
      }
    }
  }

  public getPosition(): { x: number, y: number } {
    return {
      x: this.sprite.x,
      y: this.sprite.y
    };
  }

  public getSprite(): PIXI.AnimatedSprite {
    return this.sprite;
  }
}