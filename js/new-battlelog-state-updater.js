//new-battlelog-state-updater.js


// =====================
// HpChange
// =====================
export function applyHpChange(event, boardState) {
  const unit = boardState.units[event.target];
  if (!unit) return;

  unit.hp = event.hp;
}

// =====================
// Cooldown
// =====================
export function applyCooldownSet(event, boardState) {
  const unit = boardState.units[event.unit];
  if (!unit) return;

  unit.cooldowns = unit.cooldowns || {};
  unit.cooldowns[event.skill] = event.value;
}

export function applyCooldownChange(event, boardState) {
  const unit = boardState.units[event.unit];
  if (!unit) return;

  unit.cooldowns = unit.cooldowns || {};

  const current =
    unit.cooldowns[event.skill] ?? 0;

  unit.cooldowns[event.skill] =
    Math.max(current + event.delta, 0);
}

// =====================
// EffectDecay
// =====================
export function applyEffectDecay(event, boardState) {
  const unit = boardState.units[event.unit];
  if (!unit) return;

  const e = event.effect;

  const existing =
    (unit.effects || []).find(x => x.type === e.type);

  if (existing) {
    existing.stock = e.stock;
  }
}

export function applyEffectExpired(event, boardState) {
  const unit = boardState.units[event.unit];
  if (!unit) return;

  const e = event.effect;

  unit.effects =
    unit.effects.filter(x => x.type !== e.type);
}

// =====================
// EffectRemoved
// =====================
export function applyEffectRemoved(event, boardState) {
  const unit = boardState.units[event.unit];
  if (!unit) return;

  const e = event.effect;

  unit.effects =
    unit.effects.filter(
      x => x.type !== e.type
    );
}

// =====================
// EffectApplied
// =====================
export function applyEffectApplied(event, boardState) {
  const unit = boardState.units[event.target];
  if (!unit) return;

  const e = event.effect;

  unit.effects = unit.effects || [];

  // ======================
  // stock
  // ======================

  if (
    e.type &&
    e.stock !== undefined
  ) {
    let existing =
      (unit.effects || []).find(x => x.type === e.type);

    if (existing) {
      existing.stock = e.stock;
    } else {
      unit.effects.push({
        type: e.type,
        stock: e.stock
      });
    }
  }

  // ======================
  // flat
  // ======================

  else if (e.mode === "flat") {
    unit.effects.push({
      ...e
    });
  }

  // ======================
  // rate
  // ======================

  else if (e.mode === "rate") {
    unit.rateEffects =
      unit.rateEffects || [];

    const stat = e.stat;

    let existing =
      unit.rateEffects.find(
        x => x.stat === stat
      );

    if (e.result === "apply") {
      unit.rateEffects.push({
        stat: stat,
        value: e.value,
        duration: e.duration
      });
    }

    else if (e.result === "overwrite") {
      if (existing) {
        existing.value = e.value;
        existing.duration = e.duration;
      }
    }

    else if (e.result === "extend") {
      if (existing) {
        existing.duration = e.duration;
      }
    }

    else if (e.result === "cancel") {
      if (existing) {
        existing.duration = e.duration;

        if (existing.duration <= 0) {
          unit.rateEffects =
            unit.rateEffects.filter(x => x !== existing);
        }
      }
    }

    else if (e.result === "turnDecay") {
      if (existing) {
        existing.duration = e.duration;
      }
    }

    else if (e.result === "turnEnd") {
      if (existing) {
        unit.rateEffects =
          unit.rateEffects.filter(x => x !== existing);
      }
    }
  }
}


// =====================
// move
// =====================
export function applyMove(event, boardState) {
  const unit = boardState.units[event.unit];
  if (!unit) return;

  unit.x = event.x;
  unit.y = event.y;
}

// =====================
// facing
// =====================
export function applyFacing(event, boardState) {
  const unit = boardState.units[event.unit];
  if (!unit) return;

  unit.facing = event.facing;
}

// =====================
// Death
// =====================
export function applyDeath(event, boardState) {
  delete boardState.units[event.unit];
}
