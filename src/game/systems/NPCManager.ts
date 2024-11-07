import { NPCState, NPCRelationship, NPCEvent, NPCAction } from '../types/NPCTypes';
import { MessageSystem } from './MessageSystem';
import { NPC } from '../entities/NPC';

export class NPCManager {
  private npcs: Map<string, NPCState> = new Map();
  private npcSprites: Map<string, NPC> = new Map();
  private messageSystem: MessageSystem;
  private tileSize: number;
  private isPaused: boolean = false;

  constructor(messageSystem: MessageSystem, tileSize: number) {
    this.messageSystem = messageSystem;
    this.tileSize = tileSize;
  }

  public setPauseState(isPaused: boolean) {
    this.isPaused = isPaused;
  }

  registerNPCSprite(npcId: string, npcSprite: NPC) {
    this.npcSprites.set(npcId, npcSprite);
  }

  initializeNPC(id: string, name: string, position: { x: number; y: number }) {
    const npc: NPCState = {
      id,
      name,
      gold: 100, // Starting gold
      currentAction: null,
      relationships: [],
      events: [],
      position
    };

    this.npcs.set(id, npc);
  }

  getNPCState(id: string): NPCState | undefined {
    return this.npcs.get(id);
  }


  private generateRandomEvent(npcId: string) {
    if (Math.random() < 0.1) { // 10% chance
      const npc = this.npcs.get(npcId);
      if (!npc) return;

      const event: NPCEvent = {
        id: `event_${Date.now()}`,
        description: `${npc.name} needs help resolving an issue`,
        goldRequired: Math.floor(Math.random() * 50) + 10,
        npcId
      };

      npc.events.push(event);
      console.log(`${npc.name} has encountered an event requiring ${event.goldRequired} gold!`);
    }
  }

  private async performFarmAction(npc: NPCState, sourceNpcSprite: NPC): Promise<void> {
    console.log(`${npc.name} is performing farm action`);
    npc.currentAction = { type: 'FARM' };
    const currentPos = sourceNpcSprite.getPosition();
    
    // Check if NPC is already at their farm
    const isAtFarm = Math.abs(currentPos.x - npc.position.x) <= this.tileSize &&
                    Math.abs(currentPos.y - npc.position.y) <= this.tileSize;

    if (!isAtFarm) {
      let reachedFarm = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!reachedFarm && attempts < maxAttempts) {
        sourceNpcSprite.moveTo(npc.position.x, npc.position.y, 'FARM');
        
        let timeoutCounter = 0;
        const maxTimeout = 600;

        while (!sourceNpcSprite.isAtTarget() && timeoutCounter < maxTimeout) {
          await new Promise(resolve => setTimeout(resolve, 100));
          timeoutCounter++;

          const currentPos = sourceNpcSprite.getPosition();
          reachedFarm = Math.abs(currentPos.x - npc.position.x) <= this.tileSize &&
                        Math.abs(currentPos.y - npc.position.y) <= this.tileSize;
          
          if (reachedFarm) break;
        }

        attempts++;
        
        if (!reachedFarm && attempts < maxAttempts) {
          console.log(`${npc.name} was interrupted, making another attempt to reach farm (${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!reachedFarm) {
        console.log(`${npc.name} couldn't reach their farm after ${maxAttempts} attempts, will try again next update`);
        return;
      }
    }

    if (isAtFarm || sourceNpcSprite.isAtTarget()) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      const goldEarned = Math.floor(Math.random() * 20) + 5;
      npc.gold += goldEarned;
      console.log(`${npc.name} earned ${goldEarned} gold from farming`);
      npc.currentAction = null;
    }
  }

  private async performVisitAction(npc: NPCState, sourceNpcSprite: NPC): Promise<void> {
    console.log(`${npc.name} is performing visit action`);
    npc.currentAction = { type: 'VISIT', targetId: npc.id };

    await new Promise(resolve => setTimeout(resolve, 10000));

    npc.gold += 10;

    console.log(`${npc.name} is done visiting`);
    npc.currentAction = null;

  }


  private async performAction(npcId: string) {
    const npc = this.npcs.get(npcId);
    const sourceNpcSprite = this.npcSprites.get(npcId);
    if (!npc || !sourceNpcSprite || sourceNpcSprite.isBusyState()) return;

    const actionType = npc.currentAction?.type === 'FARM' ? 'FARM' : 
                   ['FARM', 'VISIT'][Math.floor(Math.random() * 2)] as 'FARM' | 'VISIT';
    
    npc.currentAction = actionType === 'FARM' 
        ? { type: 'FARM' }
        : { type: 'VISIT', targetId: npcId };
    
    // Verify the NPC state in the map is updated
    const verifyNpc = this.npcs.get(npcId);

    try {
      if (actionType === 'FARM') {
        await this.performFarmAction(npc, sourceNpcSprite);
      } else {
        await this.performVisitAction(npc, sourceNpcSprite);
      }
    } catch (error) {
      console.error(`Error in performAction for ${npc.name}:`, error);
    }
  }

  update() {
    if (this.isPaused) return;
    
    for (const npc of this.npcs.values()) {
      const npcSprite = this.npcSprites.get(npc.id);
      if (npcSprite) {        
        // Start new action if none is current and NPC isn't busy
        if (!npc.currentAction && !npcSprite.isBusyState()) {
            this.generateRandomEvent(npc.id);
            this.performAction(npc.id);
        }
      }
    }
  }

  public debugNPCs(): void {
    console.log("\n=== DEBUG START ===");
    for (const npc of this.npcs.values()) {
        const npcSprite = this.npcSprites.get(npc.id);
        if (!npcSprite) continue;
        
        console.log(`${npc.name} state:`);
        console.log('  - hasCurrentAction:', !!npc.currentAction);
        console.log('  - CurrentAction:', JSON.stringify(npc.currentAction));
        console.log('  - actionType:', npc.currentAction?.type || 'none');
        console.log('  - isBusy:', npcSprite.isBusyState());
        
        // Force immediate evaluation of the state
        const rawState = {
            id: npc.id,
            name: npc.name,
            currentAction: JSON.parse(JSON.stringify(npc.currentAction))
        };
        console.log('  - Raw npc state:', rawState);
    }
    console.log("=== DEBUG END ===\n");
  }




  
  private async performVisitAction2(npc: NPCState, sourceNpcSprite: NPC): Promise<void> {
    const availableNpcs = Array.from(this.npcs.values()).filter(n => 
      n.id !== npc.id && 
      (!n.currentAction || n.currentAction.type !== 'VISIT')
    );

    if (availableNpcs.length === 0) {
      console.log(`${npc.name} couldn't find anyone to visit, going farming instead`);
      return this.performFarmAction(npc, sourceNpcSprite);
    }

    const targetNpc = availableNpcs[Math.floor(Math.random() * availableNpcs.length)];
    npc.currentAction = { type: 'VISIT', targetId: targetNpc.id };
    console.log(`${npc.name} is visiting ${targetNpc.name}`);

    const targetNpcSprite = this.npcSprites.get(targetNpc.id);
    if (!targetNpcSprite) return;

    let hasReachedTarget = false;
    let attempts = 0;
    const maxAttempts = 4;

    while (!hasReachedTarget && attempts < maxAttempts) {
      const targetPos = targetNpcSprite.getPosition();
      sourceNpcSprite.moveTo(targetPos.x, targetPos.y, 'VISIT');

      while (!sourceNpcSprite.isAtTarget()) {
        const currentPos = sourceNpcSprite.getPosition();
        const newTargetPos = targetNpcSprite.getPosition();
        
        const distance = Math.sqrt(
          Math.pow(currentPos.x - newTargetPos.x, 2) + 
          Math.pow(currentPos.y - newTargetPos.y, 2)
        );

        if (distance <= this.tileSize * 2) {
          hasReachedTarget = true;
          break;
        }

        if (Math.abs(targetPos.x - newTargetPos.x) > this.tileSize || 
            Math.abs(targetPos.y - newTargetPos.y) > this.tileSize) {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      attempts++;
    }

    if (hasReachedTarget) {
      sourceNpcSprite.startConversation();
      targetNpcSprite.startConversation();
      
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      sourceNpcSprite.endConversation();
      targetNpcSprite.endConversation();
      
      this.handleVisitOutcome(npc, targetNpc);
    } else {
      console.log(`${npc.name} couldn't catch up with ${targetNpc.name}`);
    }
  }

  private handleVisitOutcome(npc: NPCState, targetNpc: NPCState): void {
    if (Math.random() < 0.3 && targetNpc.events.length > 0) {
      const event = targetNpc.events[0];
      if (npc.gold >= event.goldRequired) {
        npc.gold -= event.goldRequired;
        targetNpc.events = targetNpc.events.filter(e => e.id !== event.id);
        this.updateRelationship(npc.id, targetNpc.id, 2);
        console.log(`${npc.name} helped ${targetNpc.name} resolve their event!`);
      }
    } else if (Math.random() < 0.1) {
      npc.currentAction = { type: 'ACCUSE', targetId: targetNpc.id };
      this.updateRelationship(npc.id, targetNpc.id, -3);
      console.log(`${npc.name} accused ${targetNpc.name} of being a witch!`);
    }
  }

} 