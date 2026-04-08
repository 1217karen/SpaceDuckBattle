// new-battle-skill.js

import { skillHandlers } from "./skills.js";
import { applyDamage } from "./new-battle-damage.js";
import { applyHeal } from "./new-battle-heal.js";
import { applyMove } from "./new-battle-move.js";
import { EFFECTS } from "./effects-config.js";

export function tryUseSkill(unit, context) {

  const units = context.units;

  for (let skill of (unit.skills || [])) {

    if (skill._currentCooldown > 0) continue;

    const handler = skillHandlers[skill.type];
    if (!handler) continue;

    const result = handler.generateActions(unit, context);
    if (!result) continue;

    const actions = result.actions || [];
    if (actions.length === 0) continue;

    const hasEffect = actions.some(a =>
      a.type === "damage" ||
      a.type === "heal" ||
      a.type === "applyEffect" ||
      a.type === "removeEffect" ||
      a.type === "clearEffect" ||
      a.type === "move"
    );

    if (!hasEffect) continue;

    context.beginGroup(
      context.attachCommToEvent({
        type: "skillUse",
        block: "skill",
        unit: unit.id,
        skill: skill.type,
        rangeCells: result.preview?.cells ?? null,
        rangeStyle: result.preview?.style ?? null
      })
    );

    for (let action of actions) {

      const source = units.find(u => u.id === action.source);
      const target = units.find(u => u.id === action.target);

      if (action.type === "damage") {
        if (source && target)
          applyDamage(source, target, action, context);
      }

      else if (action.type === "heal") {
        if (source && target)
          applyHeal(source, target, action, context);
      }

      else if (action.type === "applyEffect") {
        if (source && target)
          context.applyEffect(source, target, action, context);
      }

      else if (action.type === "removeEffect") {

        if (!target) continue;

        const effectType = action.effect?.type;
        const amount = action.effect?.amount ?? 1;

        const def = EFFECTS[effectType];
        if (!def) throw new Error(`Unknown effect type: ${effectType}`);

        const existing = target.effects?.find(e => e.type === effectType);
        if (!existing) continue;

        existing.stock -= amount;

        if (existing.stock > 0) {

          context.pushLog({
            type: "effectDecay",
            block: "effect",
            unit: target.id,
            effect: {
              type: effectType,
              stock: existing.stock
            }
          });

        } else {

          existing.stock = 0;

          target.effects =
            target.effects.filter(e => e !== existing);

          context.pushLog({
            type: "effectRemoved",
            block: "effect",
            unit: target.id,
            effect: { type: effectType }
          });

        }
      }

      else if (action.type === "clearEffect") {

        if (!target) continue;

        const effectType = action.effect?.type;
        if (!effectType) continue;

        const existing =
          target.effects?.find(e => e.type === effectType);

        if (!existing) continue;

        target.effects =
          target.effects.filter(e => e !== existing);

        context.pushLog({
          type: "effectRemoved",
          block: "effect",
          unit: target.id,
          effect: {
            type: effectType,
            clear: true
          }
        });
      }

      else if (action.type === "move") {
        applyMove(action, context);
      }
    }

    if (handler.cooldown && handler.cooldown > 0) {
      skill._currentCooldown = handler.cooldown;

      context.pushLog({
        type: "cooldownSet",
        unit: unit.id,
        skill: skill.type,
        value: handler.cooldown
      });
    }

    context.endGroup();

    return true;
  }

  return false;
}
