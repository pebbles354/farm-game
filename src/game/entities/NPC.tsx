import * as PIXI from 'pixi.js';
import { NPCState } from '../types/NPCTypes';
import { WorldGenerator } from '../world/WorldGenerator';

type SpritesheetData = typeof f2Data; // Adjust based on your spritesheet data structure

interface PathNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

export class NPC {
  private sprite: PIXI.AnimatedSprite;
  private spritesheet: PIXI.Spritesheet;
  private state: NPCState;
  private speed: number = 1;
  private currentDirection: 'down' | 'up' | 'left' | 'right' = 'down';
  private isMoving: boolean = false;
  private targetPosition: { x: number, y: number } | null = null;
  private worldGenerator: WorldGenerator;
  private path: Array<{x: number, y: number}> = [];
  private currentPathIndex: number = 0;
  private isInConversation: boolean = false;

  constructor(x: number, y: number, spritesheetData: SpritesheetData, state: NPCState, worldGenerator: WorldGenerator) {
    this.worldGenerator = worldGenerator;
    this.state = state;
    this.sprite = new PIXI.AnimatedSprite([PIXI.Texture.EMPTY]);
    this.sprite.anchor.set(0.5);
    this.sprite.position.set(x, y);
    this.sprite.animationSpeed = 0.1;

    this.loadCharacterSprite(spritesheetData);
  }

  private async loadCharacterSprite(spritesheetData: SpritesheetData): Promise<void> {
    const texture = await PIXI.Assets.load('assets/32x32folk.png'); // Ensure the texture path is correct
    this.spritesheet = new PIXI.Spritesheet(texture, spritesheetData);
    await this.spritesheet.parse();

    // Set initial animation
    if (this.spritesheet.animations['down']) {
      this.sprite.textures = this.spritesheet.animations['down'];
      this.sprite.play();
    }
  }

  public getSprite(): PIXI.AnimatedSprite {
    return this.sprite;
  }

  public getState(): NPCState {
    return this.state;
  }

  public setState(newState: NPCState) {
    this.state = newState;
  }

  public moveTo(targetX: number, targetY: number): void {
    this.path = this.findPathToTarget(this.sprite.x, this.sprite.y, targetX, targetY);
    this.currentPathIndex = 0;
  }

  public update(): void {
    if (this.isInConversation) return; // Don't move if in conversation
    
    // Continue with normal movement if not in conversation
    if (this.path.length > 0 && this.currentPathIndex < this.path.length) {
      const target = this.path[this.currentPathIndex];
      const dx = target.x - this.sprite.x;
      const dy = target.y - this.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.speed) {
        this.currentPathIndex++;
      } else {
        const angle = Math.atan2(dy, dx);
        this.sprite.x += Math.cos(angle) * this.speed;
        this.sprite.y += Math.sin(angle) * this.speed;

        // Update animation direction
        if (Math.abs(dx) > Math.abs(dy)) {
          this.currentDirection = dx > 0 ? 'right' : 'left';
        } else {
          this.currentDirection = dy > 0 ? 'down' : 'up';
        }
        
        if (this.spritesheet?.animations[this.currentDirection]) {
          this.sprite.textures = this.spritesheet.animations[this.currentDirection];
          if (!this.sprite.playing) this.sprite.play();
        }
      }
    } else {
      if (this.sprite.playing) this.sprite.stop();
    }
  }

  public isAtTarget(): boolean {
    return this.path.length === 0 || this.currentPathIndex >= this.path.length;
  }

  public getPosition(): { x: number, y: number } {
    return {
      x: this.sprite.x,
      y: this.sprite.y
    };
  }

  private findPathToTarget(startX: number, startY: number, targetX: number, targetY: number): Array<{x: number, y: number}> {
    const start = {x: Math.floor(startX / this.worldGenerator.tileSize), y: Math.floor(startY / this.worldGenerator.tileSize)};
    const end = {x: Math.floor(targetX / this.worldGenerator.tileSize), y: Math.floor(targetY / this.worldGenerator.tileSize)};
    
    const openSet: PathNode[] = [];
    const closedSet: Set<string> = new Set();
    
    openSet.push({
      x: start.x,
      y: start.y,
      g: 0,
      h: Math.abs(end.x - start.x) + Math.abs(end.y - start.y),
      f: 0,
      parent: null
    });

    while (openSet.length > 0) {
      let current = openSet.reduce((min, node) => node.f < min.f ? node : min, openSet[0]);
      
      if (current.x === end.x && current.y === end.y) {
        const path = [];
        let node: PathNode | null = current;
        while (node) {
          path.unshift({
            x: node.x * this.worldGenerator.tileSize + this.worldGenerator.tileSize / 2,
            y: node.y * this.worldGenerator.tileSize + this.worldGenerator.tileSize / 2
          });
          node = node.parent;
        }
        return path;
      }

      openSet.splice(openSet.indexOf(current), 1);
      closedSet.add(`${current.x},${current.y}`);

      const neighbors = [
        {x: current.x + 1, y: current.y},
        {x: current.x - 1, y: current.y},
        {x: current.x, y: current.y + 1},
        {x: current.x, y: current.y - 1}
      ];

      for (const neighbor of neighbors) {
        if (closedSet.has(`${neighbor.x},${neighbor.y}`)) continue;
        if (!this.worldGenerator.isPathway(neighbor.x, neighbor.y)) continue;

        const g = current.g + 1;
        const h = Math.abs(end.x - neighbor.x) + Math.abs(end.y - neighbor.y);
        const f = g + h;

        const existingNode = openSet.find(node => node.x === neighbor.x && node.y === neighbor.y);
        if (!existingNode || g < existingNode.g) {
          if (!existingNode) {
            openSet.push({x: neighbor.x, y: neighbor.y, g, h, f, parent: current});
          } else {
            existingNode.g = g;
            existingNode.f = f;
            existingNode.parent = current;
          }
        }
      }
    }

    return [];
  }

  public startConversation(): void {
    this.isInConversation = true;
    if (this.sprite.playing) this.sprite.stop();
  }

  public endConversation(): void {
    this.isInConversation = false;
  }
}
