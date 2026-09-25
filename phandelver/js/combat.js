/* Пошаговый бой: герой, напарник, несколько врагов. */
(() => {
  const G = window.G;
  const R = G.rnd, D = G.roll, F = G.fmt;

  const TYPE_RU = { slashing: 'рубящего', piercing: 'колющего', bludgeoning: 'дробящего', fire: 'огнём', cold: 'холодом', acid: 'кислотой', radiant: 'излучением', force: 'силовым полем', necrotic: 'некротической энергией', lightning: 'электричеством', poison: 'ядом' };

  /* ---------- старт ---------- */
  G.startFight = encId => {
    const S = G.S, E = G.ENC[encId];
    if (!E) { console.error('Нет боя', encId); return; }
    S.notes = [];
    G.saveCP();
    let uid = 0;
    const enemies = [];
    /* Подстройка под одиночку: группы с ifComp появляются, только если у героя есть напарник;
       soloHp — запас хитов врага, когда герой идёт один. */
    (G.val(E.enemies) || []).filter(g => !g.ifComp || S.comp).forEach(g => {
      const n = G.val(g.n) || 1;
      for (let i = 0; i < n; i++) {
        const m = G.MONSTERS[g.k];
        const hp = (!S.comp && g.soloHp) || g.hp || m.hp;
        enemies.push({
          uid: ++uid, k: g.k, name: (g.name || m.name) + (n > 1 && !g.name ? ' ' + (i + 1) : ''),
          hp, max: hp, ac: g.ac || m.ac, st: {}, out: null,
          uses: {}, shieldUses: m.shieldUses || 0, flag: g.flag || null, poisoned: !!g.poisoned
        });
      }
    });
    const C = S.combat = {
      id: encId, enemies, round: 1, log: [], over: null, target: enemies[0].uid,
      turn: { action: 1, bonus: 1, surged: false, sneak: false, aim: false },
      hero: { down: false }, comp: S.comp ? { down: G.compHp() <= 0 } : null,
      conc: null, sw: false, nonlethal: false, marked: {}, shieldUp: false, uncanny: false, protectUsed: false,
      canFlee: !!E.canFlee, captured: 0, fled: [], acted: {}
    };
    G.UI.logSeen = 0;
    S.st.fights++;
    const intro = G.val(E.intro);
    if (intro) log('sys', intro);
    log('sys', 'Бой! Противники: ' + enemies.map(e => e.name).join(', ') + '.');
    const sur = G.val(E.surprise);
    if (sur === 'enemy') {
      log('bad', 'Вас застали врасплох: первый раунд вы пропускаете.');
      C.hero.surprised = true;
      enemyPhase();
      C.hero.surprised = false;
      if (!checkEnd()) newRound();
    } else if (sur === 'hero') {
      enemies.forEach(e => { e.st.surprised = true; });
      log('good', 'Враги застигнуты врасплох: в первом раунде они не действуют.');
    } else {
      const hi = R(20) + G.mod('dex');
      const ei = R(20) + Math.max(...enemies.map(e => G.MONSTERS[e.k].init || 0));
      if (ei > hi) { log('sys', 'Инициатива: ' + hi + ' против ' + ei + '. Враги ходят первыми.'); enemyPhase(); if (!checkEnd()) newRound(); }
      else log('sys', 'Инициатива: ' + hi + ' против ' + ei + '. Вы ходите первыми.');
    }
    G.save();
    G.render(true);
  };

  function log(cls, t) { G.S.combat.log.push([cls, t]); }
  const alive = () => G.S.combat.enemies.filter(e => !e.out);
  const byUid = u => G.S.combat.enemies.find(e => e.uid === u);
  const tgt = () => { const C = G.S.combat; let t = byUid(C.target); if (!t || t.out) { t = alive()[0]; if (t) C.target = t.uid; } return t; };
  const incap = e => e.st.sleep || e.st.held || e.st.turned;

  /* Новый раунд: сбрасываем ход героя. Если герой без сознания или парализован,
     его ход пропускается, и раунд прокручивается дальше, пока бой не закончится
     или герой снова не сможет действовать. */
  function newRound() {
    const C = G.S.combat;
    for (let guard = 0; guard < 40; guard++) {
      C.round++;
      C.turn = { action: 1, bonus: 1, sneak: false, aim: false };
      C.shieldUp = false; C.uncanny = false; C.protectUsed = false; C.dodge = false;
      C.hero.hidden = false;
      if (C.hero.invis > 0) C.hero.invis--;
      if (C.hero.prone && !C.hero.down) { C.hero.prone = false; log('sys', 'Вы поднимаетесь на ноги.'); }
      let skip = false;
      if (C.hero.down) {
        if (!C.comp || C.comp.down) return;
        log('sys', 'Вы лежите без сознания. ' + G.compDef().short + ' сражается один.');
        skip = true;
      } else if (C.hero.held) {
        const sv = R(20) + G.saveBonus('wis');
        if (sv >= 12 || C.hero.held <= 1) { C.hero.held = 0; log('good', 'Вы сбрасываете паралич (спасбросок ' + sv + ').'); }
        else { C.hero.held--; log('bad', 'Вы парализованы и пропускаете ход (спасбросок ' + sv + ').'); skip = true; }
      }
      if (!skip) return;
      compTurn(); if (checkEnd()) return;
      enemyPhase(); if (checkEnd()) return;
    }
  }

  /* ---------- урон по врагу ---------- */
  function dmgEnemy(e, amt, type, src) {
    const m = G.MONSTERS[e.k];
    let note = '';
    if (m.vuln && m.vuln.includes(type)) { amt *= 2; note = ' (уязвимость!)'; }
    if (m.resist && m.resist.includes(type)) { amt = Math.floor(amt / 2); note = ' (сопротивление)'; }
    if (m.immune && m.immune.includes(type)) { amt = 0; note = ' (иммунитет)'; }
    e.hp = Math.max(0, e.hp - amt);
    if (e.st.sleep && amt > 0) { e.st.sleep = false; note += ' Просыпается!'; }
    if (e.hp <= 0) {
      const C = G.S.combat;
      if (C.nonlethal && src === 'melee' && m.humanoid) { e.out = 'captured'; C.captured++; note += ' Оглушён, взят в плен.'; }
      else { e.out = 'dead'; G.S.st.kills++; note += ' Повержен!'; }
    } else if (m.surrenderAt && e.hp <= m.surrenderAt) {
      e.out = 'surrender'; G.S.combat.captured++; note += ' Бросает оружие и сдаётся!';
    }
    return [amt, note];
  }

  function heroAdvantage(e) {
    const C = G.S.combat;
    let adv = false, why = [];
    if (C.turn.aim) { adv = true; why.push('прицел'); }
    if (C.hero.hidden) { adv = true; why.push('скрытность'); }
    if (C.hero.invis > 0 || C.hero.invisNext) { adv = true; why.push('невидимость'); }
    if (e.st.prone) { adv = true; why.push('сбит с ног'); }
    if (e.st.held || e.st.sleep) { adv = true; why.push(e.st.sleep ? 'спит' : 'парализован'); }
    if (C.marked[e.uid]) { adv = true; why.push('метка снаряда'); }
    if (G.S.hero.cls === 'rogue' && G.S.hero.lvl >= 3 && (e.st.surprised || !C.acted[e.uid])) { adv = true; why.push('убийца'); }
    let dis = e.poisoned ? false : false;
    return { adv, dis, why };
  }

  function atkRoll(hit, adv, dis) {
    let a = R(20), b = R(20);
    if (G.S.hero.race === 'halfling') { if (a === 1) a = R(20); if (b === 1) b = R(20); }
    let d = a;
    if (adv && !dis) d = Math.max(a, b);
    if (dis && !adv) d = Math.min(a, b);
    const bless = G.S.combat.conc === 'bless' ? R(4) : 0;
    G.S.st.rolls++;
    return { d, a, b, bless, total: d + hit + bless, two: adv !== dis };
  }

  /* ---------- действия героя ---------- */
  G.act = {};
  G.act.attack = () => {
    const S = G.S, C = S.combat;
    if (!C.turn.action) return;
    C.turn.action = 0;
    const n = S.hero.cls === 'fighter' && S.hero.lvl >= 5 ? 2 : 1;
    for (let i = 0; i < n; i++) { const e = tgt(); if (!e) break; weaponStrike(e); }
    C.hero.invisNext = false;
    afterHeroAct();
  };

  function weaponStrike(e) {
    const S = G.S, C = S.combat, w = G.weapon();
    const { adv, why } = heroAdvantage(e);
    const r = atkRoll(w.hit, adv, false);
    const crit = r.d >= G.critMin() || e.st.held || (S.hero.cls === 'rogue' && S.hero.lvl >= 3 && e.st.surprised && r.d !== 1);
    const hit = r.d !== 1 && (r.d >= G.critMin() || r.total >= e.ac);
    let s = w.name + ' → ' + e.name + ': ' + (r.two ? '[' + r.a + '/' + r.b + '] ' : '') + r.d + F(w.hit) + (r.bless ? ' +' + r.bless + ' (благ.)' : '') + ' = ' + r.total + ' против КД ' + e.ac + (why.length ? ' (' + why.join(', ') + ')' : '');
    if (!hit) { log('miss', s + ' — промах.'); return; }
    if (crit) S.st.crits++;
    let dice = w.dice[0] * (crit ? 2 : 1);
    let dmg = D(dice, w.dice[1]) + w.dmgMod;
    let extra = '';
    if (S.hero.cls === 'rogue' && !C.turn.sneak && (adv || (C.comp && !C.comp.down))) {
      C.turn.sneak = true;
      const sd = G.sneakDice() * (crit ? 2 : 1);
      const sa = D(sd, 6);
      dmg += sa; extra = ' + скрытая атака ' + sd + 'к6 (' + sa + ')';
    }
    const [amt, note] = dmgEnemy(e, Math.max(1, dmg), w.type, 'melee');
    delete C.marked[e.uid];
    log('hit', s + (crit ? ' — КРИТ! ' : ' — попадание! ') + 'Урон ' + amt + ' ' + TYPE_RU[w.type] + extra + '.' + note);
    if (S.hero.cls === 'cleric' && !C.turn.divine && !e.out) {
      C.turn.divine = true;
      const [ra, rn] = dmgEnemy(e, D(crit ? 2 : 1, 8), 'radiant', 'melee');
      log('hit', 'Божественный удар: ещё ' + ra + ' излучением.' + rn);
    }
  }

  G.act.target = uid => { G.S.combat.target = uid; G.render(); };
  G.act.nonlethal = () => { const C = G.S.combat; C.nonlethal = !C.nonlethal; G.render(); };

  G.act.dodge = () => {
    const C = G.S.combat; if (!C.turn.action) return;
    C.turn.action = 0; C.dodge = true;
    log('sys', 'Вы уходите в глухую оборону: атаки по вам с помехой до следующего хода.');
    afterHeroAct();
  };

  G.act.potion = who => {
    const S = G.S, C = S.combat;
    if (!C.turn.action || !G.has('potion_heal')) return;
    C.turn.action = 0; G.take('potion_heal');
    const amt = D(2, 4) + 2;
    if (who === 'comp' && C.comp) {
      const was = C.comp.down;
      const got = G.healComp(amt); if (was) C.comp.down = false;
      log('heal', 'Вы вливаете зелье в ' + G.compDef().short + ': +' + got + ' хитов.' + (was ? ' Он снова на ногах!' : ''));
    } else {
      const got = G.heal(amt);
      log('heal', 'Вы пьёте зелье лечения: +' + got + ' хитов.');
    }
    afterHeroAct();
  };
  G.act.invis = () => {
    const S = G.S, C = S.combat;
    if (!C.turn.action || !G.has('potion_invis')) return;
    C.turn.action = 0; G.take('potion_invis');
    C.hero.invis = 3; C.hero.invisNext = true;
    log('good', 'Вы пьёте зелье невидимости и растворяетесь в воздухе.');
    afterHeroAct();
  };

  G.act.wind = () => {
    const S = G.S, C = S.combat, h = S.hero;
    if (!C.turn.bonus || !h.res.wind) return;
    C.turn.bonus = 0; h.res.wind = false;
    const got = G.heal(R(10) + h.lvl);
    log('heal', 'Второе дыхание: +' + got + ' хитов.');
    G.save(); G.render();
    maybeAutoEnd();
  };
  G.act.surge = () => {
    const S = G.S, C = S.combat, h = S.hero;
    if (!h.res.surge || C.turn.action) return;
    h.res.surge = false; C.turn.action = 1;
    log('good', 'Всплеск действий! Ещё одно действие в этот ход.');
    G.save(); G.render();
  };
  G.act.aim = () => {
    const C = G.S.combat; if (!C.turn.bonus) return;
    C.turn.bonus = 0; C.turn.aim = true;
    log('sys', 'Вы замираете и выцеливаете слабое место: следующая атака с преимуществом.');
    G.save(); G.render();
  };
  G.act.hide = () => {
    const S = G.S, C = S.combat; if (!C.turn.bonus) return;
    C.turn.bonus = 0;
    const pp = Math.max(...alive().map(e => G.MONSTERS[e.k].pp || 10));
    const r = R(20), tot = r + G.skillBonus('stealth');
    if (tot >= pp) { C.hero.hidden = true; log('good', 'Скрыться: ' + r + F(G.skillBonus('stealth')) + ' = ' + tot + ' против пассивной Внимательности ' + pp + '. Вас потеряли из виду: следующая атака с преимуществом, по вам — с помехой.'); }
    else log('miss', 'Скрыться: ' + r + F(G.skillBonus('stealth')) + ' = ' + tot + ' против ' + pp + ' — вас замечают.');
    G.save(); G.render();
    maybeAutoEnd();
  };

  G.act.channel = kind => {
    const S = G.S, C = S.combat, h = S.hero;
    if (!C.turn.action || !h.res.channel) return;
    C.turn.action = 0; h.res.channel = false;
    if (kind === 'turn') {
      log('good', 'Вы поднимаете священный символ: «Изыди!»');
      alive().filter(e => G.MONSTERS[e.k].undead).forEach(e => {
        const r = R(20) + (G.MONSTERS[e.k].wis || 0);
        if (r >= G.spellDC()) log('miss', e.name + ': спасбросок ' + r + ' против Сл ' + G.spellDC() + ' — выдерживает.');
        else if (h.lvl >= 5 && G.MONSTERS[e.k].hp <= 13) { e.hp = 0; e.out = 'dead'; log('hit', e.name + ' рассыпается в прах!'); }
        else { e.st.turned = true; e.out = 'turned'; log('hit', e.name + ' в ужасе бежит от святого света.'); }
      });
    } else {
      const pool = 5 * h.lvl;
      let give = Math.min(pool, Math.floor(G.maxHp() / 2) - h.hp);
      give = Math.max(0, give);
      const got = G.heal(give);
      let rest = pool - got, cg = 0;
      if (C.comp && rest > 0) { const was = C.comp.down; cg = G.healComp(Math.min(rest, Math.floor(G.compDef().hp / 2))); if (was && cg) C.comp.down = false; }
      log('heal', 'Сохранение жизни: вы +' + got + (C.comp ? ', ' + G.compDef().short + ' +' + cg : '') + ' хитов.');
    }
    afterHeroAct();
  };

  G.act.flee = () => {
    const S = G.S, C = S.combat;
    if (!C.canFlee || !C.turn.action) return;
    C.over = 'flee';
    log('sys', 'Вы отступаете.');
    G.save(); G.render();
  };

  /* ---------- заклинания ---------- */
  G.castable = (id, inCombat) => {
    const S = G.S, h = S.hero, sp = G.SPELLS[id], C = S.combat;
    if (sp.lvl && h.slots[sp.lvl - 1] < 1 && !(id === 'mage_armor' && h.equip.staff)) return false;
    if (!inCombat) return ['mage_armor', 'cure_wounds', 'healing_word', 'mass_healing_word'].includes(id);
    if (sp.cost === 'reaction') return false;
    if (sp.cost === 'bonus' && !C.turn.bonus) return false;
    if (sp.cost === 'action' && !C.turn.action) return false;
    if (id === 'mage_armor' && h.mageArmor) return false;
    if (id === 'spiritual_weapon' && C.sw) return false;
    /* правило бонусного заклинания: если бонусом кастовали заклинание, действием — только заговор, и наоборот */
    if (C.turn.bonusSpell && sp.lvl > 0 && sp.cost === 'action') return false;
    if (C.turn.leveledAction && sp.cost === 'bonus' && sp.lvl > 0) return false;
    return true;
  };

  G.act.cast = id => {
    const S = G.S, C = S.combat, h = S.hero, sp = G.SPELLS[id];
    if (!G.castable(id, true)) return;
    if (sp.cost === 'bonus') { C.turn.bonus = 0; if (sp.lvl) C.turn.bonusSpell = true; }
    else { C.turn.action = 0; if (sp.lvl) C.turn.leveledAction = true; }
    if (sp.lvl && !(id === 'mage_armor' && h.equip.staff)) h.slots[sp.lvl - 1]--;
    const dc = G.spellDC(), hitB = G.spellHit();
    const scale = sp.scale && h.lvl >= 5 ? 2 : 1;
    const e = tgt();
    if (sp.conc) { if (C.conc && C.conc !== id) log('sys', 'Концентрация на «' + G.SPELLS[C.conc].name + '» прервана.'); C.conc = id; }

    if (sp.kind === 'attack' && e) {
      const { adv, why } = heroAdvantage(e);
      const r = atkRoll(hitB, adv, false);
      const crit = r.d === 20 || e.st.held;
      const s = sp.name + ' → ' + e.name + ': ' + (r.two ? '[' + r.a + '/' + r.b + '] ' : '') + r.d + F(hitB) + ' = ' + r.total + ' против КД ' + e.ac + (why.length ? ' (' + why.join(', ') + ')' : '');
      if (r.d === 1 || (r.total < e.ac && !crit)) log('miss', s + ' — промах.');
      else {
        const dm = D(sp.dice[0] * scale * (crit ? 2 : 1), sp.dice[1]);
        const [amt, note] = dmgEnemy(e, dm, sp.type, 'spell');
        if (sp.mark && !e.out) C.marked[e.uid] = true;
        log('hit', s + (crit ? ' — КРИТ! ' : ' — попадание! ') + 'Урон ' + amt + ' ' + TYPE_RU[sp.type] + '.' + note + (sp.mark && !e.out ? ' Цель сияет: следующая атака по ней с преимуществом.' : ''));
      }
    } else if (sp.kind === 'save') {
      const n = sp.targets || 1;
      const list = [e].concat(alive().filter(x => x !== e)).filter(Boolean).slice(0, n);
      const dm = D(sp.dice[0] * scale, sp.dice[1]);
      log('sys', sp.name + (list.length > 1 ? ' (' + list.length + ' ' + G.plural(list.length, 'цель', 'цели', 'целей') + ')' : '') + ': Сл ' + dc + '.');
      list.forEach(x => {
        const m = G.MONSTERS[x.k];
        const sv = R(20) + (sp.save === 'dex' ? (m.dex || 0) : (m.wis || 0));
        const ok = sv >= dc;
        const got = ok ? (sp.half ? Math.floor(dm / 2) : 0) : dm;
        if (!got) { log('miss', x.name + ': спасбросок ' + sv + ' — уклоняется.'); return; }
        const [amt, note] = dmgEnemy(x, got, sp.type, 'spell');
        log('hit', x.name + ': спасбросок ' + sv + (ok ? ' — половина' : ' — провал') + ', урон ' + amt + ' ' + TYPE_RU[sp.type] + '.' + note);
      });
    } else if (sp.kind === 'auto' && e) {
      let tot = 0; const parts = [];
      for (let i = 0; i < sp.darts; i++) { const d = R(sp.dice[1]) + sp.plus; tot += d; parts.push(d); }
      const [amt, note] = dmgEnemy(e, tot, sp.type, 'spell');
      log('hit', sp.name + ' → ' + e.name + ': ' + parts.join(' + ') + ' = ' + amt + ' ' + TYPE_RU[sp.type] + '.' + note);
    } else if (sp.kind === 'rays') {
      for (let i = 0; i < sp.rays; i++) {
        const x = tgt(); if (!x) break;
        const { adv } = heroAdvantage(x);
        const r = atkRoll(hitB, adv, false);
        if (r.d === 1 || (r.total < x.ac && r.d !== 20)) { log('miss', 'Луч ' + (i + 1) + ' → ' + x.name + ': ' + r.total + ' — промах.'); continue; }
        const [amt, note] = dmgEnemy(x, D(sp.dice[0] * (r.d === 20 ? 2 : 1), sp.dice[1]), sp.type, 'spell');
        log('hit', 'Луч ' + (i + 1) + ' → ' + x.name + ': ' + r.total + ' — попадание, ' + amt + ' ' + TYPE_RU[sp.type] + '.' + note);
      }
    } else if (sp.kind === 'hold' && e) {
      const m = G.MONSTERS[e.k];
      if (!m.humanoid) { log('miss', sp.name + ': ' + e.name + ' не гуманоид, заклинание не действует.'); C.conc = null; }
      else {
        C.conc = 'hold';
        const sv = R(20) + (m.wis || 0);
        if (sv >= dc) { log('miss', sp.name + ' → ' + e.name + ': спасбросок ' + sv + ' против Сл ' + dc + ' — сопротивляется.'); C.conc = null; }
        else { e.st.held = true; C.holdUid = e.uid; log('good', sp.name + ' → ' + e.name + ': спасбросок ' + sv + ' — парализован! Атаки по нему с преимуществом и критом.'); }
      }
    } else if (sp.kind === 'heal') {
      const base = D(sp.dice[0], sp.dice[1]) + G.spellMod() + 2 + sp.lvl;
      const toComp = G.UI.healComp && C.comp;
      if (sp.both) {
        const g1 = G.heal(base); let g2 = 0;
        if (C.comp) { const was = C.comp.down; g2 = G.healComp(base); if (was && g2) C.comp.down = false; }
        log('heal', sp.name + ': вы +' + g1 + (C.comp ? ', ' + G.compDef().short + ' +' + g2 : '') + '.');
      } else if (toComp) {
        const was = C.comp.down; const g = G.healComp(base); if (was && g) C.comp.down = false;
        log('heal', sp.name + ' → ' + G.compDef().short + ': +' + g + ' хитов.' + (was ? ' Снова в строю!' : ''));
      } else { const g = G.heal(base); log('heal', sp.name + ': +' + g + ' хитов.'); }
    } else if (id === 'bless') {
      log('good', 'Благословение: вы' + (C.comp ? ' и ' + G.compDef().short : '') + ' получаете +1к4 к атакам и спасброскам.');
    } else if (id === 'shield_of_faith') {
      log('good', 'Щит веры: мерцающее поле, +2 к КД.');
    } else if (id === 'spirit_guardians') {
      log('good', 'Духовные стражи кружат вокруг вас сияющими тенями.');
      spiritGuardians();
    } else if (id === 'spiritual_weapon') {
      C.sw = true;
      log('good', 'Над полем боя возникает призрачный молот.');
      swStrike();
    } else if (id === 'mage_armor') {
      h.mageArmor = true; log('good', 'Доспехи мага: КД ' + G.ac() + '.');
    } else if (id === 'sleep') {
      let pool = D(5 + 2 * (0), 8);
      log('sys', 'Усыпление: запас ' + pool + ' хитов.');
      const list = alive().filter(x => !G.MONSTERS[x.k].undead && !x.st.sleep).sort((a, b) => a.hp - b.hp);
      for (const x of list) {
        if (x.hp > pool) break;
        pool -= x.hp; x.st.sleep = true;
        log('good', x.name + ' засыпает.');
      }
    } else if (id === 'fireball') {
      /* покрыт веткой save */
    }
    C.hero.invisNext = false;
    if (sp.cost === 'bonus') { G.save(); G.render(); maybeAutoEnd(); } else afterHeroAct();
  };

  function swStrike() {
    const C = G.S.combat, e = tgt(); if (!e) return;
    const hitB = G.spellHit();
    const { adv } = heroAdvantage(e);
    const r = atkRoll(hitB, adv, false);
    if (r.d === 1 || (r.total < e.ac && r.d !== 20)) { log('miss', 'Духовное оружие → ' + e.name + ': ' + r.total + ' — промах.'); return; }
    const [amt, note] = dmgEnemy(e, D(r.d === 20 ? 2 : 1, 8) + G.spellMod(), 'force', 'spell');
    log('hit', 'Духовное оружие → ' + e.name + ': ' + r.total + ' — удар, ' + amt + ' силовым полем.' + note);
  }
  G.act.sw = () => {
    const C = G.S.combat; if (!C.sw || !C.turn.bonus) return;
    C.turn.bonus = 0; swStrike(); G.save(); G.render(); maybeAutoEnd();
  };
  function spiritGuardians() {
    const dc = G.spellDC();
    alive().forEach(x => {
      const sv = R(20) + (G.MONSTERS[x.k].wis || 0);
      const dm = D(3, 8), got = sv >= dc ? Math.floor(dm / 2) : dm;
      const [amt, note] = dmgEnemy(x, got, 'radiant', 'spell');
      log('hit', 'Стражи жгут ' + x.name + ': ' + amt + ' излучением.' + note);
    });
  }

  G.act.scroll = id => {
    const S = G.S, C = S.combat;
    if (!C.turn.action || !G.has(id)) return;
    G.take(id);
    const sp = G.ITEMS[id].spell;
    S.hero.slots[2]++; /* временная ячейка, которую тут же потратит заклинание */
    log('good', 'Вы читаете ' + G.ITEMS[id].name.toLowerCase() + '.');
    G.act.cast(sp);
  };

  G.act.toggleShield = () => { const h = G.S.hero; h.shieldAuto = !h.shieldAuto; G.render(); };
  G.act.end = () => { const C = G.S.combat; C.turn.action = 0; C.turn.bonus = 0; afterHeroAct(); };

  /* Остались ли у героя осмысленные ходы после основного действия.
     Если нет — ход заканчивается сам, чтобы не заставлять жать «Завершить ход». */
  function heroCanStillAct() {
    const S = G.S, C = S.combat, h = S.hero;
    if (C.turn.action) return true;
    if (h.cls === 'fighter' && h.res.surge) return true;
    if (!C.turn.bonus) return false;
    const low = h.hp <= G.maxHp() / 2;
    const compLow = C.comp && (C.comp.down || G.compHp() <= G.compDef().hp / 2);
    if (h.cls === 'fighter' && h.res.wind && low) return true;
    if (h.cls === 'rogue' && h.lvl >= 2) return true;
    if (C.sw) return true;
    if (h.cls === 'cleric' && (low || compLow) && ['healing_word', 'mass_healing_word'].some(id => G.knownSpells().includes(id) && G.castable(id, true))) return true;
    return false;
  }
  function maybeAutoEnd() {
    const C = G.S.combat;
    if (C.over) return;
    if (!alive().length || checkEnd()) { G.save(); G.render(); return; }
    if (!heroCanStillAct()) afterHeroAct(true);
  }

  function afterHeroAct(force) {
    const S = G.S, C = S.combat;
    if (checkEnd()) { G.save(); G.render(); return; }
    if (!force && heroCanStillAct()) { G.save(); G.render(); return; }
    compTurn();
    if (checkEnd()) { G.save(); G.render(); return; }
    if (C.conc === 'spirit_guardians') { spiritGuardians(); if (checkEnd()) { G.save(); G.render(); return; } }
    enemyPhase();
    if (checkEnd()) { G.save(); G.render(); return; }
    newRound();
    if (checkEnd()) { G.save(); G.render(); return; }
    G.save(); G.render();
  }

  /* ---------- напарник ---------- */
  function compTurn() {
    const S = G.S, C = S.combat;
    if (!C.comp || C.comp.down) return;
    const d = G.compDef();
    if (d.coward && R(2) === 1) { log('ally', d.short + ' прячется за камнем и дрожит.'); return; }
    const e = tgt(); if (!e) return;
    let a = R(20), b = R(20);
    let dd = a;
    if (d.coward) dd = Math.min(a, b);
    let adv = e.st.prone || e.st.held || e.st.sleep || C.marked[e.uid];
    if (adv && !d.coward) dd = Math.max(a, b);
    const bless = C.conc === 'bless' ? R(4) : 0;
    const tot = dd + d.atk.hit + bless;
    const head = d.short + ' (' + d.atk.n + ') → ' + e.name + ': ' + dd + F(d.atk.hit) + (bless ? ' +' + bless : '') + ' = ' + tot;
    if (dd === 1 || (tot < e.ac && dd !== 20)) { log('ally miss', head + ' — промах.'); return; }
    const [amt, note] = dmgEnemy(e, D(d.atk.dice[0] * (dd === 20 ? 2 : 1), d.atk.dice[1]) + d.atk.mod, d.atk.type, 'melee');
    delete C.marked[e.uid];
    log('ally', head + ' — попадание, ' + amt + '.' + note);
  }

  /* ---------- враги ---------- */
  function enemyPhase() {
    const S = G.S, C = S.combat;
    for (const e of C.enemies) {
      if (e.out) continue;
      C.acted[e.uid] = true;
      if (e.st.surprised) { e.st.surprised = false; continue; }
      if (e.st.sleep) { log('sys', e.name + ' спит.'); continue; }
      if (e.st.held) {
        const m = G.MONSTERS[e.k];
        const sv = R(20) + (m.wis || 0);
        if (sv >= G.spellDC()) { e.st.held = false; C.conc = null; log('sys', e.name + ' стряхивает паралич (спасбросок ' + sv + ').'); }
        else log('sys', e.name + ' парализован и не может двигаться.');
        continue;
      }
      if (e.st.prone) { e.st.prone = false; }
      enemyAct(e);
      if (heroAndCompDown()) return;
    }
    const E = G.ENC[C.id];
    if (E.lastFlees) {
      const al = alive();
      if (al.length === 1 && C.enemies.length >= 3 && C.enemies.filter(x => x.out).length >= 2 && !al[0].st.held && !al[0].st.sleep) {
        al[0].out = 'fled'; C.fled.push(al[0].name);
        log('sys', al[0].name + ' бросается наутёк!');
      }
    }
  }

  function heroAndCompDown() {
    const C = G.S.combat;
    return C.hero.down && (!C.comp || C.comp.down);
  }

  function pickTarget() {
    const C = G.S.combat;
    const heroUp = !C.hero.down, compUp = C.comp && !C.comp.down;
    if (heroUp && compUp) return R(100) <= 60 ? 'hero' : 'comp';
    return heroUp ? 'hero' : 'comp';
  }

  function enemyAct(e) {
    const S = G.S, C = S.combat, m = G.MONSTERS[e.k];
    /* особые действия */
    if (m.special) {
      for (const sp of m.special) {
        if (sp.uses && (e.uses[sp.n] || 0) >= sp.uses) continue;
        if (R(100) <= sp.w) {
          e.uses[sp.n] = (e.uses[sp.n] || 0) + 1;
          return enemySpecial(e, sp);
        }
      }
    }
    const n = m.multi || 1;
    for (let i = 0; i < n; i++) {
      const who = pickTarget();
      enemyAttack(e, m.atk[0], who, i === 0 && C.hero.surprised && who === 'hero' && m.surprise);
      if (heroAndCompDown()) return;
    }
  }

  function enemyAttack(e, atk, who, surpriseBonus) {
    const S = G.S, C = S.combat;
    let adv = false, dis = false;
    const why = [];
    if (who === 'hero') {
      if (C.hero.prone) { adv = true; why.push('вы на земле'); }
      if (C.hero.held) { adv = true; why.push('вы парализованы'); }
      if (C.dodge) { dis = true; why.push('оборона'); }
      if (C.hero.hidden) { dis = true; why.push('вы скрыты'); }
      if (C.hero.invis > 0) { dis = true; why.push('невидимость'); }
      if (C.comp && !C.comp.down && G.compDef().protect && !C.protectUsed) { C.protectUsed = true; dis = true; why.push(G.compDef().short + ' прикрывает щитом'); }
    }
    if (e.poisoned) { dis = true; why.push('пьян'); }
    let a = R(20), b = R(20), d = a;
    if (adv && !dis) d = Math.max(a, b);
    if (dis && !adv) d = Math.min(a, b);
    const tot = d + atk.hit;
    let ac = who === 'hero' ? G.ac() + (C.conc === 'shield_of_faith' ? 2 : 0) + (C.shieldUp ? 5 : 0) : G.compDef().ac;
    const target = who === 'hero' ? 'вас' : G.compDef().short;
    let head = e.name + ' (' + atk.n + ') → ' + target + ': ' + (adv !== dis ? '[' + a + '/' + b + '] ' : '') + d + F(atk.hit) + ' = ' + tot + ' против КД ' + ac + (why.length ? ' (' + why.join(', ') + ')' : '');
    let hit = d !== 1 && (d === 20 || tot >= ac);
    /* Щит волшебника */
    if (hit && who === 'hero' && S.hero.cls === 'wizard' && S.hero.shieldAuto && !C.shieldUp && d !== 20 && tot < ac + 5) {
      const free = S.hero.res.freeShield > 0;
      if (free || S.hero.slots[0] > 0) {
        if (free) S.hero.res.freeShield--; else S.hero.slots[0]--;
        C.shieldUp = true; ac += 5; hit = false;
        head += ' → Щит! КД ' + ac + (free ? ' (заряд посоха)' : '');
      }
    }
    if (!hit) { log('miss', head + ' — промах.'); return; }
    const crit = d === 20 || (who === 'hero' && C.hero.held);
    let dmg = D(atk.dice[0] * (crit ? 2 : 1), atk.dice[1]) + atk.mod;
    let extra = '';
    if (surpriseBonus) { const sb = D(surpriseBonus[0], surpriseBonus[1]); dmg += sb; extra = ' (+' + sb + ' внезапная атака)'; e.st.firstStrike = false; }
    if (who === 'hero') {
      if (S.hero.race === 'dwarf' && atk.type === 'poison') dmg = Math.floor(dmg / 2);
      if (S.hero.cls === 'rogue' && S.hero.lvl >= 5 && !C.uncanny) { C.uncanny = true; dmg = Math.floor(dmg / 2); extra += ' (невероятное уклонение: половина)'; }
      G.hurt(dmg);
      log('bad', head + (crit ? ' — КРИТ! ' : ' — попадание! ') + 'Урон ' + dmg + extra + '. У вас ' + S.hero.hp + ' хитов.');
      concCheck(dmg);
      if (atk.prone && S.hero.hp > 0) {
        const sv = R(20) + G.saveBonus('str');
        if (sv < atk.prone) { C.hero.prone = true; log('bad', 'Вас сбивают с ног (спасбросок Силы ' + sv + ' против ' + atk.prone + ').'); }
      }
      if (S.hero.hp <= 0) heroFalls();
    } else {
      compHurt(dmg, head + (crit ? ' — КРИТ! ' : ' — попадание! ') + 'Урон ' + dmg + extra + '.');
    }
  }

  function enemySpecial(e, sp) {
    const S = G.S, C = S.combat;
    if (sp.auto) {
      const who = pickTarget();
      let tot = 0; const parts = [];
      for (let i = 0; i < sp.darts; i++) { const d = R(sp.dice[1]) + sp.mod; tot += d; parts.push(d); }
      if (who === 'hero' && S.hero.cls === 'wizard' && S.hero.shieldAuto && !C.shieldUp && (S.hero.res.freeShield > 0 || S.hero.slots[0] > 0)) {
        if (S.hero.res.freeShield > 0) S.hero.res.freeShield--; else S.hero.slots[0]--;
        C.shieldUp = true;
        log('good', e.name + ' выпускает ' + sp.n.toLowerCase() + ', но ваш Щит поглощает дротики!');
        return;
      }
      if (who === 'hero') { G.hurt(tot); log('bad', e.name + ': ' + sp.n + ' → вас: ' + parts.join(' + ') + ' = ' + tot + '. У вас ' + S.hero.hp + ' хитов.'); concCheck(tot); if (S.hero.hp <= 0) heroFalls(); }
      else compHurt(tot, e.name + ': ' + sp.n + ' → ' + G.compDef().short + ': ' + tot + '.');
      return;
    }
    if (sp.hold) {
      if (C.hero.down || C.hero.held) return enemyAttack(e, G.MONSTERS[e.k].atk[0], pickTarget());
      const r = R(20), adv = S.hero.race === 'elf' ? false : false;
      const bless = C.conc === 'bless' ? R(4) : 0;
      const sv = r + G.saveBonus('wis') + bless;
      if (sv >= sp.dc) log('miss', e.name + ': ' + sp.n + ' → вас. Спасбросок Мудрости ' + sv + ' против Сл ' + sp.dc + ' — вы сопротивляетесь.');
      else { C.hero.held = 2; log('bad', e.name + ': ' + sp.n + ' → вас. Спасбросок ' + sv + ' — вы парализованы!'); }
      return;
    }
    if (sp.save) {
      const who = pickTarget();
      const dmg = D(sp.dice[0], sp.dice[1]);
      if (who === 'hero') {
        const bless = C.conc === 'bless' ? R(4) : 0;
        const sv = R(20) + G.saveBonus(sp.save) + bless;
        const ok = sv >= sp.dc;
        const got = ok ? (sp.half ? Math.floor(dmg / 2) : 0) : dmg;
        if (!got) { log('miss', e.name + ': ' + sp.n + ' → вас. Спасбросок ' + G.ABIL[sp.save] + ' ' + sv + ' против Сл ' + sp.dc + ' — выдерживаете.'); return; }
        G.hurt(got);
        log('bad', e.name + ': ' + sp.n + ' → вас. Спасбросок ' + sv + ' — провал. Урон ' + got + ' ' + TYPE_RU[sp.type] + '. У вас ' + S.hero.hp + ' хитов.');
        concCheck(got);
        if (S.hero.hp <= 0) heroFalls();
      } else {
        const sv = R(20) + 2;
        const got = sv >= sp.dc ? (sp.half ? Math.floor(dmg / 2) : 0) : dmg;
        if (!got) { log('miss', e.name + ': ' + sp.n + ' → ' + G.compDef().short + ' — выдерживает.'); return; }
        compHurt(got, e.name + ': ' + sp.n + ' → ' + G.compDef().short + ': ' + got + '.');
      }
    }
  }

  function concCheck(dmg) {
    const C = G.S.combat;
    if (!C.conc) return;
    const dc = Math.max(10, Math.floor(dmg / 2));
    const sv = R(20) + G.saveBonus('con');
    if (sv < dc) {
      log('bad', 'Концентрация сорвана (спасбросок ' + sv + ' против ' + dc + '): «' + (G.SPELLS[C.conc] ? G.SPELLS[C.conc].name : 'Удержание') + '» заканчивается.');
      if (C.conc === 'hold') C.enemies.forEach(x => { x.st.held = false; });
      C.conc = null;
    }
  }

  function compHurt(dmg, text) {
    const S = G.S, C = S.combat, d = G.compDef();
    S.compHp[S.comp] = Math.max(0, G.compHp() - dmg);
    log('bad', text + ' У ' + d.short + ' ' + G.compHp() + ' хитов.');
    if (G.compHp() <= 0 && !C.comp.down) { C.comp.down = true; log('bad', d.short + ' падает без сознания!'); }
  }

  function heroFalls() {
    const C = G.S.combat;
    if (C.hero.down) return;
    C.hero.down = true;
    C.conc = null;
    C.enemies.forEach(x => { x.st.held = false; });
    log('bad', 'Вы падаете без сознания!');
  }
  function checkEnd() {
    const S = G.S, C = S.combat;
    if (C.over) return true;
    if (C.hero.held && C.hero.held > 0) { /* паралич спадает сам через 2 раунда */ }
    const al = alive();
    const E = G.ENC[C.id];
    if (E.trigger && al.length) {
      const ev = E.trigger(S, C);
      if (ev) { C.over = 'event'; C.eventScene = ev; return true; }
    }
    if (!al.length) { C.over = 'win'; log('win', 'Победа!'); return true; }
    if (al.every(e => e.st.sleep)) {
      al.forEach(e => { e.out = 'captured'; C.captured++; });
      C.over = 'win'; log('win', 'Все оставшиеся враги спят. Вы связываете их. Победа!');
      return true;
    }
    if (heroAndCompDown()) { C.over = 'lose'; log('bad', 'Поражение…'); return true; }
    return false;
  }

  /* ---------- конец боя ---------- */
  G.endFight = () => {
    const S = G.S, C = S.combat, E = G.ENC[C.id];
    const res = C.over;
    const info = { captured: C.captured, fled: C.fled.slice(), enemies: C.enemies.map(e => ({ k: e.k, name: e.name, out: e.out, flag: e.flag })) };
    S.lastFight = info;
    const eventScene = C.eventScene;
    S.combat = null;
    S.notes = [];
    if (res === 'event') {
      if (E.onEvent) E.onEvent(S, info);
      G.go(eventScene);
      return;
    }
    if (res === 'win') {
      if (S.hero.hp <= 0) { S.hero.hp = 1; G.note('Напарник приводит вас в чувство. 1 хит.', 'muted'); }
      if (S.comp && G.compHp() <= 0) S.compHp[S.comp] = 1;
      const xp = G.val(E.xp);
      if (xp) G.xp(xp, E.xpWhy || 'победа в бою');
      if (E.onWin) E.onWin(S, info);
      G.go(G.val(E.win));
    } else if (res === 'flee') {
      if (E.onFlee) E.onFlee(S, info);
      G.go(G.val(E.flee) || S.prevScene || S.scene);
    } else {
      if (E.lose) {
        if (S.hero.hp <= 0) S.hero.hp = 1;
        if (S.comp && G.compHp() <= 0) S.compHp[S.comp] = 1;
        if (E.onLose) E.onLose(S, info);
        G.go(G.val(E.lose));
      } else {
        G.UI.sheet = 'defeat';
        G.render();
      }
    }
  };

  G.retryFight = () => {
    const cp = G.loadCP();
    if (!cp) return;
    G.S = cp;
    G.UI.sheet = null;
    const scene = G.S.scene;
    G.save();
    /* бой начинается заново из сцены, где был выбор */
    G.render(true);
  };

  G.TYPE_RU = TYPE_RU;
})();
