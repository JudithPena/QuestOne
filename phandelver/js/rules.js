/* Правила: характеристики, навыки, расы, классы, заклинания, предметы, чудовища. */
window.G = window.G || {};
(() => {
  const G = window.G;

  G.ABIL = { str: 'Сила', dex: 'Ловкость', con: 'Телосложение', int: 'Интеллект', wis: 'Мудрость', cha: 'Харизма' };
  G.ABIL_SHORT = { str: 'СИЛ', dex: 'ЛОВ', con: 'ТЕЛ', int: 'ИНТ', wis: 'МДР', cha: 'ХАР' };

  G.SKILLS = {
    athletics: ['Атлетика', 'str'],
    acrobatics: ['Акробатика', 'dex'],
    stealth: ['Скрытность', 'dex'],
    sleight: ['Ловкость рук', 'dex'],
    arcana: ['Магия', 'int'],
    history: ['История', 'int'],
    investigation: ['Анализ', 'int'],
    nature: ['Природа', 'int'],
    religion: ['Религия', 'int'],
    animal: ['Уход за животными', 'wis'],
    insight: ['Проницательность', 'wis'],
    medicine: ['Медицина', 'wis'],
    perception: ['Внимательность', 'wis'],
    survival: ['Выживание', 'wis'],
    deception: ['Обман', 'cha'],
    intimidation: ['Запугивание', 'cha'],
    persuasion: ['Убеждение', 'cha'],
    performance: ['Выступление', 'cha']
  };

  G.XP_LEVELS = [0, 300, 900, 2700, 6500];

  G.RACES = {
    human: {
      name: 'Человек', abil: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
      perks: ['+1 ко всем характеристикам'],
      text: 'Упорные и разносторонние. Хороши в любом деле.'
    },
    dwarf: {
      name: 'Дварф', abil: { con: 2, wis: 1 },
      perks: ['+1 хит за каждый уровень', 'Сопротивление яду', 'Тёмное зрение'],
      text: 'Холмовой дварф: крепкий, как скала, и упрямый, как мул.'
    },
    elf: {
      name: 'Эльф', abil: { dex: 2, int: 1 }, skills: ['perception'],
      perks: ['Владение Внимательностью', 'Магия не может усыпить', 'Преимущество против очарования', 'Тёмное зрение'],
      text: 'Высший эльф: зоркий, ловкий, живёт веками.'
    },
    halfling: {
      name: 'Полурослик', abil: { dex: 2, cha: 1 },
      perks: ['Везучий: единицу на к20 можно перебросить', 'Храбрый: преимущество против испуга'],
      text: 'Легконогий полурослик. Маленький, но удача на его стороне.'
    }
  };

  /* Слоты заклинаний полных заклинателей по уровню персонажа: [1-й, 2-й, 3-й] */
  G.SLOTS = { 1: [2, 0, 0], 2: [3, 0, 0], 3: [4, 2, 0], 4: [4, 3, 0], 5: [4, 3, 2] };

  G.CLASSES = {
    fighter: {
      name: 'Воин', hd: 10, primary: 'str',
      base: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
      saves: ['str', 'con'],
      skills: ['athletics', 'perception', 'intimidation', 'survival'],
      armor: { base: 16, dexCap: 0, name: 'Кольчуга' }, shield: true,
      weapon: { name: 'Длинный меч', dice: [1, 8], abil: 'str', type: 'slashing', bonusDmg: 2 },
      text: 'Мастер оружия в тяжёлой броне. Крепче всех держит удар.',
      features: {
        1: ['Боевой стиль «Дуэлянт»: +2 к урону', 'Второе дыхание: бонусным действием лечит 1к10 + уровень (раз за короткий отдых)'],
        2: ['Всплеск действий: одно дополнительное действие (раз за короткий отдых)'],
        3: ['Чемпион: критическое попадание на 19–20'],
        4: ['Увеличение характеристики: Сила +2'],
        5: ['Дополнительная атака: две атаки за действие']
      }
    },
    rogue: {
      name: 'Плут', hd: 8, primary: 'dex',
      base: { str: 8, dex: 15, con: 14, int: 12, wis: 13, cha: 10 },
      saves: ['dex', 'int'],
      skills: ['stealth', 'acrobatics', 'perception', 'sleight', 'deception', 'insight', 'investigation'],
      expertise: ['stealth', 'sleight'],
      armor: { base: 12, dexCap: 99, name: 'Проклёпанная кожа' }, shield: false,
      weapon: { name: 'Рапира', dice: [1, 8], abil: 'dex', type: 'piercing', bonusDmg: 0 },
      tools: true,
      text: 'Ловкач со скрытой атакой, воровскими инструментами и хорошо подвешенным языком.',
      features: {
        1: ['Скрытая атака: +1к6 урона раз в ход, если есть преимущество или рядом союзник', 'Верный прицел: бонусным действием получить преимущество на атаку', 'Компетентность: Скрытность и воровские инструменты ×2'],
        2: ['Хитрое действие: бонусным действием скрыться (враги бьют с помехой)'],
        3: ['Убийца: преимущество против тех, кто ещё не ходил; по застигнутым врасплох — критическое попадание', 'Скрытая атака: 2к6'],
        4: ['Увеличение характеристики: Ловкость +2'],
        5: ['Невероятное уклонение: первый удар за раунд наносит половину урона', 'Скрытая атака: 3к6']
      }
    },
    cleric: {
      name: 'Жрец', hd: 8, primary: 'wis', caster: 'wis',
      base: { str: 14, dex: 10, con: 13, int: 8, wis: 15, cha: 12 },
      saves: ['wis', 'cha'],
      skills: ['insight', 'medicine', 'religion', 'persuasion', 'history'],
      armor: { base: 16, dexCap: 0, name: 'Кольчуга' }, shield: true,
      weapon: { name: 'Булава', dice: [1, 6], abil: 'str', type: 'bludgeoning', bonusDmg: 0 },
      text: 'Жрец Домена Жизни: лечит, благословляет и изгоняет нежить. Носит тяжёлую броню.',
      spells: ['sacred_flame', 'cure_wounds', 'healing_word', 'guiding_bolt', 'bless', 'shield_of_faith', 'spiritual_weapon', 'hold_person_c', 'spirit_guardians', 'mass_healing_word'],
      features: {
        1: ['Заклинания Мудрости', 'Указание: +1к4 к проверкам характеристик', 'Ученик Жизни: лечащие заклинания +2 + уровень заклинания', 'Божественный удар: раз в ход атака оружием наносит ещё 1к8 излучением'],
        2: ['Божественный канал: Изгнание нежити или Сохранение жизни (раз за короткий отдых)'],
        3: ['Заклинания 2-го уровня'],
        4: ['Увеличение характеристики: Мудрость +2'],
        5: ['Заклинания 3-го уровня', 'Уничтожение нежити: слабая нежить сгорает при изгнании']
      }
    },
    wizard: {
      name: 'Волшебник', hd: 6, primary: 'int', caster: 'int',
      base: { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 },
      saves: ['int', 'wis'],
      skills: ['arcana', 'history', 'investigation', 'insight'],
      armor: null, shield: false,
      weapon: { name: 'Боевой посох', dice: [1, 6], abil: 'str', type: 'bludgeoning', bonusDmg: 0 },
      text: 'Школа Воплощения: огонь, молнии и сон. Хрупкий, но самый разрушительный.',
      spells: ['fire_bolt', 'acid_splash', 'magic_missile', 'sleep', 'burning_hands', 'mage_armor', 'shield_spell', 'scorching_ray', 'hold_person_w', 'fireball'],
      features: {
        1: ['Заклинания Интеллекта', 'Магическое восстановление: на коротком отдыхе вернуть ячейки (раз в день)'],
        2: ['Школа Воплощения: напарник не страдает от ваших огненных заклинаний'],
        3: ['Заклинания 2-го уровня'],
        4: ['Увеличение характеристики: Интеллект +2'],
        5: ['Заклинания 3-го уровня: Огненный шар', 'Заговоры сильнее: 2 кости урона']
      }
    }
  };

  /* Заклинания.
     kind: attack (бросок атаки заклинанием), save (спасбросок цели), auto (без броска),
           heal, buff, special. lvl 0 — заговор. */
  G.SPELLS = {
    fire_bolt: { name: 'Огненный снаряд', lvl: 0, cost: 'action', kind: 'attack', dice: [1, 10], type: 'fire', scale: true, text: 'Атака заклинанием, 1к10 огнём.' },
    acid_splash: { name: 'Брызги кислоты', lvl: 0, cost: 'action', kind: 'save', save: 'dex', dice: [1, 6], type: 'acid', targets: 2, scale: true, text: 'До двух врагов, спасбросок Ловкости, 1к6 кислотой.' },
    sacred_flame: { name: 'Священное пламя', lvl: 0, cost: 'action', kind: 'save', save: 'dex', dice: [1, 8], type: 'radiant', scale: true, text: 'Спасбросок Ловкости, 1к8 излучением.' },
    magic_missile: { name: 'Волшебная стрела', lvl: 1, cost: 'action', kind: 'auto', darts: 3, dice: [1, 4], plus: 1, type: 'force', text: 'Три дротика по 1к4+1, всегда попадают.' },
    sleep: { name: 'Усыпление', lvl: 1, cost: 'action', kind: 'special', text: 'Усыпляет врагов с общим запасом 5к8 хитов, начиная со слабейших.' },
    burning_hands: { name: 'Огненные ладони', lvl: 1, cost: 'action', kind: 'save', save: 'dex', dice: [3, 6], type: 'fire', targets: 3, half: true, text: 'До трёх врагов, спасбросок Ловкости, 3к6 огнём (половина при успехе).' },
    mage_armor: { name: 'Доспехи мага', lvl: 1, cost: 'action', kind: 'special', noCombat: false, text: 'КД 13 + Ловкость до длительного отдыха.' },
    shield_spell: { name: 'Щит', lvl: 1, cost: 'reaction', kind: 'special', text: 'Реакция: +5 к КД до вашего хода, когда по вам попадают. Включите, чтобы использовать автоматически.' },
    lightning_bolt: { name: 'Молния', lvl: 3, cost: 'action', kind: 'save', save: 'dex', dice: [8, 6], type: 'lightning', targets: 2, half: true, text: 'Линия: до двух врагов, спасбросок Ловкости, 8к6 электричеством.' },
    scorching_ray: { name: 'Палящий луч', lvl: 2, cost: 'action', kind: 'rays', rays: 3, dice: [2, 6], type: 'fire', text: 'Три луча, каждый — атака заклинанием на 2к6 огнём.' },
    hold_person_w: { name: 'Удержание личности', lvl: 2, cost: 'action', kind: 'hold', save: 'wis', text: 'Гуманоид парализован (спасбросок Мудрости в конце каждого его хода). Концентрация.' },
    fireball: { name: 'Огненный шар', lvl: 3, cost: 'action', kind: 'save', save: 'dex', dice: [8, 6], type: 'fire', targets: 99, half: true, text: 'Все враги, спасбросок Ловкости, 8к6 огнём (половина при успехе).' },

    cure_wounds: { name: 'Лечение ран', lvl: 1, cost: 'action', kind: 'heal', dice: [1, 8], text: 'Лечит 1к8 + Мудрость + 3 себе или напарнику.' },
    healing_word: { name: 'Лечащее слово', lvl: 1, cost: 'bonus', kind: 'heal', dice: [1, 4], text: 'Бонусным действием лечит 1к4 + Мудрость + 3.' },
    guiding_bolt: { name: 'Направленный снаряд', lvl: 1, cost: 'action', kind: 'attack', dice: [4, 6], type: 'radiant', mark: true, text: 'Атака заклинанием, 4к6 излучением. Следующая атака по цели с преимуществом.' },
    bless: { name: 'Благословение', lvl: 1, cost: 'action', kind: 'buff', conc: true, text: 'Вы и напарник: +1к4 к атакам и спасброскам. Концентрация.' },
    shield_of_faith: { name: 'Щит веры', lvl: 1, cost: 'bonus', kind: 'buff', conc: true, text: '+2 к КД. Концентрация.' },
    spiritual_weapon: { name: 'Духовное оружие', lvl: 2, cost: 'bonus', kind: 'special', text: 'Призрачное оружие бьёт бонусным действием каждый ход: 1к8 + Мудрость силовым полем.' },
    hold_person_c: { name: 'Удержание личности', lvl: 2, cost: 'action', kind: 'hold', save: 'wis', text: 'Гуманоид парализован (спасбросок Мудрости в конце каждого его хода). Концентрация.' },
    spirit_guardians: { name: 'Духовные стражи', lvl: 3, cost: 'action', kind: 'buff', conc: true, text: 'Каждый раунд все враги: спасбросок Мудрости или 3к8 излучением (половина при успехе). Концентрация.' },
    mass_healing_word: { name: 'Множественное лечащее слово', lvl: 3, cost: 'bonus', kind: 'heal', dice: [1, 4], both: true, text: 'Бонусным действием лечит вас и напарника на 1к4 + Мудрость + 5.' }
  };

  /* Предметы. use: 'heal' | 'invis' | 'scroll' ... value в зм. */
  G.ITEMS = {
    potion_heal: { name: 'Зелье лечения', use: 'heal', dice: [2, 4], plus: 2, text: 'Восстанавливает 2к4+2 хитов. В бою тратит действие.' },
    potion_invis: { name: 'Зелье невидимости', use: 'invis', text: 'В бою: враги бьют с помехой, ваша следующая атака с преимуществом.' },
    scroll_fireball: { name: 'Свиток огненного шара', use: 'scroll', spell: 'fireball', who: ['wizard'], text: 'Волшебник может прочитать его в бою: 8к6 огнём по всем врагам.' },
    scroll_charm: { name: 'Свиток очарования личности', use: 'story', who: ['wizard'], text: 'Пригодится в разговоре с тем, кого нужно уговорить.' },
    scroll_divination: { name: 'Свиток гадания', use: 'story', who: ['wizard', 'cleric'], text: 'Позволяет задать богам один вопрос.' },
    staff_defense: { name: 'Посох защиты', use: 'equip', who: ['wizard'], text: 'Стеклянный посох Ярно. Волшебнику: Доспехи мага без ячейки и 2 бесплатных Щита за отдых.' },
    talon: { name: 'Коготь, длинный меч +1', use: 'equip', who: ['fighter'], text: 'Меч сэра Алдита Тресендара. +1 к атаке и урону.' },
    rope: { name: 'Пеньковая верёвка, 50 футов', use: 'story', text: 'Помогает при лазании.' },
    red_cloak: { name: 'Алый плащ Красноклеймённых', use: 'story', text: 'Можно выдать себя за одного из них.' },
    studded: { name: 'Проклёпанная кожа', use: 'equip', who: ['rogue'], text: 'КД 12 + Ловкость.' },
    splint: { name: 'Наборный доспех', use: 'equip', who: ['fighter', 'cleric'], text: 'КД 17.' },
    garaele_comb: { name: 'Серебряный гребень с камнями', use: 'story', text: 'Дар для баньши Агаты от сестры Гараэль.' },
    urmon_diary: { name: 'Дневник Урмона', use: 'story', text: 'Дварфская книга о Пакте Фанделвера и булаве Светоносной.' },
    spider_letter: { name: 'Письмо Чёрного Паука', use: 'story', text: 'Приказ Ярно: схватить чужаков и отправить дварфские карты.' },
    lionshield_goods: { name: 'Товары Львиного Щита', use: 'story', text: 'Ящики с синим львом из пещеры Кларга.' },
    ring_protection: { name: 'Кольцо защиты', use: 'equip', who: ['fighter', 'rogue', 'cleric', 'wizard'], text: 'Нетерильское кольцо: +1 к КД и спасброскам.' },
    hew: { name: 'Рассекатель, боевой топор +1', use: 'equip', who: ['fighter'], text: 'Дварфский топор под ржавчиной. +1 к атаке и урону, максимальный урон растениям.' },
    scroll_lightning: { name: 'Свиток молнии', use: 'scroll', spell: 'lightning_bolt', who: ['wizard'], text: 'Волшебник может прочитать его в бою: 8к6 электричеством по двум врагам на линии.' },
    scroll_misty: { name: 'Свиток туманного шага', use: 'story', who: ['wizard'], text: 'Мгновенный прыжок на 30 футов. Поможет сбежать.' },
    scroll_revivify: { name: 'Свиток возрождения', use: 'revive', who: ['cleric'], text: 'Жрец может вернуть к жизни павшего напарника прямо в бою.' },
    scroll_silence: { name: 'Свиток тишины', use: 'story', who: ['cleric'], text: 'Сфера полной тишины.' },
    scroll_darkness: { name: 'Свиток тьмы', use: 'story', who: ['wizard'], text: 'Непроглядная магическая тьма.' },
    potion_flying: { name: 'Зелье полёта', use: 'story', text: 'На час дарует полёт.' },
    garaele_potions: { name: 'Зелья Гараэль', use: 'story', text: '' },
    gundren_map: { name: 'Карта Гандрена', use: 'story', text: 'Карта, ведущая к Пещере Морского Эха.' },
    elf_statuette: { name: 'Золотая статуэтка солнечного эльфа', use: 'oracle', text: 'Магия прорицания: один раз ответит на любой вопрос.' },
    brandy: { name: 'Дварфский бренди', use: 'brandy', text: 'Стакан восстанавливает 1 хит. Два за час — и вы пьяны.' },
    emerald_necklace: { name: 'Изумрудное ожерелье Мирны', use: 'story', text: 'Золотое ожерелье с изящным изумрудным кулоном. Стоит 200 зм.' },
    boots: { name: 'Сапоги ходьбы и прыжков', use: 'equip', who: ['fighter', 'rogue', 'cleric', 'wizard'], text: 'Сапоги Тардена. Преимущество на проверки Атлетики и Акробатики.' },
    gauntlets: { name: 'Рукавицы силы огра', use: 'equip', who: ['fighter', 'rogue', 'cleric', 'wizard'], text: 'Сила становится 19.' },
    wand_mm: { name: 'Палочка волшебных стрел', use: 'wand', text: 'В бою действием: три дротика по 1к4+1, всегда попадают. 7 зарядов.' },
    potion_vitality: { name: 'Зелье жизненной силы', use: 'vitality', text: 'Полностью лечит и возвращает все кости хитов.' },
    lightbringer: { name: 'Светоносная, булава +1', use: 'equip', who: ['cleric'], text: 'Булава жрецов Латандера. +1 к атаке и урону, +1к6 излучением по нежити. Светится, как факел.' },
    dragonguard: { name: 'Драконий Страж, нагрудник +1', use: 'equip', who: ['fighter', 'cleric'], text: 'Нагрудник с золотым драконом. КД 15 + Ловкость (макс. 2), преимущество против дыхания драконов.' },
    spider_staff: { name: 'Посох паука', use: 'equip', who: ['wizard'], text: 'Чёрный посох Неззнара. Удар: 1к6 + 1к6 ядом, магическое оружие.' },
    mormesk_map: { name: 'Старая карта из книги Мормеска', use: 'story', text: 'Карта, пришитая к обложке старой книги. Ведёт к неведомому подземелью — следующему приключению.' },
    goblin_note: { name: 'Рисунок с награде', use: 'story', text: '«25 золотых за этого» — и ваш портрет. Внизу знак чёрного паука.' }
  };

  /* Чудовища. atk: [{n: название, hit, dice:[n,s], mod, type, extra?}] ; multi: число атак. */
  G.MONSTERS = {
    goblin: {
      name: 'Гоблин', ac: 15, hp: 7, dex: 2, init: 2, wis: 0, humanoid: true, pp: 9,
      atk: [{ n: 'скимитар', hit: 4, dice: [1, 6], mod: 2, type: 'slashing' }, { n: 'короткий лук', hit: 4, dice: [1, 6], mod: 2, type: 'piercing' }]
    },
    goblin_boss: {
      name: 'Йемик', ac: 15, hp: 12, dex: 2, init: 2, wis: 0, humanoid: true, pp: 9,
      atk: [{ n: 'скимитар', hit: 4, dice: [1, 6], mod: 2, type: 'slashing' }]
    },
    wolf: {
      name: 'Волк', ac: 13, hp: 11, dex: 2, init: 2, wis: 1, beast: true, pp: 13,
      atk: [{ n: 'укус', hit: 4, dice: [2, 4], mod: 2, type: 'piercing', prone: 11 }]
    },
    bugbear: {
      name: 'Медвежатник', ac: 16, hp: 27, dex: 2, init: 2, wis: 0, humanoid: true, pp: 10,
      surprise: [2, 6],
      atk: [{ n: 'моргенштерн', hit: 4, dice: [2, 8], mod: 2, type: 'piercing' }]
    },
    ruffian: {
      name: 'Красноклеймённый', ac: 14, hp: 16, dex: 2, init: 2, wis: 0, humanoid: true, pp: 10, multi: 2,
      atk: [{ n: 'короткий меч', hit: 4, dice: [1, 6], mod: 2, type: 'piercing' }]
    },
    skeleton: {
      name: 'Скелет', ac: 13, hp: 13, dex: 2, init: 2, wis: -1, undead: true, pp: 9,
      vuln: ['bludgeoning'], immune: ['poison'],
      atk: [{ n: 'короткий меч', hit: 4, dice: [1, 6], mod: 2, type: 'piercing' }]
    },
    nothic: {
      name: 'Нотик', ac: 15, hp: 32, dex: 3, init: 3, wis: 0, pp: 12, multi: 2,
      atk: [{ n: 'когти', hit: 4, dice: [1, 6], mod: 3, type: 'slashing' }],
      special: [{ w: 30, n: 'Гниющий взгляд', save: 'con', dc: 12, dice: [3, 6], type: 'necrotic', half: false }]
    },
    iarno: {
      name: 'Ярно «Стеклянный Посох»', ac: 15, hp: 22, dex: 1, init: 1, wis: 1, humanoid: true, pp: 11,
      surrenderAt: 8, shieldUses: 2,
      atk: [{ n: 'шоковое касание', hit: 4, dice: [1, 8], mod: 0, type: 'lightning' }],
      special: [
        { w: 35, n: 'Волшебная стрела', auto: true, darts: 3, dice: [1, 4], mod: 1, type: 'force', uses: 3 },
        { w: 25, n: 'Удержание личности', hold: true, save: 'wis', dc: 12, uses: 1 }
      ]
    },
    stirge: {
      name: 'Кровопийца', ac: 14, hp: 2, dex: 3, init: 3, wis: -1, beast: true, pp: 9,
      atk: [{ n: 'хоботок', hit: 5, dice: [1, 4], mod: 3, type: 'piercing' }]
    },
    ghoul: {
      name: 'Упырь', ac: 12, hp: 22, dex: 2, init: 2, wis: 0, undead: true, pp: 10, immune: ['poison'],
      atk: [{ n: 'когти', hit: 4, dice: [2, 4], mod: 2, type: 'slashing', paralyze: 10 }]
    },
    ogre: {
      name: 'Огр', ac: 11, hp: 59, dex: -1, init: -1, wis: -2, pp: 8,
      atk: [{ n: 'палица', hit: 6, dice: [2, 8], mod: 4, type: 'bludgeoning' }]
    },
    hobgoblin: {
      name: 'Хобгоблин', ac: 18, hp: 11, dex: 1, init: 1, wis: 0, humanoid: true, pp: 10, martial: [2, 6],
      atk: [{ n: 'длинный меч', hit: 3, dice: [1, 8], mod: 1, type: 'slashing' }]
    },
    orc: {
      name: 'Орк', ac: 13, hp: 15, dex: 1, init: 1, wis: 0, humanoid: true, pp: 10,
      atk: [{ n: 'секира', hit: 5, dice: [1, 12], mod: 3, type: 'slashing' }]
    },
    owlbear: {
      name: 'Совомед', ac: 13, hp: 59, dex: 1, init: 1, wis: 1, beast: true, pp: 13, multi: 2, atkCycle: true,
      atk: [{ n: 'клюв', hit: 7, dice: [1, 10], mod: 5, type: 'piercing' }, { n: 'когти', hit: 7, dice: [2, 8], mod: 5, type: 'slashing' }]
    },
    zombie: {
      name: 'Пепельный зомби', ac: 8, hp: 22, dex: -2, init: -2, wis: -2, undead: true, pp: 8, fortitude: 3, ash: true, immune: ['poison'],
      atk: [{ n: 'удар', hit: 3, dice: [1, 6], mod: 1, type: 'bludgeoning' }]
    },
    zombie_plain: {
      name: 'Зомби', ac: 8, hp: 22, dex: -2, init: -2, wis: -2, undead: true, pp: 8, fortitude: 3, immune: ['poison'],
      atk: [{ n: 'удар', hit: 3, dice: [1, 6], mod: 1, type: 'bludgeoning' }]
    },
    blight: {
      name: 'Ветвистая зараза', ac: 13, hp: 4, dex: 1, init: 1, wis: -1, plant: true, pp: 9, vuln: ['fire'],
      atk: [{ n: 'когти', hit: 3, dice: [1, 4], mod: 1, type: 'piercing' }]
    },
    spider: {
      name: 'Гигантский паук', ac: 14, hp: 26, dex: 3, init: 3, wis: 0, beast: true, pp: 10,
      atk: [{ n: 'укус', hit: 5, dice: [1, 8], mod: 3, type: 'piercing', poison: [2, 8, 11] }],
      special: [{ w: 25, n: 'Паутина', web: true, uses: 1 }]
    },
    dragon: {
      name: 'Веномфанг', ac: 18, hp: 136, dex: 1, init: 1, wis: 1, pp: 17, multi: 2, atkCycle: true, immune: ['poison'],
      atk: [{ n: 'укус', hit: 7, dice: [2, 10], mod: 4, type: 'piercing' }, { n: 'когти', hit: 7, dice: [2, 6], mod: 4, type: 'slashing' }],
      special: [{ w: 30, n: 'Ядовитое дыхание', save: 'con', dc: 14, dice: [8, 6], type: 'poison', half: true, uses: 1, all: true }]
    },
    cultist: {
      name: 'Культист', ac: 12, hp: 9, dex: 1, init: 1, wis: 0, humanoid: true, pp: 10,
      atk: [{ n: 'скимитар', hit: 3, dice: [1, 6], mod: 1, type: 'slashing' }]
    },
    kost: {
      name: 'Хаман Кост', ac: 12, hp: 22, dex: 1, init: 1, wis: 1, humanoid: true, pp: 11,
      atk: [{ n: 'шоковое касание', hit: 4, dice: [1, 8], mod: 0, type: 'lightning' }],
      special: [
        { w: 35, n: 'Луч болезни', save: 'con', dc: 12, dice: [2, 8], type: 'poison', half: false, uses: 3 },
        { w: 25, n: 'Удержание личности', hold: true, save: 'wis', dc: 12, uses: 1 }
      ]
    },
    grick: {
      name: 'Грик', ac: 14, hp: 27, dex: 2, init: 2, wis: 0, pp: 12, multi: 2, atkCycle: true, resistMundane: true,
      atk: [{ n: 'щупальца', hit: 4, dice: [2, 6], mod: 2, type: 'slashing' }, { n: 'клюв', hit: 4, dice: [1, 6], mod: 2, type: 'piercing' }]
    },
    doppelganger: {
      name: 'Вайерит', ac: 14, hp: 52, dex: 4, init: 4, wis: 1, pp: 11, multi: 2, surprise: [3, 6],
      atk: [{ n: 'удар', hit: 6, dice: [1, 6], mod: 4, type: 'bludgeoning' }]
    },
    jelly: {
      name: 'Золотистый студень', ac: 8, hp: 45, dex: -2, init: -2, wis: -2, pp: 8, immune: ['lightning'],
      atk: [{ n: 'ложноножка', hit: 4, dice: [2, 6], mod: 2, type: 'bludgeoning', plus: [1, 6, 'acid'] }]
    },
    flameskull: {
      name: 'Пылающий череп', ac: 13, hp: 40, dex: 3, init: 3, wis: 0, undead: true, pp: 12, immune: ['fire', 'cold', 'poison'], multi: 2,
      atk: [{ n: 'огненный луч', hit: 5, dice: [3, 6], mod: 0, type: 'fire' }],
      special: [{ w: 35, n: 'Огненный шар', save: 'dex', dc: 13, dice: [6, 6], type: 'fire', half: true, uses: 1, all: true }]
    },
    wraith: {
      name: 'Призрак Мормеска', ac: 13, hp: 67, dex: 3, init: 3, wis: 1, undead: true, pp: 12, resistMundane: true, immune: ['necrotic', 'poison'], resist: ['cold', 'fire', 'lightning', 'acid'],
      atk: [{ n: 'вытягивание жизни', hit: 6, dice: [4, 8], mod: 3, type: 'necrotic' }]
    },
    spectator: {
      name: 'Наблюдатель', ac: 14, hp: 39, dex: 2, init: 2, wis: 2, pp: 16, multi: 1,
      atk: [{ n: 'укус', hit: 1, dice: [1, 6], mod: -1, type: 'piercing' }],
      special: [
        { w: 40, n: 'Ранящий луч', save: 'con', dc: 13, dice: [3, 10], type: 'necrotic', half: true },
        { w: 30, n: 'Парализующий луч', hold: true, save: 'con', dc: 13, uses: 2 }
      ]
    },
    nezznar: {
      name: 'Неззнар, Чёрный Паук', ac: 14, hp: 27, dex: 2, init: 2, wis: 1, humanoid: true, pp: 12, surrenderAt: 7,
      atk: [{ n: 'посох паука', hit: 3, dice: [1, 6], mod: 0, type: 'bludgeoning', plus: [1, 6, 'poison'] }],
      special: [
        { w: 35, n: 'Волшебная стрела', auto: true, darts: 3, dice: [1, 4], mod: 1, type: 'force', uses: 3 },
        { w: 25, n: 'Луч болезни', save: 'con', dc: 12, dice: [2, 8], type: 'poison', half: false, uses: 2 },
        { w: 20, n: 'Внушение', hold: true, save: 'wis', dc: 12, uses: 1 }
      ]
    },
    sildar: {
      name: 'Сильдар', ac: 16, hp: 27, dex: 0, humanoid: true,
      atk: [{ n: 'длинный меч', hit: 5, dice: [1, 8], mod: 3, type: 'slashing' }]
    }
  };

  /* Напарники */
  G.COMPANIONS = {
    sildar: { name: 'Сильдар Холлвинтер', short: 'Сильдар', hp: 27, ac: 16, atk: { n: 'длинный меч', hit: 5, dice: [1, 8], mod: 3, type: 'slashing' }, protect: true,
      text: 'Рыцарь Альянса Лордов, бывший всадник грифонов Глубоководья. Прикрывает щитом: одна атака по вам за раунд — с помехой.' },
    droop: { name: 'Друп', short: 'Друп', hp: 7, ac: 13, atk: { n: 'скимитар', hit: 4, dice: [1, 6], mod: 2, type: 'slashing' }, coward: true,
      text: 'Трусливый гоблин. В бою чаще прячется, а если бьёт — то неуверенно.' }
  };
})();
