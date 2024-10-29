import * as PIXI from 'pixi.js';
import { Inventory } from '../inventory/Inventory';
import { MessageSystem } from '../systems/MessageSystem';
import { InventoryUI } from '../inventory/InventoryUI';

export class Store {
  private container: PIXI.Container;
  private sprite: PIXI.Sprite;
  private menuContainer: PIXI.Container | null = null;
  private isMenuOpen: boolean = false;
  private inventory: Inventory;
  private messageSystem: MessageSystem;
  private inventoryUI: InventoryUI;
  private uiContainer: PIXI.Container;

  constructor(x: number, y: number, inventory: Inventory, messageSystem: MessageSystem, inventoryUI: InventoryUI, uiContainer: PIXI.Container) {
    this.container = new PIXI.Container();
    this.inventory = inventory;
    this.messageSystem = messageSystem;
    this.inventoryUI = inventoryUI;
    this.uiContainer = uiContainer;

    // Create store sprite
    this.sprite = PIXI.Sprite.from('assets/store.png'); // You'll need a store sprite
    this.sprite.anchor.set(0.5);
    this.sprite.position.set(x, y);
    this.container.addChild(this.sprite);

    // Add the following inside the constructor or an initialization method
    window.addEventListener('resize', this.updateMenuPosition.bind(this));
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public isPlayerInRange(playerX: number, playerY: number): boolean {
    const dx = Math.abs(playerX - this.sprite.x);
    const dy = Math.abs(playerY - this.sprite.y);
    const widthRange = 100; // Adjust width range as needed
    const heightRange = 150; // Adjust height range to cover the table

    return dx < widthRange && dy < heightRange;
  }

  public toggleMenu(app: PIXI.Application): void {
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu(app);
      window.addEventListener('keydown', this.handleHotkeys.bind(this));
    }
  }

  private openMenu(app: PIXI.Application): void {
    this.menuContainer = new PIXI.Container();
    
    // Create menu background
    const background = new PIXI.Graphics();
    background.beginFill(0x000000, 0.8);
    background.drawRect(0, 0, 300, 200);
    background.endFill();
    this.menuContainer.addChild(background);

    // Add title
    const title = new PIXI.Text('Store', {
      fill: 'white',
      fontSize: 24
    });
    title.position.set(10, 10);
    this.menuContainer.addChild(title);

    // Add buy/sell options
    const options = [
      { text: 'Buy Seeds (5g) [1]', action: () => this.buySeed() },
      { text: 'Sell Lettuce (10g) [2]', action: () => this.sellLettuce() }
    ];

    options.forEach((option, index) => {
      const button = new PIXI.Container();
      
      const buttonBg = new PIXI.Graphics();
      buttonBg.beginFill(0x444444);
      buttonBg.drawRect(0, 0, 280, 40);
      buttonBg.endFill();
      button.addChild(buttonBg);

      const text = new PIXI.Text(option.text, {
        fill: 'white',
        fontSize: 16
      });
      text.position.set(10, 10);
      button.addChild(text);

      button.position.set(10, 50 + index * 50);
      button.eventMode = 'static';
      button.cursor = 'pointer';
      button.on('pointerdown', option.action);

      this.menuContainer.addChild(button);
    });

    // Position menu in center of screen
    this.menuContainer.position.set(
      (app.screen.width - this.menuContainer.width) / 2,
      (app.screen.height - this.menuContainer.height) / 2
    );

    this.uiContainer.addChild(this.menuContainer);
    this.isMenuOpen = true;
  }

  private closeMenu(): void {
    if (this.menuContainer) {
      if (this.menuContainer.parent) {
        this.menuContainer.parent.removeChild(this.menuContainer);
      }
      this.menuContainer = null;
      this.isMenuOpen = false;
      window.removeEventListener('keydown', this.handleHotkeys.bind(this));
    }
  }

  private buySeed(): void {
    const seedPrice = 5;
    if (this.inventory.getItemQuantity('money') >= seedPrice) {
      this.inventory.removeItem('money', seedPrice);
      this.inventory.addItem('seeds', 1);
      this.messageSystem.showMessage('Bought 1 seed for 5g');
      this.inventoryUI.update();
    } else {
      this.messageSystem.showMessage('Not enough money!');
    }
  }

  private sellLettuce(): void {
    const lettucePrice = 10;
    if (this.inventory.getItemQuantity('lettuce') > 0) {
      this.inventory.removeItem('lettuce', 1);
      this.inventory.addItem('money', lettucePrice);
      this.messageSystem.showMessage('Sold 1 lettuce for 10g');
      this.inventoryUI.update();
    } else {
      this.messageSystem.showMessage('No lettuce to sell!');
    }
  }

  private handleHotkeys(event: KeyboardEvent): void {
    if (event.key === '1') {
      this.buySeed();
    } else if (event.key === '2') {
      this.sellLettuce();
    }
  }

  private updateMenuPosition(app: PIXI.Application): void {
    if (this.menuContainer) {
      this.menuContainer.position.set(
        (app.screen.width - this.menuContainer.width) / 2,
        (app.screen.height - this.menuContainer.height) / 2
      );
    }
  }

  // Don't forget to remove the event listener when the store is destroyed or no longer needed
} 