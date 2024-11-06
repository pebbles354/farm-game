import * as PIXI from 'pixi.js';


type SpritesheetData = typeof f2Data; // Adjust based on your spritesheet data structure

export class NPC {
  private sprite: PIXI.AnimatedSprite;
  private spritesheet: PIXI.Spritesheet;

  constructor(x: number, y: number, spritesheetData: SpritesheetData) {
    // Initialize sprite
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
}
