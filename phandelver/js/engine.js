/* Движок: состояние, герой, проверки, сцены, листы, отдых, лавки, сохранения. */
(() => {
  const G = window.G;
  const SAVE = 'phandelver-save-v1';
  const CPKEY = 'phandelver-cp-v1';

  G.SC = G.SC || {};
  G.ENC = G.ENC || {};
  G.QUESTS = G.QUESTS || {};
  G.SHOPS = G.SHOPS || {};
  G.READY_CHAPTERS = G.READY_CHAPTERS || [1, 2];

  /* ---------- утилиты ---------- */
  G.rnd = n => 1 + Math.floor(Math.random() * n);
  G.roll = (n, s) => { let t = 0; for (let i = 0; i < n; i++) t += G.rnd(s); return t; };
  G.fmt = m => (m >= 0 ? '+' : '−') + Math.abs(m);
  G.clone = o => JSON.parse(JSON.stringify(o));
  G.val = (x, ...a) => (typeof x === 'function' ? x(G.S, ...a) : x);
  G.esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  G.plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return (m === 1 && h !== 11) ? a : (m >= 2 && m <= 4 && (h < 10 || h >= 20)) ? b : c; };

  /* Модуль рассчитан на отряд из 4–5 героев. Одиночке — героическая закалка: +50% хитов. */
  G.SOLO_HP = 1.5;

  G.UI = { sheet: null, confirm: false, logSeen: 0, shop: null, restHeal: [] };

  /* ---------- новая игра ---------- */
  G.newState = (name, race, cls) => {
    const S = {
      v: 1, scene: 'c1_intro', chapter: 1, loc: 'Триборская тропа',
      hero: { name, race, cls, lvl: 1, xp: 0, hp: 1, hd: 1, slots: [0, 0, 0], res: {}, mageArmor: false, insp: false, equip: {}, shieldAuto: true },
      comp: null, compHp: {},
      inv: { potion_heal: 2 }, cp: 1500,
      f: {}, quests: {}, clues: [], notes: [], tmp: null, combat: null, levelUps: [],
      st: { rolls: 0, crits: 0, kills: 0, fights: 0 }
    };
    G.S = S;
    const h = S.hero;
    h.hp = G.maxHp(); h.hd = 1;
    h.slots = G.slotMax().slice();
    G.restoreRes('long');
    G.morningArmor();
    S.notes = [];
    return S;
  };

  /* ---------- производные характеристики ---------- */
  G.cls = () => G.CLASSES[G.S.hero.cls];
  G.race = () => G.RACES[G.S.hero.race];
  G.score = ab => {
    const h = G.S.hero, c = G.cls(), r = G.race();
    let v = c.base[ab] + ((r.abil && r.abil[ab]) || 0);
    if (h.lvl >= 4 && ab === c.primary) v += 2;
    if (ab === 'str' && h.equip && h.equip.gauntlets) v = Math.max(v, 19);
    return Math.min(20, v);
  };
  G.mod = ab => Math.floor((G.score(ab) - 10) / 2);
  G.prof = () => (G.S.hero.lvl >= 5 ? 3 : 2);
  G.hasSkill = sk => G.cls().skills.includes(sk) || ((G.race().skills || []).includes(sk));
  G.skillBonus = sk => {
    const ab = G.SKILLS[sk][1];
    let b = G.mod(ab);
    if (G.hasSkill(sk)) b += G.prof() * ((G.cls().expertise || []).includes(sk) ? 2 : 1);
    if (G.S.hero.race === 'human' && false) b += 0;
    return b;
  };
  G.saveBonus = ab => G.mod(ab) + (G.cls().saves.includes(ab) ? G.prof() : 0) + (G.S.hero.equip.ring ? 1 : 0);
  G.toolsBonus = () => G.mod('dex') + (G.cls().tools ? G.prof() * 2 : 0);
  G.passive = sk => 10 + G.skillBonus(sk);
  G.maxHp = () => {
    const h = G.S.hero, c = G.cls(), con = G.mod('con');
    let hp = c.hd + con + (h.lvl - 1) * (Math.floor(c.hd / 2) + 1 + con);
    if (h.race === 'dwarf') hp += h.lvl;
    return Math.round(hp * G.SOLO_HP);
  };
  G.slotMax = () => (G.cls().caster ? G.SLOTS[G.S.hero.lvl] : [0, 0, 0]);
  G.ac = () => {
    const h = G.S.hero, c = G.cls(), dex = G.mod('dex');
    let ac;
    if (h.cls === 'wizard') ac = (h.mageArmor ? 13 : 10) + dex;
    else if (h.cls === 'rogue') ac = 12 + dex;
    else ac = Math.max(h.equip.armor === 'splint' ? 17 : c.armor.base, h.equip.dragonguard ? 15 + Math.min(2, dex) : 0);
    if (c.shield) ac += 2;
    if (h.equip.ring) ac += 1;
    return ac;
  };
  G.armorName = () => {
    const h = G.S.hero;
    if (h.cls === 'wizard') return h.mageArmor ? 'Доспехи мага' : 'Без доспехов';
    if (h.equip.armor === 'splint') return 'Наборный доспех';
    return G.cls().armor.name;
  };
  G.weapon = () => {
    const h = G.S.hero, w = Object.assign({}, G.cls().weapon);
    w.magic = 0;
    if (h.cls === 'fighter' && h.equip.talon) { w.name = 'Коготь (длинный меч +1)'; w.magic = 1; }
    if (h.cls === 'fighter' && h.equip.hew) { w.name = 'Рассекатель (топор +1)'; w.magic = 1; }
    if (h.cls === 'wizard' && h.equip.staff) w.name = 'Посох защиты';
    if (h.cls === 'cleric' && h.equip.lightbringer) { w.name = 'Светоносная (булава +1)'; w.magic = 1; w.undeadBonus = [1, 6]; }
    if (h.cls === 'wizard' && h.equip.spiderStaff) { w.name = 'Посох паука'; w.magic = 1; w.plusPoison = [1, 6]; }
    if (h.equip.flameBless && !w.magic) { w.magic = 1; w.name += ' (зелёное пламя)'; }
    w.hit = G.prof() + G.mod(w.abil) + w.magic;
    w.dmgMod = G.mod(w.abil) + w.bonusDmg + w.magic;
    return w;
  };
  G.spellMod = () => G.mod(G.cls().caster);
  G.spellDC = () => 8 + G.prof() + G.spellMod();
  G.spellHit = () => G.prof() + G.spellMod();
  G.sneakDice = () => Math.ceil(G.S.hero.lvl / 2);
  G.critMin = () => (G.S.hero.cls === 'fighter' && G.S.hero.lvl >= 3 ? 19 : 20);
  G.knownSpells = () => (G.cls().spells || []).filter(id => G.SPELLS[id].lvl === 0 || G.SPELLS[id].lvl <= Math.ceil(G.S.hero.lvl / 2));

  G.restoreRes = kind => {
    const h = G.S.hero, r = h.res;
    r.wind = true; r.surge = h.lvl >= 2; r.channel = h.lvl >= 2;
    if (h.equip.staff) r.freeShield = 2;
    if (kind === 'long') { r.arcane = true; h.slots = G.slotMax().slice(); }
  };

  /* ---------- деньги, предметы, опыт, заметки ---------- */
  G.fmtMoney = cp => {
    const gp = Math.floor(cp / 100), sp = Math.floor((cp % 100) / 10), c = cp % 10;
    const parts = [];
    if (gp) parts.push(gp + ' зм');
    if (sp) parts.push(sp + ' см');
    if (c || !parts.length) parts.push(c + ' мм');
    return parts.join(' ');
  };
  G.note = (t, cls) => { G.S.notes.push([cls || 'gain', t]); };
  G.money = (cp, why) => {
    G.S.cp = Math.max(0, G.S.cp + cp);
    if (cp > 0) G.note('Получено: ' + G.fmtMoney(cp) + (why ? ' (' + why + ')' : ''));
    if (cp < 0) G.note('Потрачено: ' + G.fmtMoney(-cp), 'muted');
  };
  G.give = (id, n = 1, silent) => {
    G.S.inv[id] = (G.S.inv[id] || 0) + n;
    if (!silent) G.note('Получено: ' + G.ITEMS[id].name + (n > 1 ? ' ×' + n : ''));
  };
  G.take = (id, n = 1) => { G.S.inv[id] = Math.max(0, (G.S.inv[id] || 0) - n); if (!G.S.inv[id]) delete G.S.inv[id]; };
  G.has = id => (G.S.inv[id] || 0) > 0;
  G.xp = (n, why) => {
    const h = G.S.hero;
    h.xp += n;
    G.note('+' + n + ' опыта' + (why ? ': ' + why : ''), 'xp');
    while (h.lvl < 5 && h.xp >= G.XP_LEVELS[h.lvl]) G.levelUp();
  };
  G.levelUp = () => {
    const h = G.S.hero, before = G.maxHp(), slotsBefore = G.slotMax();
    h.lvl++;
    const gain = G.maxHp() - before;
    h.hp += gain; h.hd += 1;
    const sm = G.slotMax();
    for (let i = 0; i < 3; i++) h.slots[i] += Math.max(0, sm[i] - slotsBefore[i]);
    if (h.lvl === 2) { h.res.surge = true; h.res.channel = true; }
    G.S.levelUps.push({ lvl: h.lvl, hp: gain });
  };
  G.quest = (id, state) => {
    const was = G.S.quests[id];
    if (was === state) return;
    if (was === 'done' && state === 'active') return;
    G.S.quests[id] = state;
    const q = G.QUESTS[id];
    if (!q) return;
    if (state === 'active') G.note('Новое задание: ' + q.name, 'quest');
    if (state === 'done') G.note('Задание выполнено: ' + q.name, 'quest');
  };
  G.clue = t => { if (!G.S.clues.includes(t)) { G.S.clues.push(t); G.note('В журнал: ' + t, 'clue'); } };
  G.heal = n => { const h = G.S.hero, b = h.hp; h.hp = Math.min(G.maxHp(), h.hp + n); return h.hp - b; };
  G.hurt = n => { const h = G.S.hero; h.hp = Math.max(0, h.hp - n); return n; };
  G.compDef = () => {
    const S = G.S;
    if (!S.comp) return null;
    const d = G.COMPANIONS[S.comp];
    if (S.comp === 'sildar' && S.f.sildarGear) return Object.assign({}, d, { ac: 18, atk: Object.assign({}, d.atk, { hit: 6 }) });
    return d;
  };
  G.compHp = () => (G.S.comp ? (G.S.compHp[G.S.comp] ?? G.COMPANIONS[G.S.comp].hp) : 0);
  G.setComp = id => {
    const S = G.S;
    if (S.comp === id) return;
    S.comp = id;
    if (id && S.compHp[id] == null) S.compHp[id] = G.COMPANIONS[id].hp;
    if (id) G.note(G.COMPANIONS[id].name + ' идёт с вами.', 'quest');
  };
  G.healComp = n => { const S = G.S; if (!S.comp) return 0; const d = G.COMPANIONS[S.comp]; const b = G.compHp(); S.compHp[S.comp] = Math.min(d.hp, b + n); return S.compHp[S.comp] - b; };

  /* ---------- сохранение ---------- */
  G.save = () => { try { localStorage.setItem(SAVE, JSON.stringify(G.S)); } catch (e) {} };
  G.load = () => { try { const s = JSON.parse(localStorage.getItem(SAVE)); if (s && s.hero) return s; } catch (e) {} return null; };
  G.saveCP = () => { try { localStorage.setItem(CPKEY, JSON.stringify(G.S)); } catch (e) {} G.CP = G.clone(G.S); };
  G.loadCP = () => { if (G.CP) return G.clone(G.CP); try { const s = JSON.parse(localStorage.getItem(CPKEY)); if (s && s.hero) return s; } catch (e) {} return null; };
  G.wipeCP = () => { try { localStorage.removeItem(CPKEY); } catch (e) {} G.CP = null; };
  G.wipe = () => { try { localStorage.removeItem(SAVE); localStorage.removeItem(CPKEY); } catch (e) {} G.CP = null; };

  /* ---------- проверки ---------- */
  function checkMod(spec) {
    const parts = [];
    let m = 0;
    if (spec.skill) {
      const [nm, ab] = G.SKILLS[spec.skill];
      m = G.skillBonus(spec.skill);
      parts.push(nm + ' (' + G.ABIL_SHORT[ab] + ')');
    } else if (spec.tools) {
      m = G.toolsBonus(); parts.push('Воровские инструменты');
    } else if (spec.save) {
      m = G.saveBonus(spec.save); parts.push('Спасбросок ' + G.ABIL[spec.save]);
    } else if (spec.abil) {
      m = G.mod(spec.abil); parts.push(G.ABIL[spec.abil]);
    }
    return { m, label: spec.label || parts[0] };
  }
  G.checkTag = spec => {
    const { m, label } = checkMod(spec);
    const dc = G.val(spec.dc);
    const adv = G.val(spec.adv), dis = G.val(spec.dis);
    return label + ' · к20' + G.fmt(m) + (adv && !dis ? ' · преим.' : '') + (dis && !adv ? ' · помеха' : '') + ' · Сл ' + dc;
  };
  G.canAuto = spec => spec.passive && spec.skill && G.passive(spec.skill) >= G.val(spec.dc);

  /* Бросок с модальным окном. cb(ok, total) */
  G.check = (spec, cb) => {
    const S = G.S;
    const { m, label } = checkMod(spec);
    const dc = G.val(spec.dc);
    if (G.canAuto(spec)) {
      G.note('Пассивная ' + G.SKILLS[spec.skill][0] + ' ' + G.passive(spec.skill) + ' ≥ Сл ' + dc + ': замечено без броска.', 'muted');
      S.st.ok = (S.st.ok || 0) + 1;
      return cb(true, G.passive(spec.skill));
    }
    const adv = !!G.val(spec.adv) || (S.hero.equip.boots && ['athletics', 'acrobatics'].includes(spec.skill)), dis = !!G.val(spec.dis);
    const guidance = S.hero.cls === 'cleric' && !spec.save;
    const el = document.getElementById('dice');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.hidden = false;
    const run = (isReroll) => {
      let a = G.rnd(20), b = G.rnd(20), notes = [];
      if (S.hero.race === 'halfling') {
        if (a === 1) { a = G.rnd(20); notes.push('Везучий: единица переброшена'); }
        if (b === 1) b = G.rnd(20);
      }
      let d = a;
      if (adv && !dis) d = Math.max(a, b);
      if (dis && !adv) d = Math.min(a, b);
      const g = guidance ? G.rnd(4) : 0;
      const total = d + m + g;
      const ok = spec.save ? (d === 20 || (d !== 1 && total >= dc)) : total >= dc;
      S.st.rolls++; if (d === 20) S.st.crits++;
      el.innerHTML =
        '<div class="dice-card" role="dialog" aria-label="Бросок">' +
        '<div class="lbl">' + G.esc(label) + '</div>' +
        '<div class="d20 spin"><b>' + G.rnd(20) + '</b></div>' +
        '<div class="math">к20' + G.fmt(m) + (guidance ? ' +1к4' : '') + ' против Сл ' + dc + '</div>' +
        '<div class="vd"></div><div class="dice-notes"></div><div class="row col"></div></div>';
      const die = el.querySelector('.d20'), face = die.querySelector('b');
      let n = 0;
      const iv = setInterval(() => {
        face.textContent = G.rnd(20);
        if (++n >= (reduce ? 1 : 12)) { clearInterval(iv); finish(); }
      }, 55);
      function finish() {
        die.classList.remove('spin');
        face.textContent = d;
        if (d === 20) die.classList.add('nat20');
        if (d === 1) die.classList.add('nat1');
        let math = (adv !== dis ? '[' + a + ' и ' + b + '] ' : '') + d + ' ' + G.fmt(m) + (g ? ' +' + g + ' (Указание)' : '') + ' = ' + total + ' против Сл ' + dc;
        el.querySelector('.math').textContent = math;
        const vd = el.querySelector('.vd');
        vd.className = 'vd ' + (ok ? 'ok' : 'no');
        vd.textContent = ok ? 'Успех' : 'Провал';
        if (adv !== dis) notes.push(adv ? 'Преимущество: лучший из двух' : 'Помеха: худший из двух');
        el.querySelector('.dice-notes').textContent = notes.join(' · ');
        const box = el.querySelector('.row');
        const next = document.createElement('button');
        next.className = 'btn main'; next.textContent = 'Дальше';
        next.onclick = () => { el.hidden = true; el.innerHTML = ''; S.st[ok ? 'ok' : 'fail'] = (S.st[ok ? 'ok' : 'fail'] || 0) + 1; cb(ok, total); };
        box.appendChild(next);
        if (!ok && S.hero.insp && !isReroll) {
          const re = document.createElement('button');
          re.className = 'btn'; re.innerHTML = 'Потратить вдохновение: перебросить';
          re.onclick = () => { S.hero.insp = false; G.save(); run(true); };
          box.appendChild(re);
        }
        next.focus();
      }
    };
    run(false);
  };

  /* ---------- сцены ---------- */
  G.go = (id) => {
    const S = G.S;
    const sc = G.SC[id];
    if (!sc) { console.error('Нет сцены', id); G.note('Ошибка: сцена «' + id + '» не найдена.', 'bad'); G.render(); return; }
    S.prevScene = S.scene;
    S.scene = id;
    if (sc.chapter) S.chapter = sc.chapter;
    if (sc.loc) S.loc = G.val(sc.loc);
    if (sc.enter) sc.enter(S);
    if (S.scene !== id) return; // enter перенаправил
    G.save();
    G.render(true);
  };

  G.visibleChoices = sc => (G.val(sc.choices) || []).filter(c => (!c.if || c.if(G.S)) && !(c.once && G.S.f['once_' + c.once]));

  G.choose = c => {
    const S = G.S;
    S.notes = [];
    S.tmp = null;
    if (c.once) S.f['once_' + c.once] = true;
    if (c.check) {
      return G.check(c.check, ok => {
        const k = c.check;
        const f = ok ? k.onOk : k.onFail;
        if (f) f(S);
        const tgt = G.val(ok ? k.ok : k.fail);
        if (tgt) G.go(tgt); else G.render();
      });
    }
    if (c.do) c.do(S);
    if (c.fight) return G.startFight(G.val(c.fight));
    if (c.shop) { G.UI.sheet = 'shop'; G.UI.shop = c.shop; return G.render(); }
    const tgt = G.val(c.go);
    if (tgt) G.go(tgt); else { G.save(); G.render(); }
  };

  /* ---------- отдых ---------- */
  G.canRest = () => {
    const sc = G.SC[G.S.scene];
    return !G.S.combat && sc && G.val(sc.rest);
  };
  G.spendHD = () => {
    const h = G.S.hero;
    if (h.hd < 1 || h.hp >= G.maxHp()) return 0;
    h.hd--;
    const r = Math.max(1, G.rnd(G.cls().hd) + G.mod('con'));
    return G.heal(r);
  };
  G.finishShortRest = () => {
    const S = G.S, h = S.hero;
    G.restoreRes('short');
    const msgs = ['Короткий отдых окончен.'];
    if (h.cls === 'wizard' && h.res.arcane) {
      let budget = Math.ceil(h.lvl / 2), got = [];
      const mx = G.slotMax();
      for (let lv = 3; lv >= 1; lv--) {
        while (budget >= lv && h.slots[lv - 1] < mx[lv - 1]) { h.slots[lv - 1]++; budget -= lv; got.push(lv); }
      }
      if (got.length) { h.res.arcane = false; msgs.push('Магическое восстановление: ячейки ' + got.join(', ') + ' уровня.'); }
    }
    if (S.comp) { const d = G.COMPANIONS[S.comp]; S.compHp[S.comp] = Math.max(G.compHp(), Math.ceil(d.hp / 2)); }
    S.notes = []; msgs.forEach(m => G.note(m, 'muted'));
    G.UI.sheet = null;
    G.save(); G.render();
  };
  G.longRest = (why) => {
    const S = G.S, h = S.hero;
    h.hp = G.maxHp();
    h.hd = Math.min(h.lvl, h.hd + Math.max(1, Math.floor(h.lvl / 2)));
    h.mageArmor = false;
    G.restoreRes('long');
    G.morningArmor();
    if (S.f.wandCharges != null) S.f.wandCharges = Math.min(7, S.f.wandCharges + G.rnd(6) + 1);
    for (const id in S.compHp) S.compHp[id] = G.COMPANIONS[id].hp;
    G.note('Длительный отдых' + (why ? ' (' + why + ')' : '') + ': здоровье, ячейки и умения восстановлены.', 'muted');
  };

  /* Волшебник каждое утро накладывает Доспехи мага: посохом бесплатно, иначе ячейкой 1-го уровня */
  G.morningArmor = () => {
    const h = G.S.hero;
    if (h.cls !== 'wizard' || h.mageArmor) return;
    if (h.equip.staff) { h.mageArmor = true; return; }
    if (h.slots[0] > 0) { h.slots[0]--; h.mageArmor = true; G.note('Утром вы наложили Доспехи мага (КД ' + G.ac() + ', потрачена ячейка 1-го уровня).', 'muted'); }
  };

  /* ---------- использование предметов вне боя ---------- */
  G.useItemOutside = (id, who) => {
    const S = G.S, it = G.ITEMS[id];
    if (it.use === 'heal') {
      const amt = G.roll(it.dice[0], it.dice[1]) + it.plus;
      G.take(id);
      if (who === 'comp') { const got = G.healComp(amt); G.note(G.compDef().short + ' пьёт зелье: +' + got + ' хитов.', 'muted'); }
      else { const got = G.heal(amt); G.note('Вы пьёте зелье: +' + got + ' хитов.', 'muted'); }
    }
    if (it.use === 'vitality') {
      G.take(id); S.hero.hp = G.maxHp(); S.hero.hd = S.hero.lvl;
      G.note('Зелье жизненной силы: вы полностью здоровы, кости хитов восстановлены.', 'muted');
    }
    if (it.use === 'equip') {
      const h = S.hero;
      if (id === 'talon') { h.equip.talon = !h.equip.talon; if (h.equip.talon) h.equip.hew = false; }
      if (id === 'hew') { h.equip.hew = !h.equip.hew; if (h.equip.hew) h.equip.talon = false; }
      if (id === 'ring_protection') h.equip.ring = !h.equip.ring;
      if (id === 'boots') h.equip.boots = !h.equip.boots;
      if (id === 'gauntlets') h.equip.gauntlets = !h.equip.gauntlets;
      if (id === 'lightbringer') h.equip.lightbringer = !h.equip.lightbringer;
      if (id === 'dragonguard') h.equip.dragonguard = !h.equip.dragonguard;
      if (id === 'spider_staff') h.equip.spiderStaff = !h.equip.spiderStaff;
      if (id === 'staff_defense') { h.equip.staff = !h.equip.staff; if (h.equip.staff) { h.mageArmor = true; h.res.freeShield = 2; } }
      if (id === 'studded') h.equip.armor = h.equip.armor === 'studded' ? null : 'studded';
      if (id === 'splint') h.equip.armor = h.equip.armor === 'splint' ? null : 'splint';
    }
    G.save(); G.render();
  };
  G.isEquipped = id => {
    const e = G.S.hero.equip;
    return (id === 'boots' && e.boots) || (id === 'gauntlets' && e.gauntlets) || (id === 'lightbringer' && e.lightbringer) || (id === 'dragonguard' && e.dragonguard) || (id === 'spider_staff' && e.spiderStaff) || (id === 'talon' && e.talon) || (id === 'hew' && e.hew) || (id === 'ring_protection' && e.ring) || (id === 'staff_defense' && e.staff) || (id === 'studded' && e.armor === 'studded') || (id === 'splint' && e.armor === 'splint');
  };
  G.castOutside = id => {
    const S = G.S, h = S.hero, sp = G.SPELLS[id];
    if (sp.lvl && h.slots[sp.lvl - 1] < 1) return;
    if (id === 'mage_armor') { if (!h.equip.staff) h.slots[0]--; h.mageArmor = true; G.note('Доспехи мага: КД ' + G.ac() + ' до длительного отдыха.', 'muted'); }
    if (id === 'cure_wounds' || id === 'healing_word' || id === 'mass_healing_word') {
      h.slots[sp.lvl - 1]--;
      const base = G.roll(sp.dice[0], sp.dice[1]) + G.spellMod() + 2 + sp.lvl;
      const got = G.heal(base);
      let msg = sp.name + ': +' + got + ' хитов';
      if (S.comp && (sp.both || G.UI.healComp)) { const c = G.healComp(base); msg += ', ' + G.compDef().short + ' +' + c; }
      G.note(msg + '.', 'muted');
    }
    G.save(); G.render();
  };
})();
