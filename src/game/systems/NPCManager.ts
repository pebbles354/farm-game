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

  private updateRelationship(npcId: string, targetId: string, change: number) {
    const npc = this.npcs.get(npcId);
    if (!npc) return;

    const relationship = npc.relationships.find(r => r.npcId === targetId);
    if (relationship) {
      relationship.friendshipScore = Math.max(1, Math.min(10, relationship.friendshipScore + change));
    } else {
      npc.relationships.push({ npcId: targetId, friendshipScore: 5 + change });
    }
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

  private async performAction(npcId: string) {
    const npc = this.npcs.get(npcId);
    const sourceNpcSprite = this.npcSprites.get(npcId);
    if (!npc || !sourceNpcSprite || sourceNpcSprite.isBusyState()) return;

    // Check if NPC was previously interrupted while farming
    let randomAction: 'FARM' | 'VISIT';
    if (npc.currentAction?.type === 'FARM') {
      randomAction = 'FARM';
    } else {
      // Only choose random action if not continuing previous action
      randomAction = ['FARM', 'VISIT'][Math.floor(Math.random() * 2)];
    }

    if (randomAction === 'FARM') {
      // Set the action at the start so it persists through interruptions
      npc.currentAction = { type: 'FARM' };
      
      const currentPos = sourceNpcSprite.getPosition();
      
      // Check if NPC is already at their farm
      const isAtFarm = Math.abs(currentPos.x - npc.position.x) <= this.tileSize &&
                      Math.abs(currentPos.y - npc.position.y) <= this.tileSize;

      if (!isAtFarm) {
        // Return to original farm position first
        console.log(`${npc.name} is returning to their farm`);
        
        let reachedFarm = false;
        let attempts = 0;
        const maxAttempts = 3; // Allow multiple attempts to reach farm

        while (!reachedFarm && attempts < maxAttempts) {
          sourceNpcSprite.moveTo(npc.position.x, npc.position.y, 'FARM');
          
          // Wait until NPC reaches their farm or max time elapsed
          let timeoutCounter = 0;
          const maxTimeout = 600; // 30 seconds maximum wait time

          while (!sourceNpcSprite.isAtTarget() && timeoutCounter < maxTimeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
            timeoutCounter++;

            // Check current position
            const currentPos = sourceNpcSprite.getPosition();
            reachedFarm = Math.abs(currentPos.x - npc.position.x) <= this.tileSize &&
                         Math.abs(currentPos.y - npc.position.y) <= this.tileSize;
            
            if (reachedFarm) {
              break; // Exit the loop if we've reached the farm
            }
          }

          attempts++;
          
          // If interrupted but not at farm, try again
          if (!reachedFarm && attempts < maxAttempts) {
            console.log(`${npc.name} was interrupted, making another attempt to reach farm (${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause before retry
          }
        }
        
        if (!reachedFarm) {
          console.log(`${npc.name} couldn't reach their farm after ${maxAttempts} attempts, will try again next update`);
          return; // Keep currentAction as FARM
        }
      }

      // Only proceed with farming if they're at their farm
      if (isAtFarm || sourceNpcSprite.isAtTarget()) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        const goldEarned = Math.floor(Math.random() * 20) + 5;
        npc.gold += goldEarned;
        console.log(`${npc.name} earned ${goldEarned} gold from farming`);
        npc.currentAction = null; // Only clear action after successful completion
      }
    } else if (randomAction === 'VISIT') {
      const availableNpcs = Array.from(this.npcs.values()).filter(n => 
        n.id !== npcId && 
        (!n.currentAction || n.currentAction.type !== 'VISIT')
      );

      if (availableNpcs.length === 0) {
        console.log(`${npc.name} couldn't find anyone to visit, going farming instead`);
        randomAction = 'FARM';
      } else {
        const targetNpc = availableNpcs[Math.floor(Math.random() * availableNpcs.length)];
        npc.currentAction = { type: 'VISIT', targetId: targetNpc.id };
        console.log(`${npc.name} is visiting ${targetNpc.name}`);

        const sourceNpcSprite = this.npcSprites.get(npcId);
        const targetNpcSprite = this.npcSprites.get(targetNpc.id);

        if (sourceNpcSprite && targetNpcSprite) {
          let hasReachedTarget = false;
          let attempts = 0;
          const maxAttempts = 4; // Prevent infinite chase

          while (!hasReachedTarget && attempts < maxAttempts) {
            const targetPos = targetNpcSprite.getPosition();
            sourceNpcSprite.moveTo(targetPos.x, targetPos.y, 'VISIT');

            // Wait for NPC to reach target or get close enough
            while (!sourceNpcSprite.isAtTarget()) {
              const currentPos = sourceNpcSprite.getPosition();
              const newTargetPos = targetNpcSprite.getPosition();
              
              // Check if target has moved significantly
              const distance = Math.sqrt(
                Math.pow(currentPos.x - newTargetPos.x, 2) + 
                Math.pow(currentPos.y - newTargetPos.y, 2)
              );

              // If within 2 tiles, consider it close enough
              if (distance <= this.tileSize * 2) {
                hasReachedTarget = true;
                break;
              }

              // If target has moved significantly, update path
              if (Math.abs(targetPos.x - newTargetPos.x) > this.tileSize || 
                  Math.abs(targetPos.y - newTargetPos.y) > this.tileSize) {
                break; // Break the inner loop to recalculate path
              }

              await new Promise(resolve => setTimeout(resolve, 100));
            }

            attempts++;
          }

          // Only proceed with conversation if we reached the target
          if (hasReachedTarget) {
            console.log(`${npc.name} is talking with ${targetNpc.name}`);
            
            // Stop both NPCs for conversation
            sourceNpcSprite.startConversation();
            targetNpcSprite.startConversation();
            
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            // Resume both NPCs after conversation
            sourceNpcSprite.endConversation();
            targetNpcSprite.endConversation();
            
            // Debug info about sprite states
            // console.log('Source NPC after conversation:', {
            //   name: sourceNpcSprite.getSprite().name,
            //   position: sourceNpcSprite.getPosition(),
            //   isBusy: sourceNpcSprite.isBusyState(),
            //   isInConversation: sourceNpcSprite.isInConversation,
            //   currentPath: sourceNpcSprite.path,
            //   currentAction: sourceNpcSprite.currentActionType
            // });
            
            // console.log('Target NPC after conversation:', {
            //   name: targetNpcSprite.getSprite().name, 
            //   position: targetNpcSprite.getPosition(),
            //   isBusy: targetNpcSprite.isBusyState(),
            //   isInConversation: targetNpcSprite.isInConversation,
            //   currentPath: targetNpcSprite.path,
            //   currentAction: targetNpcSprite.currentActionType
            // });

            // Random chance to help with event or accuse
            if (Math.random() < 0.3 && targetNpc.events.length > 0) {
              const event = targetNpc.events[0];
              if (npc.gold >= event.goldRequired) {
                npc.gold -= event.goldRequired;
                targetNpc.events = targetNpc.events.filter(e => e.id !== event.id);
                this.updateRelationship(npcId, targetNpc.id, 2);
                console.log(`${npc.name} helped ${targetNpc.name} resolve their event!`);
              }
            } else if (Math.random() < 0.1) {
              npc.currentAction = { type: 'ACCUSE', targetId: targetNpc.id };
              this.updateRelationship(npcId, targetNpc.id, -3);
              console.log(`${npc.name} accused ${targetNpc.name} of being a witch!`);
            }

            npc.currentAction = null;

          } else {
            console.log(`${npc.name} couldn't catch up with ${targetNpc.name}. Details:`, {
              attempts: attempts,
              sourcePosition: sourceNpcSprite.getPosition(),
              targetPosition: targetNpcSprite.getPosition(),
              distance: Math.sqrt(
                Math.pow(sourceNpcSprite.getPosition().x - targetNpcSprite.getPosition().x, 2) + 
                Math.pow(sourceNpcSprite.getPosition().y - targetNpcSprite.getPosition().y, 2)
              ),
              maxAllowedDistance: this.tileSize * 2,
              isSourceMoving: sourceNpcSprite.isAtTarget() ? 'No' : 'Yes'
            });

            npc.currentAction = null;
          }
        }
      }
    }
  }

  update() {
    if (this.isPaused) return;
    
    for (const npc of this.npcs.values()) {
      const npcSprite = this.npcSprites.get(npc.id);
      if (!npc.currentAction && npcSprite && !npcSprite.isBusyState()) {
        this.generateRandomEvent(npc.id);
        this.performAction(npc.id);
      }
    }
  }

} 