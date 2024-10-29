import * as PIXI from 'pixi.js';

export class MessageSystem {
  private app: PIXI.Application;
  private world: PIXI.Container;
  private inventoryUI: PIXI.Container;
  private messageContainer: PIXI.Container;

  constructor(app: PIXI.Application, world: PIXI.Container, inventoryUI: PIXI.Container, messageContainer: PIXI.Container) {
    this.app = app;
    this.world = world;
    this.inventoryUI = inventoryUI;
    this.messageContainer = messageContainer;
  }

  showMessage(text: string) {
    // Create new message container
    const newMessageContainer = new PIXI.Container();
    const messageBackground = new PIXI.Graphics();
    messageBackground.beginFill(0x000000, 0.5);
    messageBackground.drawRect(0, 0, 300, 50);
    messageBackground.endFill();
    newMessageContainer.addChild(messageBackground);

    const message = new PIXI.Text(text, {
      fill: "#FFFFFF", 
      fontSize: 14,
      fontWeight: "bold"
    });
    message.position.set(10, 15);
    newMessageContainer.addChild(message);

    // Position new message at bottom center
    newMessageContainer.position.set(
      (this.app.screen.width - newMessageContainer.width) / 2,
      this.app.screen.height - newMessageContainer.height - 20
    );

    // Add to the dedicated message container
    this.messageContainer.addChild(newMessageContainer);

    // If we already have 3 messages, remove the oldest one
    const existingMessages = this.messageContainer.children as PIXI.Container[];
    if (existingMessages.length > 3) {
      this.messageContainer.removeChild(existingMessages[0]);
    }

    // Move existing messages up
    existingMessages.forEach((container, index) => {
      container.position.y = this.app.screen.height - 
        (existingMessages.length - index) * (newMessageContainer.height + 10) - 10;
    });

    // Remove message after 10 seconds
    setTimeout(() => {
      if (this.messageContainer.children.includes(newMessageContainer)) {
        this.messageContainer.removeChild(newMessageContainer);
        
        // Move remaining messages down
        const remainingMessages = this.messageContainer.children as PIXI.Container[];
        remainingMessages.forEach((container, i) => {
          container.position.y = this.app.screen.height - 
            (remainingMessages.length - i) * (newMessageContainer.height + 10) - 10;
        });
      }
    }, 10000);
  }
} 