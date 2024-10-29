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
  private currentDirection: 'down' | 'up' | 'left' | 'right' = 'down';
  private worldSize: number;
  private world: PIXI.Container;

  constructor(x: number, y: number, tileSize: number, worldSize: number, world: PIXI.Container) {
    this.speed = 4;
    this.tileSize = tileSize;
    this.worldSize = worldSize;
    this.world = world;
    
    this.character = characters[0];
    console.log('Selected character:', this.character);
    
    this.sprite = new PIXI.AnimatedSprite([PIXI.Texture.EMPTY]);
    this.sprite.anchor.set(0.5);
    this.sprite.position.set(x, y);
    this.sprite.animationSpeed = 0.1;
    
    this.keys = {};
    this.setupKeyboardListeners();
    this.loadCharacterSprite();
  }

  private async loadCharacterSprite(): Promise<void> {
    const texture = await Assets.load('assets/32x32folk.png');
    this.spritesheet = new PIXI.Spritesheet(texture, f1Data);
    await this.spritesheet.parse();

    // Set initial animation
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

  private isValidMove(newX: number, newY: number): boolean {
    // Check world boundaries
    const worldPixelSize = this.worldSize * this.tileSize;
    if (newX < 0 || newX > worldPixelSize || newY < 0 || newY > worldPixelSize) {
      return false;
    }

    // Convert pixel coordinates to tile coordinates
    const tileX = Math.floor(newX / this.tileSize);
    const tileY = Math.floor(newY / this.tileSize);

    // Get the WorldGenerator instance from the world
    const worldGenerator = (this.world as any).worldGenerator;
    
    // Check for water tiles
    if (worldGenerator && worldGenerator.isInvalid(tileX, tileY)) {
      return false;
    }

    // Create a hitbox for the player's new position
    const playerBounds = new PIXI.Rectangle(
      newX - this.tileSize/2,
      newY - this.tileSize/2,
      this.tileSize,
      this.tileSize
    );

    // Check all children in the world container for collisions
    const checkCollisions = (container: PIXI.Container) => {
      for (const child of container.children) {
        if (child instanceof PIXI.Container) {
          // Recursively check containers
          if (checkCollisions(child)) return true;
        } else if (child instanceof PIXI.Sprite) {
          // Skip if it's the player sprite or a crop
          if (child === this.sprite || child.name === 'crop') continue;

          // Check collision with blocking objects
          if (['store', 'shopkeeper', 'table', 'strawberryBox'].includes(child.name)) {
            const childBounds = child.getBounds();
            if (playerBounds.intersects(childBounds)) {
              return true;
            }
          }
        }
      }
      return false;
    };

    // If there's a collision with any blocking object, prevent movement
    if (checkCollisions(this.world)) {
      return false;
    }

    return true;
  }

  public update(): void {
    let newX = this.sprite.x;
    let newY = this.sprite.y;
    let isMoving = false;
    let newDirection = this.currentDirection;

    if (this.keys['ArrowLeft'] || this.keys['a']) {
      newX -= this.speed;
      newDirection = 'left';
      isMoving = true;
    }
    if (this.keys['ArrowRight'] || this.keys['d']) {
      newX += this.speed;
      newDirection = 'right';
      isMoving = true;
    }
    if (this.keys['ArrowUp'] || this.keys['w']) {
      newY -= this.speed;
      newDirection = 'up';
      isMoving = true;
    }
    if (this.keys['ArrowDown'] || this.keys['s']) {
      newY += this.speed;
      newDirection = 'down';
      isMoving = true;
    }

    // Only update position if the move is valid
    if (this.isValidMove(newX, newY)) {
      this.sprite.x = newX;
      this.sprite.y = newY;
    }

    // Update animation if direction changed or movement state changed
    if (this.spritesheet && (newDirection !== this.currentDirection || !isMoving)) {
      this.currentDirection = newDirection;
      this.sprite.textures = this.spritesheet.animations[this.currentDirection];
      
      if (isMoving) {
        if (!this.sprite.playing) {
          this.sprite.play();
        }
      } else {
        this.sprite.stop();
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