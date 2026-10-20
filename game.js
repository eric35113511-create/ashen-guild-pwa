(() => {
  'use strict';

  const LEGACY_SAVE_KEY = 'ashen-guild-save-v1';
  const SAVE_KEY = 'ashen-guild-save-v2';
  const SAVE_VERSION = 4;
  localStorage.removeItem(LEGACY_SAVE_KEY);
  const ranks = [
    { name: '灰燼級', min: 0, next: 100, mark: 'Ⅰ' },
    { name: '鐵炬級', min: 100, next: 260, mark: 'Ⅱ' },
    { name: '銀星級', min: 260, next: 520, mark: 'Ⅲ' },
    { name: '金冠級', min: 520, next: 900, mark: 'Ⅳ' },
    { name: '傳奇級', min: 900, next: 9999, mark: 'Ⅴ' }
  ];

  const worldModifiers = [
    { id: 'tailwind', symbol: '↟', name: '順風日', desc: '所有英雄開始每場戰鬥時額外獲得 1 技能點。' },
    { id: 'bounty', symbol: '◇', name: '懸賞熱潮', desc: '戰鬥取得的金幣增加 50%。' },
    { id: 'fortified', symbol: '⬡', name: '獸群躁動', desc: '敵人生命提高 15%，但每場戰鬥額外獲得 5 金幣。' },
    { id: 'cruel', symbol: '†', name: '血色薄霧', desc: '敵人威力提高 2，委託聲望獎勵增加 25%。' }
  ];

  const relics = [
    { id: 'whetstone', symbol: '/', name: '傭兵磨刀石', desc: '本次遠征全隊威力 +3。' },
    { id: 'oak', symbol: 'O', name: '古橡護符', desc: '全隊生命上限與目前生命 +12。' },
    { id: 'quicksilver', symbol: 'Q', name: '水銀沙漏', desc: '全隊技能點上限 +1，立刻恢復 1 點。' },
    { id: 'ward', symbol: '△', name: '守夜者徽記', desc: '每場戰鬥開始時，全隊獲得 8 護盾。' },
    { id: 'ember', symbol: '*', name: '不滅火種', desc: '全隊恢復 18 生命，之後的治療效果提高。' },
    { id: 'hunter', symbol: 'X', name: '獵首契印', desc: '對破勢累積過半的敵人造成更多傷害。' }
  ];

  const achievementDefs = [
    { id: 'first', name: '第一滴血', desc: '贏得第一場戰鬥', reward: 20, test: s => s.stats.wins >= 1 },
    { id: 'five', name: '熟悉的道路', desc: '出發遠征 5 次', reward: 50, test: s => s.stats.expeditions >= 5 },
    { id: 'rank', name: '鐵炬之名', desc: '公會聲望達到 100', reward: 70, test: s => s.renown >= 100 },
    { id: 'days', name: '長明燈', desc: '公會經營至第 10 日', reward: 100, test: s => s.day >= 10 },
    { id: 'builder', name: '不只是營地', desc: '任一公會設施升至三級', reward: 90, test: s => Object.values(s.facilities||{}).some(v=>v>=3) },
    { id: 'trophies', name: '邊境獵手', desc: '蒐集三個不同區域的戰證', reward: 120, test: s => Object.keys(s.trophies||{}).filter(k=>s.trophies[k]>0).length>=3 },
    { id: 'chronicler', name: '寫進歷史', desc: '完成一條跨遠征事件鏈', reward: 80, test: s => Object.values(s.chains||{}).some(v=>v>=2) }
  ];

  const specializations = {
    bran: [
      { id: 'bulwark', name: '不動壁壘', symbol: '▣', desc: '生命上限 +20，立盾額外提供 5 護盾。' },
      { id: 'breaker', name: '碎陣先鋒', symbol: '◆', desc: '威力 +3，造成的破勢提高 25%。' }
    ],
    mira: [
      { id: 'deadeye', name: '鷹眼獵手', symbol: '⊙', desc: '威力 +4，貫穿箭傷害再提高 20%。' },
      { id: 'pathfinder', name: '荒野尋路者', symbol: '⌁', desc: '戰鬥金幣收益提高 20%，遠征事件治療量提高。' }
    ],
    sena: [
      { id: 'hearth', name: '守火醫者', symbol: '✚', desc: '所有治療效果提高 30%。' },
      { id: 'storm', name: '雷燼術師', symbol: 'ϟ', desc: '威力 +4，星火新生額外造成 8 點破勢。' }
    ],
    riven: [
      { id: 'duelist', name: '決鬥劍士', symbol: 'Ⅱ', desc: '對單一敵人的攻擊傷害提高 15%。' },
      { id: 'dancer', name: '刃舞者', symbol: '∞', desc: '群體攻擊傷害提高 20%。' }
    ],
    alda: [
      { id: 'saint', name: '巡禮聖者', symbol: '✦', desc: '治療效果提高 25%，生命上限 +10。' },
      { id: 'inquisitor', name: '異端審判者', symbol: '☼', desc: '威力 +4，攻擊額外造成破勢。' }
    ],
    tor: [
      { id: 'vanguard', name: '疾風前鋒', symbol: '≫', desc: '威力 +3，每場戰鬥開始額外獲得技能點。' },
      { id: 'captain', name: '戰陣隊長', symbol: '♜', desc: '全隊生命上限 +8。' }
    ]
  };

  const heroTemplates = [
    {
      id: 'bran', name: '布蘭', job: '盾衛', icon: 'B', color: '#d4a84d', maxHp: 92, maxSp: 3, power: 12,
      skills: [
        { id: 'strike', name: '盾擊', desc: '造成傷害與 12 點破勢。', cost: 0, target: 'enemy', damage: 1, stagger: 12 },
        { id: 'guard', name: '立盾', desc: '全隊獲得 10 點護盾。', cost: 1, target: 'allies', shield: 10 },
        { id: 'challenge', name: '挑釁', desc: '獲得 24 護盾，敵人本輪集中攻擊自己。', cost: 2, target: 'self', shield: 24, taunt: true },
        { id: 'crush', name: '碎岩猛擊', desc: '重擊並造成 30 點破勢。', cost: 2, target: 'enemy', damage: 1.45, stagger: 30 },
        { id: 'intercept', name: '攔截陣線', desc: '全隊獲得護盾，自己進入挑釁。', cost: 2, target: 'allies', shield: 8, taunt: true },
        { id: 'revenge', name: '守勢反擊', desc: '獲得反擊姿態，受擊時反傷。', cost: 1, target: 'self', counter: 8 }
      ],
      ultimate:{id:'lastwall',name:'最後城牆',desc:'全隊獲得 28 護盾，布蘭強制挑釁。',target:'allies',shield:28,taunt:true}
    },
    {
      id: 'mira', name: '米拉', job: '遊俠', icon: 'M', color: '#779b68', maxHp: 70, maxSp: 3, power: 15,
      skills: [
        { id: 'shot', name: '精準射擊', desc: '可靠的單體攻擊。', cost: 0, target: 'enemy', damage: 1.05, stagger: 7 },
        { id: 'mark', name: '獵人標記', desc: '造成傷害，使目標易傷 2 回合。', cost: 1, target: 'enemy', damage: .65, vulnerable: 2 },
        { id: 'volley', name: '箭雨', desc: '攻擊所有敵人。', cost: 2, target: 'enemies', damage: .75 },
        { id: 'pierce', name: '貫穿箭', desc: '高傷害且無視部分護甲。', cost: 2, target: 'enemy', damage: 1.7, pierce: true },
        { id: 'snare', name: '束縛陷阱', desc: '造成少量傷害並大幅累積破勢。', cost: 1, target: 'enemy', damage:.45, stagger:24 },
        { id: 'camouflage', name: '煙葉偽裝', desc: '本輪首次受擊完全閃避。', cost: 1, target: 'self', dodge:true }
      ],
      ultimate:{id:'arrowstorm',name:'星落箭雨',desc:'攻擊全體並施加 2 回合易傷。',target:'enemies',damage:1.25,vulnerable:2}
    },
    {
      id: 'sena', name: '瑟娜', job: '燼術師', icon: 'S', color: '#6d91a5', maxHp: 62, maxSp: 4, power: 16,
      skills: [
        { id: 'spark', name: '燼火', desc: '造成法術傷害。', cost: 0, target: 'enemy', damage: 1 },
        { id: 'mend', name: '餘燼復甦', desc: '治療生命最低的隊友。', cost: 1, target: 'lowest', heal: 20 },
        { id: 'burn', name: '灼魂', desc: '附加 3 回合燃燒。', cost: 2, target: 'enemy', damage: .7, burn: 3 },
        { id: 'nova', name: '星火新生', desc: '傷害全體敵人並治療全隊。', cost: 3, target: 'enemies', damage: .65, healAll: 10 },
        { id: 'frost', name: '冷燼封印', desc: '低傷害，但造成大量破勢。', cost: 1, target:'enemy', damage:.4, stagger:28 },
        { id: 'warmth', name: '守夜餘溫', desc: '使全隊獲得持續恢復。', cost:2,target:'allies',regenAll:7 }
      ],
      ultimate:{id:'rekindle',name:'重燃命火',desc:'復甦倒下隊友並治療全隊。',target:'allies',reviveAll:.3,healAll:24,cleanseAll:true}
    },
    {
      id: 'riven', name: '里文', job: '影刃', icon: 'R', color: '#a77891', maxHp: 66, maxSp: 4, power: 17, recruitCost: 145,
      skills: [
        { id: 'cut', name: '快斬', desc: '快速的單體攻擊。', cost: 0, target: 'enemy', damage: 1.05, stagger: 5 },
        { id: 'feint', name: '佯攻', desc: '造成傷害並施加易傷。', cost: 1, target: 'enemy', damage: .7, vulnerable: 2 },
        { id: 'fan', name: '刃扇', desc: '攻擊所有敵人。', cost: 2, target: 'enemies', damage: .8 },
        { id: 'execute', name: '處決式', desc: '高傷害的單體終結技。', cost: 3, target: 'enemy', damage: 2.05, stagger: 12 },
        { id: 'poisonedge', name: '淬毒刃', desc: '造成傷害並附加燃燒型持續傷害。', cost:1,target:'enemy',damage:.75,burn:3 },
        { id: 'vanish', name: '消失', desc: '完全閃避本輪首次受擊並恢復技能點。', cost:2,target:'self',dodge:true,restoreSelf:1 }
      ],
      ultimate:{id:'deathdance',name:'死亡輪舞',desc:'連斬所有敵人，對低生命目標威力更高。',target:'enemies',damage:1.15,ultimateExecute:true}
    },
    {
      id: 'alda', name: '阿爾妲', job: '祈誓者', icon: 'A', color: '#d6c58a', maxHp: 74, maxSp: 4, power: 12, recruitCost: 155,
      skills: [
        { id: 'smite', name: '懲戒', desc: '造成傷害與破勢。', cost: 0, target: 'enemy', damage: .95, stagger: 10 },
        { id: 'prayer', name: '療癒禱言', desc: '治療生命最低的隊友。', cost: 1, target: 'lowest', heal: 24 },
        { id: 'aegis', name: '誓約庇護', desc: '全隊獲得 13 護盾。', cost: 2, target: 'allies', shield: 13 },
        { id: 'sanctuary', name: '聖域', desc: '大幅治療全隊。', cost: 3, target: 'allies', healAll: 20 },
        { id: 'cleanse', name: '淨化儀式', desc: '清除全隊中毒並恢復少量生命。', cost:1,target:'allies',cleanseAll:true,healAll:6 },
        { id: 'judgment', name: '審判之光', desc: '目標狀態越多，造成越高傷害。', cost:2,target:'enemy',damage:1.25,statusScale:true }
      ],
      ultimate:{id:'dawn',name:'黎明誓約',desc:'治療、淨化並賦予全隊護盾。',target:'allies',healAll:22,shield:18,cleanseAll:true}
    },
    {
      id: 'tor', name: '托爾', job: '風槍手', icon: 'T', color: '#7aa0a0', maxHp: 80, maxSp: 3, power: 15, recruitCost: 150,
      skills: [
        { id: 'thrust', name: '突刺', desc: '穩定的單體攻擊。', cost: 0, target: 'enemy', damage: 1, stagger: 9 },
        { id: 'sweep', name: '橫掃', desc: '攻擊所有敵人。', cost: 1, target: 'enemies', damage: .62, stagger: 6 },
        { id: 'rally', name: '振奮戰吼', desc: '全隊恢復 1 技能點。', cost: 2, target: 'allies', restoreAll: 1 },
        { id: 'skyfall', name: '墜星槍', desc: '強力攻擊並造成大量破勢。', cost: 3, target: 'enemy', damage: 1.75, stagger: 28 },
        { id: 'formation', name: '雁行陣', desc: '全隊獲得護盾與 1 技能點。', cost:2,target:'allies',shield:7,restoreAll:1 },
        { id: 'impale', name: '定風穿刺', desc: '無視護甲並降低敵人威力。', cost:2,target:'enemy',damage:1.15,pierce:true,weaken:2 }
      ],
      ultimate:{id:'dragonfall',name:'天槍墜龍',desc:'單體決戰技，造成巨大傷害與破勢。',target:'enemy',damage:2.5,stagger:42,pierce:true}
    }
  ];

  const equipment = [
    { id:'ironblade', name:'邊軍鐵刃', slot:'weapon', rarity:'common', cost:48, power:3, jobs:['盾衛','影刃','風槍手'], desc:'威力 +3' },
    { id:'moonbow', name:'月枝長弓', slot:'weapon', rarity:'rare', trait:'opening', cost:76, power:4, jobs:['遊俠'], desc:'首輪攻擊傷害 +25%' },
    { id:'ashstaff', name:'灰晶法杖', slot:'weapon', rarity:'rare', trait:'kindle', cost:82, power:4, sp:1, jobs:['燼術師','祈誓者'], desc:'施放治療後恢復自己 1 技能點' },
    { id:'oathspear', name:'誓約長槍', slot:'weapon', rarity:'epic', trait:'momentum', cost:118, power:5, jobs:['風槍手','祈誓者'], desc:'擊破敵人破勢時恢復 1 技能點' },
    { id:'thornknife', name:'荊棘短刀', slot:'weapon', rarity:'rare', trait:'execute', cost:78, power:3, jobs:['影刃','遊俠'], desc:'對生命低於 35% 的敵人傷害 +30%' },
    { id:'bellhammer', name:'喪鐘戰鎚', slot:'weapon', rarity:'epic', trait:'aftershock', cost:125, power:4, jobs:['盾衛'], desc:'破勢攻擊會波及其他敵人' },
    { id:'leather', name:'獵戶皮甲', slot:'armor', rarity:'common', cost:44, hp:12, desc:'生命 +12' },
    { id:'plate', name:'灰鋼板甲', slot:'armor', rarity:'rare', trait:'warding', cost:82, hp:20, jobs:['盾衛','祈誓者'], desc:'每場戰鬥開始獲得 10 護盾' },
    { id:'silk', name:'符文絲衣', slot:'armor', rarity:'rare', trait:'focus', cost:78, hp:8, sp:1, jobs:['燼術師','影刃'], desc:'每場首個付費技能少消耗 1 點' },
    { id:'windcoat', name:'逐風外套', slot:'armor', rarity:'rare', trait:'evasion', cost:76, hp:14, jobs:['遊俠','風槍手'], desc:'每場第一次受擊傷害減半' },
    { id:'mirecloak', name:'沼行斗篷', slot:'armor', rarity:'common', trait:'antidote', cost:55, hp:10, desc:'中毒持續時間減少 1 回合' },
    { id:'phoenixmail', name:'不熄羽衣', slot:'armor', rarity:'epic', trait:'laststand', cost:132, hp:16, jobs:['燼術師','祈誓者'], desc:'每次遠征首次致命傷改為保留 1 生命' },
    { id:'fang', name:'狼牙墜飾', slot:'charm', rarity:'common', trait:'hunt', cost:52, power:2, hp:6, desc:'擊倒敵人恢復 4 生命' },
    { id:'amber', name:'琥珀護符', slot:'charm', rarity:'rare', trait:'purify', cost:80, hp:12, sp:1, desc:'戰鬥結束時清除中毒' },
    { id:'guildseal', name:'老會長印戒', slot:'charm', rarity:'epic', trait:'command', cost:126, power:2, hp:10, desc:'開戰時全隊獲得 1 技能點' },
    { id:'glassstar', name:'玻璃星盤', slot:'charm', rarity:'epic', trait:'wildfire', cost:122, power:3, jobs:['燼術師','祈誓者'], desc:'燃燒可額外跳躍至另一名敵人' },
    { id:'coppercoin', name:'缺角幸運幣', slot:'charm', rarity:'common', trait:'fortune', cost:46, hp:5, desc:'裝備掉落機率稍微提高' },
    { id:'chainmark', name:'斷鏈徽記', slot:'charm', rarity:'rare', trait:'resolve', cost:84, power:2, desc:'生命低於一半時，破勢量提高 30%' }
  ];

  const rarityInfo={common:{name:'普通',color:'#a7a99e'},rare:{name:'稀有',color:'#6ea4c8'},epic:{name:'史詩',color:'#bd79cf'}};
  const eliteAffixes=[
    {id:'volatile',name:'爆裂',desc:'死亡時對全隊造成 5 傷害'},
    {id:'regenerator',name:'再生',desc:'每輪恢復 6 生命'},
    {id:'frenzied',name:'狂怒',desc:'低生命時只使用蓄力攻擊'},
    {id:'armored',name:'結界',desc:'每輪開始獲得 8 護盾'}
  ];
  const difficulties={
    frontier:{name:'邊境',desc:'完整顯示敵方情報，採用標準精英與特殊行動頻率。',elite:0,special:0,reward:1,conceal:false},
    tactician:{name:'軍略',desc:'精英與協同行動更常出現，委託報酬提高 20%。',elite:.15,special:.15,reward:1.2,conceal:false},
    omen:{name:'凶兆',desc:'隱藏敵方傷害數字，精英密度最高，委託報酬提高 40%。',elite:.25,special:.25,reward:1.4,conceal:true}
  };
  const injuries=[
    {id:'wound',name:'撕裂傷',days:2,desc:'生命上限 -12',hp:-12},
    {id:'sprain',name:'筋腱拉傷',days:2,desc:'威力 -3',power:-3},
    {id:'shock',name:'魔力震盪',days:3,desc:'技能點上限 -1',sp:-1}
  ];

  const enemyTemplates = {
    wolf: { name: '荒原狼', icon: 'W', hp: 42, power: 9, armor: 0, staggerMax: 35, color: '#b77d61' },
    bandit: { name: '流寇', icon: 'R', hp: 56, power: 11, armor: 2, staggerMax: 45, color: '#bb6a54' },
    shaman: { name: '腐枝薩滿', icon: 'S', hp: 48, power: 10, armor: 1, staggerMax: 40, color: '#8d7563', support: true },
    spider: { name: '墓穴毒蛛', icon: 'A', hp: 38, power: 7, armor: 0, staggerMax: 32, color: '#8b718e', venomous: true },
    wisp: { name: '殘光妖火', icon: 'I', hp: 36, power: 8, armor: 0, staggerMax: 30, color: '#7295a9', healer: true },
    cultist: { name: '灰冠祭徒', icon: 'C', hp: 62, power: 12, armor: 2, staggerMax: 48, color: '#9b6572' },
    golem: { name: '苔岩魔像', icon: 'G', hp: 88, power: 14, armor: 5, staggerMax: 60, color: '#7e806c' },
    warden: { name: '失落守衛', icon: 'V', hp: 122, power: 16, armor: 4, staggerMax: 75, color: '#9d705b', boss: true }
  };

  const contractSeeds = [
    { zone: '狼煙丘陵', title: '失蹤的商旅', desc: '車轍停在舊道中央。找回貨物，或至少帶回商隊的消息。', risk: 1, accent: '#c9a252', pool: ['wolf', 'bandit'] },
    { zone: '腐根沼地', title: '會走路的藥草', desc: '藥師願為一株夜光苔付出高價，只是沼地最近並不安靜。', risk: 2, accent: '#779b68', pool: ['wolf', 'shaman', 'spider'] },
    { zone: '碎石古道', title: '沉默的哨塔', desc: '連續三夜沒有烽火升起。軍需官要一份現場勘查報告。', risk: 2, accent: '#b77d61', pool: ['bandit', 'golem'] },
    { zone: '灰冠遺跡', title: '封印下的回聲', desc: '探勘隊挖出不該甦醒的東西。高風險，也意味著高報酬。', risk: 3, accent: '#a77891', pool: ['shaman', 'spider', 'wisp', 'cultist', 'golem', 'warden'] },
    { zone: '北風林線', title: '冬糧護送', desc: '護送補給穿越獸群領地。每一袋糧食都能讓聚落多撐一天。', risk: 1, accent: '#6d91a5', pool: ['wolf', 'wolf', 'bandit'] }
  ];

  const seasons = [
    { id:'beast', name:'獸潮季', symbol:'爪', desc:'丘陵與林線的威脅增長更快，精英蹤跡更常出現。' },
    { id:'mire', name:'霧沼季', symbol:'霧', desc:'事件路線更常帶來代價，但稀有裝備掉落機率提高。' },
    { id:'trade', name:'商路季', symbol:'衡', desc:'遠征完成時會取得額外鐵屑與韌布。' },
    { id:'longnight', name:'長夜季', symbol:'月', desc:'危機契約報酬提高，最終敵人更容易帶有精英特性。' }
  ];
  const directiveDefs = [
    { id:'contracts', name:'安定邊境', desc:'完成 2 份契約', type:'contract', target:2, gold:70, renown:22 },
    { id:'elites', name:'獵殺令', desc:'擊敗 3 場精英遭遇', type:'elite', target:3, gold:85, renown:18 },
    { id:'salvage', name:'整備需求', desc:'帶回 2 件裝備', type:'gear', target:2, gold:60, renown:26 },
    { id:'crisis', name:'緊急動員', desc:'化解 1 場區域危機', type:'crisis', target:1, gold:110, renown:35 }
  ];
  const facilityDefs = {
    scouts:{name:'斥候塔',desc:['顯示精確區域威脅','路線提供三個選擇','危機契約額外降低 8 點威脅']},
    forgehouse:{name:'大鍛造間',desc:['解鎖稀有裝備製作','分解素材 +25%','解鎖史詩裝備製作']},
    training:{name:'訓練庭',desc:['升級技能素材 -10%','角色升級額外獲得能力點','升級技能素材再 -10%']},
    archive:{name:'英雄檔案館',desc:['頭目首勝獎勵提高','編年史容量增加','危機聲望 +20%']}
  };
  const materialDefs={scrap:{name:'鐵屑',symbol:'▰',desc:'鍛造武器與強化裝備'},cloth:{name:'韌布',symbol:'▧',desc:'製作護甲與防具'},essence:{name:'灰燼精華',symbol:'✦',desc:'製作飾品與稀有裝備'},skillDust:{name:'戰技殘頁',symbol:'頁',desc:'升級角色技能'},bossCore:{name:'首領核心',symbol:'◆',desc:'高階技能與史詩鍛造'}};
  const joinThresholds={riven:80,tor:180,alda:320};
  const dailyQuestDefs=[
    {id:'battles',name:'清理道路',desc:'贏得 2 場戰鬥',type:'battle',target:2,reward:{gold:24,skillDust:2}},
    {id:'contract',name:'完成值勤',desc:'完成 1 份契約',type:'contract',target:1,reward:{gold:35,scrap:3}},
    {id:'ultimate',name:'氣勢如虹',desc:'施放 1 次絕招',type:'ultimate',target:1,reward:{essence:2,skillDust:1}},
    {id:'craft',name:'工坊委託',desc:'製作或強化 1 次裝備',type:'craft',target:1,reward:{gold:25,cloth:3}},
    {id:'dismantle',name:'物資回收',desc:'分解 1 件裝備',type:'dismantle',target:1,reward:{scrap:4,skillDust:1}}
  ];

  const freshState = () => ({ day: 1, gold: 120, renown: 0, supplies: 2, difficulty:'frontier', upgrades: { forge: 0, infirmary: 0 }, facilities:{scouts:0,forgehouse:0,training:0,archive:0},materials:{scrap:8,cloth:5,essence:3,skillDust:4,bossCore:0},gearLevels:{},daily:null,regions:Object.fromEntries(contractSeeds.map((c,i)=>[c.zone,{threat:24+i*7,cleared:0,crises:0}])), directive:null, trophies:{}, chronicle:[], chains:{}, contracts: [], heroes: heroTemplates.map(h => ({ ...h, level: 1, xp: 0, attributePoints:0,attributes:{vitality:0,might:0,focus:0}, skillRanks:{}, activeSkills:h.skills.slice(0,4).map(s=>s.id), injury:null, owned: !joinThresholds[h.id], equipment: { weapon: null, armor: null, charm: null } })), activeParty: ['bran','mira','sena'], inventory: ['ironblade','leather'], shopStock: [], discovered:{enemies:[],equipment:['ironblade','leather'],zones:[]}, seenIntro: false, stats: { wins: 0, expeditions: 0, completed: 0 }, achievements: {} });
  let state;
  let expedition = null;
  let combat = null;
  let audioOn = true;
  let audioContext = null;
  let bgmTimer = null;
  let bgmStep = 0;
  let pendingSkill = null;
  let toastTimer;

  const $ = id => document.getElementById(id);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  state = normalizeState(load());

  function normalizeState(s){
    s.day=Math.max(1,Math.floor(Number(s.day)||1));s.gold=Math.max(0,Math.floor(Number(s.gold)||0));s.renown=Math.max(0,Math.floor(Number(s.renown)||0));s.supplies=clamp(Math.floor(Number(s.supplies)||0),0,5);
    Object.keys(facilityDefs).forEach(id=>s.facilities[id]=clamp(Math.floor(Number(s.facilities[id])||0),0,3));
    Object.keys(materialDefs).forEach(id=>s.materials[id]=Math.max(0,Math.floor(Number(s.materials[id])||0)));
    Object.values(s.regions).forEach(r=>{r.threat=clamp(Math.floor(Number(r.threat)||0),0,100);r.cleared=Math.max(0,Math.floor(Number(r.cleared)||0));r.crises=Math.max(0,Math.floor(Number(r.crises)||0));});
    s.activeParty=(Array.isArray(s.activeParty)?s.activeParty:[]).filter((id,i,a)=>a.indexOf(id)===i&&s.heroes.some(h=>h.id===id&&h.owned)).slice(0,3);if(!s.activeParty.length)s.activeParty=s.heroes.filter(h=>h.owned).slice(0,3).map(h=>h.id);
    s.inventory=Array.isArray(s.inventory)?s.inventory.filter(id=>equipment.some(i=>i.id===id)):[];s.contracts=Array.isArray(s.contracts)?s.contracts:[];s.shopStock=Array.isArray(s.shopStock)?s.shopStock:[];s.chronicle=Array.isArray(s.chronicle)?s.chronicle:[];
    if(s.directive&&!directiveDefs.some(d=>d.id===s.directive.id))s.directive=null;return s;
  }

  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVE_KEY));
      const base = freshState();
      return parsed ? { ...base, ...parsed, upgrades: { ...base.upgrades, ...parsed.upgrades }, facilities:{...base.facilities,...parsed.facilities},materials:{...base.materials,...parsed.materials},gearLevels:{...base.gearLevels,...parsed.gearLevels},regions:Object.fromEntries(Object.entries(base.regions).map(([z,v])=>[z,{...v,...parsed.regions?.[z]}])), trophies:{...base.trophies,...parsed.trophies}, chains:{...base.chains,...parsed.chains}, chronicle:parsed.chronicle||[], stats: { ...base.stats, ...parsed.stats }, achievements: { ...base.achievements, ...parsed.achievements }, discovered:{...base.discovered,...parsed.discovered}, activeParty: parsed.activeParty || base.activeParty, inventory: parsed.inventory || base.inventory, shopStock: parsed.shopStock || [], heroes: heroTemplates.map(h => { const old=parsed.heroes?.find?.(x=>x.id===h.id); return { ...h, level:1, xp:0, attributePoints:Math.max(0,(old?.level||1)-1),attributes:{vitality:0,might:0,focus:0}, skillRanks:{}, activeSkills:h.skills.slice(0,4).map(s=>s.id), injury:null, owned:!joinThresholds[h.id], ...old, skills:h.skills, ultimate:h.ultimate,attributes:{vitality:0,might:0,focus:0,...old?.attributes}, activeSkills:(old?.activeSkills||h.skills.slice(0,4).map(s=>s.id)).filter(id=>h.skills.some(s=>s.id===id)).slice(0,4), skillRanks:{...(old?.skillRanks||{})}, equipment:{ weapon:null, armor:null, charm:null, ...(old?.equipment||{}) } }; }) } : base;
    } catch { return freshState(); }
  }

  function save() { state.saveVersion=SAVE_VERSION;state.savedAt=new Date().toISOString();localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
  function discover(kind,id){const list=state.discovered?.[kind];if(list&&!list.includes(id)){list.push(id);return true;}return false;}
  function tone(freq = 440, duration = .06) {
    if (!audioOn) return;
    try {
      const ctx = audioContext||(audioContext=new (window.AudioContext || window.webkitAudioContext)());
      if(ctx.state==='suspended')ctx.resume();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type='triangle';osc.frequency.value = freq; gain.gain.setValueAtTime(.035, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + duration);
    } catch { /* Audio is optional. */ }
  }
  function bgmPulse(){if(!audioOn)return;const notes=[110,146.83,164.81,130.81,110,196,164.81,146.83];try{const ctx=audioContext||(audioContext=new (window.AudioContext||window.webkitAudioContext)());const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=notes[bgmStep++%notes.length];gain.gain.setValueAtTime(.018,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+2.8);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+3);}catch{/* optional */}}
  function startBgm(){if(bgmTimer||!audioOn)return;bgmPulse();bgmTimer=setInterval(bgmPulse,3000);}
  function stopBgm(){if(bgmTimer){clearInterval(bgmTimer);bgmTimer=null;}}
  function toast(message) { $('toast').textContent = message; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2200); }

  function rankInfo() { return [...ranks].reverse().find(r => state.renown >= r.min); }
  function specInfo(hero) { return specializations[hero.id]?.find(s => s.id === hero.specialization); }
  function dailyModifier() { return worldModifiers[(state.day - 1) % worldModifiers.length]; }
  function currentSeason(){return seasons[Math.floor((state.day-1)/7)%seasons.length];}
  function addChronicle(text){state.chronicle.unshift({day:state.day,text});state.chronicle=state.chronicle.slice(0,20+(state.facilities.archive||0)*10);}
  function ensureDaily(){if(state.daily?.day===state.day)return;const offset=(state.day-1)%dailyQuestDefs.length;const chosen=[0,1,2].map(i=>dailyQuestDefs[(offset+i)%dailyQuestDefs.length]);state.daily={day:state.day,tasks:chosen.map(q=>({id:q.id,progress:0,claimed:false}))};}
  function rewardText(reward){return Object.entries(reward).map(([id,n])=>id==='gold'?`${n} G`:`${materialDefs[id]?.name||id}×${n}`).join('、');}
  function progressDaily(type,amount=1){ensureDaily();state.daily.tasks.forEach(t=>{const q=dailyQuestDefs.find(x=>x.id===t.id);if(!q||q.type!==type||t.claimed)return;t.progress=Math.min(q.target,t.progress+amount);if(t.progress>=q.target){t.claimed=true;Object.entries(q.reward).forEach(([id,n])=>{if(id==='gold')state.gold+=n;else state.materials[id]+=n;});toast(`每日任務完成：${q.name}`);}});}
  function syncRenownHeroes(){let changed=false;state.heroes.forEach(h=>{const need=joinThresholds[h.id];if(need&&state.renown>=need&&!h.owned){h.owned=true;changed=true;addChronicle(`${h.name}因公會聲望遠播而主動加入。`);toast(`${h.name}慕名加入公會！`);}});if(changed)save();}
  function ensureDirective(){if(state.directive&&state.day<=state.directive.expires)return;const def=directiveDefs[(Math.floor((state.day-1)/5)+state.stats.completed)%directiveDefs.length];state.directive={id:def.id,progress:0,expires:state.day+4,claimed:false};}
  function progressDirective(type,amount=1){ensureDirective();const d=directiveDefs.find(x=>x.id===state.directive.id);if(!d||d.type!==type||state.directive.claimed)return;state.directive.progress=Math.min(d.target,state.directive.progress+amount);if(state.directive.progress>=d.target){state.directive.claimed=true;state.gold+=d.gold;state.renown+=d.renown;addChronicle(`完成公會方針「${d.name}」，獲得 ${d.gold} 金幣與 ${d.renown} 聲望。`);toast(`公會方針完成：${d.name}`);}}
  function threatLabel(n){return n>=75?'危機':n>=50?'動盪':n>=25?'戒備':'安定';}
  function checkAchievements(notify = true) {
    const unlocked = achievementDefs.filter(a => !state.achievements[a.id] && a.test(state));
    unlocked.forEach(a => { state.achievements[a.id] = true; state.gold += a.reward; });
    if (unlocked.length) {
      save();
      if (notify) toast(`成就解鎖：${unlocked.map(a => a.name).join('、')}（獎勵已入帳）`);
    }
  }
  function generateContracts() {
    const unlockedRisk = state.renown >= 100 ? 3 : 2;
    const reward=difficulties[state.difficulty]?.reward||1;
    const ordered=[...contractSeeds].sort((a,b)=>(state.regions[b.zone]?.threat||0)-(state.regions[a.zone]?.threat||0)+Math.random()-.5);
    state.contracts = ordered.filter(c => c.risk <= unlockedRisk || (state.regions[c.zone]?.threat||0)>=75).slice(0, 3).map((c, i) => {const threat=state.regions[c.zone]?.threat||0;const crisis=threat>=75;const risk=crisis?Math.max(3,c.risk):c.risk;const seasonBonus=crisis&&currentSeason().id==='longnight'?1.2:1;return { ...c,risk,crisis,threat,id: `${state.day}-${i}-${Date.now()}`, gold: Math.round((38 + risk * 24 + rand(0, 16))*reward*(crisis?1.45:1)*seasonBonus), renown: Math.round((16 + risk * 10)*reward*(crisis?1.35:1)*seasonBonus), nodes: risk + 2+(crisis?1:0) };});
    save();
  }

  function renderGuild() {
    ensureDirective();
    ensureDaily();syncRenownHeroes();
    if (!state.contracts.length) generateContracts();
    checkAchievements(false);
    $('day').textContent = state.day; $('gold').textContent = state.gold; $('renown').textContent = state.renown;
    const rank = rankInfo(); $('guildRank').textContent = rank.name; document.querySelector('.seal').textContent = rank.mark;
    const span = rank.next - rank.min; const progress = clamp((state.renown - rank.min) / span * 100, 0, 100);
    $('rankBar').style.width = `${progress}%`; $('rankHint').textContent = rank.next === 9999 ? '你的名號已傳遍北境' : `再獲得 ${rank.next - state.renown} 聲望即可晉升`;
    const modifier = dailyModifier();
    const diff=difficulties[state.difficulty]||difficulties.frontier;
    $('worldModifier').innerHTML = `<i class="world-symbol">${modifier.symbol}</i><strong>今日局勢 · ${modifier.name}</strong><span>${modifier.desc}</span><label class="difficulty-control">戰術難度<select id="difficultySelect">${Object.entries(difficulties).map(([id,d])=>`<option value="${id}" ${id===state.difficulty?'selected':''}>${d.name}</option>`).join('')}</select><small>${diff.desc}</small></label>`;
    $('difficultySelect').addEventListener('change',e=>changeDifficulty(e.target.value));
    renderWorldDashboard();
    $('contractList').innerHTML = state.contracts.map(c => `
      <article class="contract" style="--accent:${c.accent}">
        <div class="contract-top"><span>${c.zone} · ${state.facilities.scouts>=1?`威脅 ${c.threat ?? state.regions[c.zone]?.threat}%`:threatLabel(c.threat ?? state.regions[c.zone]?.threat)}</span><b class="risk">${c.crisis?'危機 ':''}${'◆'.repeat(c.risk)}${'◇'.repeat(Math.max(0,3-c.risk))}</b></div>
        <h3>${c.title}</h3><p>${c.desc}</p>
        <div class="contract-reward"><div class="reward-numbers"><b>${c.gold}</b> 金幣<br><b>${c.renown}</b> 聲望 · ${c.nodes} 節點</div><button class="action-btn" data-contract="${c.id}">接受</button></div>
      </article>`).join('');
    document.querySelectorAll('[data-contract]').forEach(btn => btn.addEventListener('click', () => startExpedition(btn.dataset.contract)));
    $('roster').innerHTML = state.heroes.filter(h=>h.owned).map(h => {
      const max = scaledHero(h).maxHp;
      const spec=specInfo(h);
      const active=state.activeParty.includes(h.id); const equipped=Object.values(h.equipment||{}).filter(Boolean).length;
      return `<article class="hero-card ${active?'selected':''} ${h.injury?'injured':''}" style="--accent:${h.color}"><div class="portrait">${h.icon}</div><div class="hero-meta"><div><h3>${h.name}</h3><small>${h.job}${spec?` · ${spec.name}`:''}</small></div><b>Lv.${h.level}</b></div>${h.injury?`<div class="injury-tag">${h.injury.name} · ${h.injury.desc} · ${h.injury.days} 日</div>`:''}<div class="stats"><span>生命 ${max}</span><span>威力 ${scaledHero(h).power}</span><span>能力點 ${h.attributePoints||0}</span></div><div class="hero-actions"><button data-party="${h.id}">${active?'移出隊伍':'編入隊伍'}</button><button data-gear="${h.id}">裝備 ${equipped}/3</button><button data-training="${h.id}">技能</button><button data-attributes="${h.id}">能力</button></div>${!spec&&h.level>=3?`<button class="spec-ready" data-specialize="${h.id}">選擇專精</button>`:''}</article>`;
    }).join('')+state.heroes.filter(h=>!h.owned).map(h=>`<article class="hero-card locked-hero" style="--accent:${h.color}"><div class="portrait">?</div><h3>${h.name} · ${h.job}</h3><small>公會聲望達到 ${joinThresholds[h.id]} 時加入</small><div class="rank-progress"><i style="width:${Math.min(100,state.renown/joinThresholds[h.id]*100)}%"></i></div></article>`).join('');
    document.querySelectorAll('[data-specialize]').forEach(b=>b.addEventListener('click',()=>openSpecialization(b.dataset.specialize)));
    document.querySelectorAll('[data-party]').forEach(b=>b.addEventListener('click',()=>toggleParty(b.dataset.party)));
    document.querySelectorAll('[data-gear]').forEach(b=>b.addEventListener('click',()=>openEquipment(b.dataset.gear)));
    document.querySelectorAll('[data-training]').forEach(b=>b.addEventListener('click',()=>openTraining(b.dataset.training)));
    document.querySelectorAll('[data-attributes]').forEach(b=>b.addEventListener('click',()=>openAttributes(b.dataset.attributes)));
    renderShop();
  }

  function changeDifficulty(id){if(!difficulties[id]||id===state.difficulty)return;state.difficulty=id;state.contracts=[];generateContracts();renderGuild();toast(`戰術難度已切換為「${difficulties[id].name}」`);}

  function renderWorldDashboard(){
    const season=currentSeason();const d=directiveDefs.find(x=>x.id===state.directive.id);const left=Math.max(0,state.directive.expires-state.day+1);
    const daily=state.daily.tasks.map(t=>{const q=dailyQuestDefs.find(x=>x.id===t.id);return `<div class="daily-task ${t.claimed?'done':''}"><b>${t.claimed?'✓ ':''}${q.name}</b><span>${q.desc} · ${rewardText(q.reward)}</span><em>${t.progress}/${q.target}</em></div>`;}).join('');
    $('worldDashboard').innerHTML=`<article class="season-card"><span class="dashboard-symbol">${season.symbol}</span><div><small>第 ${Math.floor((state.day-1)/7)+1} 季 · ${7-(state.day-1)%7} 日後輪替</small><h3>${season.name}</h3><p>${season.desc}</p></div></article><article class="directive-card"><small>公會方針 · 剩餘 ${left} 日</small><h3>${d.name}</h3><p>${d.desc}</p><div class="directive-progress"><i style="width:${state.directive.progress/d.target*100}%"></i></div><b>${state.directive.progress}/${d.target}${state.directive.claimed?' · 已完成':` · 獎勵 ${d.gold} G / ${d.renown} 聲望`}</b></article><article class="daily-card"><small>DAILY ORDERS · 每日更新</small><h3>今日任務</h3>${daily}</article><div class="region-grid">${contractSeeds.map(c=>{const r=state.regions[c.zone];return `<article class="region-state ${r.threat>=75?'crisis':''}"><span>${threatLabel(r.threat)}</span><b>${c.zone}</b><small>${state.facilities.scouts>=1?`威脅 ${r.threat}% · `:''}平定 ${r.cleared} 次</small><div><i style="width:${state.facilities.scouts>=1?r.threat:(Math.ceil(r.threat/25)*25)}%"></i></div></article>`;}).join('')}</div>`;
  }

  function renderShop() {
    $('shop').innerHTML = `<span class="shop-label">裝備抽取</span><div class="forge-banner"><b>灰燼軍械箱</b><span>依聲望解鎖稀有度；十連必定至少一件稀有裝備。</span><div><button class="action-btn" data-draw="1" ${state.gold<45?'disabled':''}>抽取 1 次 · 45 G</button><button class="action-btn" data-draw="10" ${state.gold<400?'disabled':''}>抽取 10 次 · 400 G</button></div></div><span class="shop-label">鐵匠鋪</span><div class="workshop-links"><button data-open-forge="craft">製作裝備</button><button data-open-forge="upgrade">強化裝備</button><button data-open-forge="dismantle">分解裝備</button><button data-open-bag>查看背包</button></div><span class="shop-label">公會建設</span>${Object.entries(facilityDefs).map(([id,f])=>{const lv=state.facilities[id];const cost=95+lv*75;return `<div class="shop-item"><b>${f.name} Lv.${lv}</b><span>${lv>=3?'已完成建設':f.desc[lv]}</span><button data-facility="${id}" data-cost="${cost}" ${lv>=3||state.gold<cost?'disabled':''}>${lv>=3?'MAX':cost+' G'}</button></div>`;}).join('')}`;
    document.querySelectorAll('[data-draw]').forEach(b=>b.addEventListener('click',()=>drawEquipment(+b.dataset.draw)));
    document.querySelectorAll('[data-open-forge]').forEach(b=>b.addEventListener('click',()=>openForge(b.dataset.openForge)));
    document.querySelectorAll('[data-open-bag]').forEach(b=>b.addEventListener('click',openBag));
    document.querySelectorAll('[data-facility]').forEach(b=>b.addEventListener('click',()=>upgradeFacility(b.dataset.facility,+b.dataset.cost)));
  }

  function slotName(slot){return {weapon:'武器',armor:'護甲',charm:'飾品'}[slot]||slot;}
  function rarityName(item){return rarityInfo[item.rarity||'common'].name;}
  function heroTraits(hero){return Object.values(hero.equipment||{}).map(id=>equipment.find(i=>i.id===id)?.trait).filter(Boolean);}
  function hasTrait(hero,trait){return heroTraits(hero).includes(trait);}

  function upgradeFacility(id,cost){if(!facilityDefs[id]||state.gold<cost||state.facilities[id]>=3)return;state.gold-=cost;state.facilities[id]++;state.shopStock=[];addChronicle(`${facilityDefs[id].name}升至 Lv.${state.facilities[id]}。`);save();renderGuild();tone(680,.12);toast(`${facilityDefs[id].name}完成擴建`);}

  function drawEquipment(count){const cost=count===10?400:45;if(state.gold<cost)return;state.gold-=cost;const results=[];for(let n=0;n<count;n++){const roll=Math.random();let rarity=(count===10&&n===count-1&&results.every(x=>x.rarity==='common'))?'rare':roll<Math.min(.08,state.renown/4000)?'epic':roll<.3?'rare':'common';if(rarity==='epic'&&state.renown<120)rarity='rare';let pool=equipment.filter(i=>i.rarity===rarity);const item=pick(pool.length?pool:equipment.filter(i=>i.rarity==='common'));state.inventory.push(item.id);discover('equipment',item.id);results.push(item);}save();renderGuild();tone(780,.16);$('modal').classList.add('open');$('modal').setAttribute('aria-hidden','false');$('modalTitle').textContent='軍械箱開啟結果';$('modalBody').innerHTML=`<div class="draw-results">${results.map(i=>`<article class="inventory-item rarity-${i.rarity}"><b>${i.name}</b><span>${rarityName(i)} · ${slotName(i.slot)}</span></article>`).join('')}</div>`;}
  function inventoryCounts(){return state.inventory.reduce((m,id)=>(m[id]=(m[id]||0)+1,m),{});}
  function openBag(){const counts=inventoryCounts();$('modal').classList.add('open');$('modal').setAttribute('aria-hidden','false');$('modalTitle').textContent='公會背包';$('modalBody').innerHTML=`<span class="eyebrow">MATERIALS</span><div class="material-grid">${Object.entries(materialDefs).map(([id,m])=>`<article><i>${m.symbol}</i><b>${m.name}</b><strong>${state.materials[id]}</strong><small>${m.desc}</small></article>`).join('')}</div><span class="eyebrow">EQUIPMENT</span><div class="inventory-list">${Object.entries(counts).map(([id,n])=>{const i=equipment.find(x=>x.id===id);return `<article class="inventory-item rarity-${i.rarity}"><b>${i.name} ${state.gearLevels[id]?`+${state.gearLevels[id]}`:''}</b><span>${rarityName(i)} · ${slotName(i.slot)} · 持有 ${n}</span></article>`;}).join('')||'<p class="empty-note">背包內沒有未裝備的裝備</p>'}</div>`;}
  function craftCost(item){const rare=item.rarity==='rare',epic=item.rarity==='epic';return item.slot==='weapon'?{scrap:epic?18:rare?10:6,essence:epic?8:rare?3:0,bossCore:epic?1:0}:item.slot==='armor'?{cloth:epic?18:rare?10:6,essence:epic?7:rare?3:0,bossCore:epic?1:0}:{scrap:epic?7:rare?4:2,cloth:epic?7:rare?4:2,essence:epic?12:rare?6:3,bossCore:epic?1:0};}
  function canPayMaterials(cost){return Object.entries(cost).every(([id,n])=>(state.materials[id]||0)>=n);}
  function payMaterials(cost){Object.entries(cost).forEach(([id,n])=>state.materials[id]-=n);}
  function costText(cost){return Object.entries(cost).filter(([,n])=>n).map(([id,n])=>`${materialDefs[id].name}×${n}`).join('、');}
  function openForge(mode='craft'){const counts=inventoryCounts();const allowed=equipment.filter(i=>i.rarity==='common'||i.rarity==='rare'&&state.facilities.forgehouse>=1||i.rarity==='epic'&&state.facilities.forgehouse>=3);let body='';if(mode==='craft')body=allowed.map(i=>{const c=craftCost(i);return `<div class="forge-row rarity-${i.rarity}"><div><b>${i.name}</b><span>${rarityName(i)} · ${slotName(i.slot)} · ${i.desc}</span><small>${costText(c)}</small></div><button data-craft="${i.id}" ${canPayMaterials(c)?'':'disabled'}>製作</button></div>`;}).join('');if(mode==='upgrade')body=Object.keys(counts).map(id=>{const i=equipment.find(x=>x.id===id),lv=state.gearLevels[id]||0,c={scrap:5+lv*4,essence:i.rarity==='common'?0:2+lv,bossCore:i.rarity==='epic'&&lv>=2?1:0};return `<div class="forge-row rarity-${i.rarity}"><div><b>${i.name} +${lv}</b><span>每級提高裝備基礎性能，最高 +5</span><small>${costText(c)}</small></div><button data-upgrade-gear="${id}" ${lv>=5||!canPayMaterials(c)?'disabled':''}>${lv>=5?'MAX':'強化'}</button></div>`;}).join('')||'<p class="empty-note">背包中沒有可強化裝備</p>';if(mode==='dismantle')body=Object.entries(counts).map(([id,n])=>{const i=equipment.find(x=>x.id===id),base=i.rarity==='epic'?8:i.rarity==='rare'?4:2,bonus=1+(state.facilities.forgehouse>=2?.25:0);return `<div class="forge-row rarity-${i.rarity}"><div><b>${i.name}</b><span>持有 ${n} · 分解獲得鐵屑 ${Math.floor(base*bonus)}${i.rarity!=='common'?'、灰燼精華 '+Math.max(1,Math.floor(base/2*bonus)):''}</span></div><button data-dismantle="${id}">分解 1 件</button></div>`;}).join('')||'<p class="empty-note">背包中沒有可分解裝備</p>';$('modal').classList.add('open');$('modal').setAttribute('aria-hidden','false');$('modalTitle').textContent='鐵匠鋪';$('modalBody').innerHTML=`<div class="forge-tabs"><button data-forge-tab="craft" class="${mode==='craft'?'active':''}">製作</button><button data-forge-tab="upgrade" class="${mode==='upgrade'?'active':''}">強化</button><button data-forge-tab="dismantle" class="${mode==='dismantle'?'active':''}">分解</button></div><div class="forge-list">${body}</div>`;document.querySelectorAll('[data-forge-tab]').forEach(b=>b.addEventListener('click',()=>openForge(b.dataset.forgeTab)));document.querySelectorAll('[data-craft]').forEach(b=>b.addEventListener('click',()=>craftGear(b.dataset.craft)));document.querySelectorAll('[data-upgrade-gear]').forEach(b=>b.addEventListener('click',()=>upgradeGear(b.dataset.upgradeGear)));document.querySelectorAll('[data-dismantle]').forEach(b=>b.addEventListener('click',()=>dismantleGear(b.dataset.dismantle)));}
  function craftGear(id){const item=equipment.find(i=>i.id===id),cost=item&&craftCost(item);if(!item||!canPayMaterials(cost))return;payMaterials(cost);state.inventory.push(id);discover('equipment',id);progressDaily('craft');save();openForge('craft');renderGuild();tone(690,.12);toast(`製作完成：${item.name}`);}
  function upgradeGear(id){const item=equipment.find(i=>i.id===id),lv=state.gearLevels[id]||0;if(!item||lv>=5)return;const cost={scrap:5+lv*4,essence:item.rarity==='common'?0:2+lv,bossCore:item.rarity==='epic'&&lv>=2?1:0};if(!canPayMaterials(cost))return;payMaterials(cost);state.gearLevels[id]=lv+1;progressDaily('craft');save();openForge('upgrade');renderGuild();tone(760,.14);}
  function dismantleGear(id){const index=state.inventory.indexOf(id),item=equipment.find(i=>i.id===id);if(index<0||!item)return;state.inventory.splice(index,1);const base=item.rarity==='epic'?8:item.rarity==='rare'?4:2,bonus=1+(state.facilities.forgehouse>=2?.25:0);state.materials.scrap+=Math.floor(base*bonus);if(item.rarity!=='common')state.materials.essence+=Math.max(1,Math.floor(base/2*bonus));progressDaily('dismantle');save();openForge('dismantle');renderGuild();tone(320,.1);}

  function toggleParty(id){
    if(state.activeParty.includes(id)){if(state.activeParty.length<=1)return toast('隊伍至少保留一人');state.activeParty=state.activeParty.filter(x=>x!==id);}
    else {if(state.activeParty.length>=3)return toast('遠征隊最多三人，請先移出一名角色');state.activeParty.push(id);}
    save();renderGuild();
  }

  function openParty(){const owned=state.heroes.filter(h=>h.owned);$('modal').classList.add('open');$('modal').setAttribute('aria-hidden','false');$('modalTitle').textContent='遠征隊伍與出戰順序';$('modalBody').innerHTML=`<p>第 1 位會最先行動。每名角色完成行動後依序輪替。</p><div class="party-order">${state.activeParty.map((id,index)=>{const h=state.heroes.find(x=>x.id===id);return `<article><b>${index+1}</b><span style="--accent:${h.color}">${h.icon}</span><div><strong>${h.name}</strong><small>${h.job}</small></div><button data-party-up="${id}" ${index===0?'disabled':''}>↑</button><button data-party-down="${id}" ${index===state.activeParty.length-1?'disabled':''}>↓</button><button data-party-remove="${id}">移出</button></article>`;}).join('')}</div><span class="eyebrow">AVAILABLE</span><div class="party-bench">${owned.filter(h=>!state.activeParty.includes(h.id)).map(h=>`<button data-party-add="${h.id}" ${state.activeParty.length>=3?'disabled':''}>${h.name} · ${h.job}</button>`).join('')||'<small>所有成員都已編入隊伍</small>'}</div>`;document.querySelectorAll('[data-party-up]').forEach(b=>b.addEventListener('click',()=>moveParty(b.dataset.partyUp,-1)));document.querySelectorAll('[data-party-down]').forEach(b=>b.addEventListener('click',()=>moveParty(b.dataset.partyDown,1)));document.querySelectorAll('[data-party-remove]').forEach(b=>b.addEventListener('click',()=>{toggleParty(b.dataset.partyRemove);openParty();}));document.querySelectorAll('[data-party-add]').forEach(b=>b.addEventListener('click',()=>{toggleParty(b.dataset.partyAdd);openParty();}));}
  function moveParty(id,dir){const i=state.activeParty.indexOf(id),j=i+dir;if(i<0||j<0||j>=state.activeParty.length)return;[state.activeParty[i],state.activeParty[j]]=[state.activeParty[j],state.activeParty[i]];save();openParty();renderGuild();tone(520);}

  function openAttributes(heroId){const h=state.heroes.find(x=>x.id===heroId);if(!h)return;const attrs=[['vitality','體魄','每點生命 +6'],['might','力量','每點威力 +2'],['focus','專注','每 3 點技能點上限 +1']];$('modal').classList.add('open');$('modal').setAttribute('aria-hidden','false');$('modalTitle').textContent=`${h.name} · 能力培養`;$('modalBody').innerHTML=`<p>可用能力點：<b>${h.attributePoints||0}</b>。能力配置為永久成長。</p><div class="attribute-list">${attrs.map(([id,name,desc])=>`<article><div><b>${name}</b><span>${desc}</span></div><strong>${h.attributes[id]||0}</strong><button data-add-attribute="${id}" ${(h.attributePoints||0)<=0?'disabled':''}>＋</button></article>`).join('')}</div>`;document.querySelectorAll('[data-add-attribute]').forEach(b=>b.addEventListener('click',()=>addAttribute(heroId,b.dataset.addAttribute)));}
  function addAttribute(heroId,id){const h=state.heroes.find(x=>x.id===heroId);if(!h||!['vitality','might','focus'].includes(id)||(h.attributePoints||0)<=0)return;h.attributePoints--;h.attributes[id]=(h.attributes[id]||0)+1;save();openAttributes(heroId);renderGuild();tone(660);}

  function scaledHero(h) {
    const spec=specInfo(h);
    const gear=Object.values(h.equipment||{}).map(id=>equipment.find(i=>i.id===id)).filter(Boolean);
    const gearHp=gear.reduce((n,i)=>n+(i.hp||0)+(state.gearLevels[i.id]||0)*2,0), gearPower=gear.reduce((n,i)=>n+(i.power||0)+(state.gearLevels[i.id]||0),0), gearSp=gear.reduce((n,i)=>n+(i.sp||0),0);
    const captain=state.activeParty.includes('tor')&&state.heroes.find(x=>x.id==='tor')?.specialization==='captain';
    const specPower={breaker:3,deadeye:4,storm:4,inquisitor:4,vanguard:3}[spec?.id]||0;
    const specHp=(spec?.id==='bulwark'?20:0)+(spec?.id==='saint'?10:0)+(captain?8:0);
    return { ...h, skills:h.skills.filter(s=>(h.activeSkills||h.skills.slice(0,4).map(x=>x.id)).includes(s.id)), maxHp: Math.max(20,h.maxHp + (h.level - 1) * 5 +(h.attributes?.vitality||0)*6+specHp+gearHp+(h.injury?.hp||0)), maxSp:Math.max(1,h.maxSp+gearSp+Math.floor((h.attributes?.focus||0)/3)+(h.injury?.sp||0)), power: Math.max(3,h.power + (h.level - 1) * 2 +(h.attributes?.might||0)*2+specPower+gearPower+(h.injury?.power||0)) };
  }

  function openSpecialization(heroId) {
    const hero=state.heroes.find(h=>h.id===heroId); if(!hero||hero.specialization||hero.level<3)return;
    $('modal').classList.add('open'); $('modal').setAttribute('aria-hidden','false'); $('modalTitle').textContent=`${hero.name}的職業專精`;
    $('modalBody').innerHTML=`<p>專精是永久選擇，會改變角色的核心優勢。</p><div class="spec-grid">${specializations[heroId].map(s=>`<button class="spec-choice" data-spec-choice="${s.id}"><span>${s.symbol}</span><b>${s.name}</b><small>${s.desc}</small></button>`).join('')}</div>`;
    document.querySelectorAll('[data-spec-choice]').forEach(b=>b.addEventListener('click',()=>chooseSpecialization(heroId,b.dataset.specChoice)));
  }

  function chooseSpecialization(heroId,specId) {
    const hero=state.heroes.find(h=>h.id===heroId); const spec=specializations[heroId]?.find(s=>s.id===specId); if(!hero||!spec||hero.specialization)return;
    hero.specialization=specId; save(); closeModal(); renderGuild(); tone(760,.16); toast(`${hero.name}成為${spec.name}`);
  }

  function openEquipment(heroId){
    const hero=state.heroes.find(h=>h.id===heroId&&h.owned);if(!hero)return;
    $('modal').classList.add('open');$('modal').setAttribute('aria-hidden','false');$('modalTitle').textContent=`${hero.name}的裝備`;
    const slots=['weapon','armor','charm'];
    const equipped=slots.map(slot=>{const item=equipment.find(i=>i.id===hero.equipment?.[slot]);return `<div class="gear-slot ${item?`rarity-${item.rarity}`:''}"><span>${slotName(slot)}</span>${item?`<b>${item.name}</b><em>${rarityName(item)}</em><small>${item.desc}</small><button data-unequip="${slot}">卸下</button>`:'<b>— 空欄位 —</b>'}</div>`;}).join('');
    const counts=state.inventory.reduce((m,id)=>(m[id]=(m[id]||0)+1,m),{});
    const usable=Object.keys(counts).map(id=>equipment.find(i=>i.id===id)).filter(i=>i&&(!i.jobs||i.jobs.includes(hero.job)));
    $('modalBody').innerHTML=`<div class="gear-slots">${equipped}</div><span class="eyebrow">可裝備物品</span><div class="inventory-list">${usable.map(i=>`<button class="inventory-item rarity-${i.rarity}" data-equip="${i.id}"><b>${i.name}${counts[i.id]>1?` ×${counts[i.id]}`:''} <em>${rarityName(i)}</em></b><span>${slotName(i.slot)} · ${i.desc}</span></button>`).join('')||'<p class="empty-note">背包中沒有此角色可使用的裝備</p>'}</div>`;
    document.querySelectorAll('[data-equip]').forEach(b=>b.addEventListener('click',()=>equipItem(heroId,b.dataset.equip)));
    document.querySelectorAll('[data-unequip]').forEach(b=>b.addEventListener('click',()=>unequipItem(heroId,b.dataset.unequip)));
  }

  function equipItem(heroId,itemId){const hero=state.heroes.find(h=>h.id===heroId);const item=equipment.find(i=>i.id===itemId);const index=state.inventory.indexOf(itemId);if(!hero||!item||index<0||item.jobs&&!item.jobs.includes(hero.job))return;if(hero.equipment[item.slot])state.inventory.push(hero.equipment[item.slot]);hero.equipment[item.slot]=itemId;state.inventory.splice(index,1);save();openEquipment(heroId);renderGuild();tone(600);}
  function unequipItem(heroId,slot){const hero=state.heroes.find(h=>h.id===heroId);const id=hero?.equipment?.[slot];if(!hero||!id)return;state.inventory.push(id);hero.equipment[slot]=null;save();openEquipment(heroId);renderGuild();}

  function trainedSkill(hero,base){const rank=hero.skillRanks?.[base.id]||0;const skill={...base,rank};if(rank>=1){['damage','heal','healAll','shield','stagger'].forEach(k=>{if(skill[k])skill[k]=typeof skill[k]==='number'?Math.round(skill[k]*1.15*100)/100:skill[k];});}if(rank>=2)skill.cost=Math.max(0,skill.cost-1);return skill;}
  function openTraining(heroId){
    const hero=state.heroes.find(h=>h.id===heroId&&h.owned);if(!hero)return;
    $('modal').classList.add('open');$('modal').setAttribute('aria-hidden','false');$('modalTitle').textContent=`${hero.name}的技能配置`;
    const active=hero.activeSkills||hero.skills.slice(0,4).map(s=>s.id);
    const slots=active.map((id,index)=>`<label>技能欄 ${index+1}<select data-skill-slot="${index}">${hero.skills.map(s=>`<option value="${s.id}" ${s.id===id?'selected':''}>${s.name}</option>`).join('')}</select></label>`).join('');
    $('modalBody').innerHTML=`<p>從六項技能中配置四項出戰技能。升級消耗戰技殘頁，第二階另需首領核心。</p><div class="material-inline">戰技殘頁 <b>${state.materials.skillDust}</b>　首領核心 <b>${state.materials.bossCore}</b></div><div class="loadout-grid">${slots}</div><article class="ultimate-preview"><span>絕招</span><b>${hero.ultimate.name}</b><small>${hero.ultimate.desc}</small></article><div class="training-list">${hero.skills.map(s=>{const rank=hero.skillRanks?.[s.id]||0,cost=skillUpgradeCost(rank);return `<div class="training-skill"><div><b>${s.name}</b><span>${s.desc}</span></div><em>${'◆'.repeat(rank)}${'◇'.repeat(2-rank)}</em><button data-upgrade-skill="${s.id}" ${rank>=2||!canPayMaterials(cost)?'disabled':''}>${rank>=2?'精通':costText(cost)}</button></div>`;}).join('')}</div>`;
    document.querySelectorAll('[data-upgrade-skill]').forEach(b=>b.addEventListener('click',()=>upgradeSkill(heroId,b.dataset.upgradeSkill)));
    document.querySelectorAll('[data-skill-slot]').forEach(s=>s.addEventListener('change',()=>setSkillSlot(heroId,+s.dataset.skillSlot,s.value)));
  }
  function setSkillSlot(heroId,index,skillId){const hero=state.heroes.find(h=>h.id===heroId);if(!hero||!hero.skills.some(s=>s.id===skillId))return;if(hero.activeSkills.some((id,i)=>id===skillId&&i!==index)){toast('同一技能不能重複裝備');return openTraining(heroId);}hero.activeSkills[index]=skillId;save();openTraining(heroId);tone(540);}
  function skillUpgradeCost(rank){const factor=1-(state.facilities.training||0)*.1;return {skillDust:Math.max(1,Math.ceil((rank?10:4)*factor)),bossCore:rank?1:0};}
  function upgradeSkill(heroId,skillId){const hero=state.heroes.find(h=>h.id===heroId);const rank=hero?.skillRanks?.[skillId]||0,cost=skillUpgradeCost(rank);if(!hero||rank>=2||!canPayMaterials(cost))return;payMaterials(cost);hero.skillRanks[skillId]=rank+1;save();openTraining(heroId);renderGuild();tone(700);}

  function startExpedition(id) {
    const contract = state.contracts.find(c => c.id === id); if (!contract) return;
    if(state.activeParty.length!==3)return toast('請先編成三人遠征隊');
    const selected=state.activeParty.map(id=>state.heroes.find(h=>h.id===id&&h.owned)).filter(Boolean);if(selected.length!==3)return toast('隊伍資料異常，請重新編成');
    discover('zones',contract.zone);
    expedition = { contract, node: 0, total: contract.nodes, modifier: dailyModifier().id, relics: [], lootItems:[], party: selected.map(h => {const scaled=scaledHero(h);return { ...scaled, hp: scaled.maxHp, sp: scaled.maxSp, shield: 0, burn: 0, poison: 0, vulnerable: 0, taunt: false, ultCharge:0, counter:0, dodge:false, regenTurns:0, regenAmount:0, laststandUsed:false };}), earned: 0 };
    state.stats.expeditions++; save();
    $('guildView').classList.remove('active'); $('expeditionView').classList.add('active'); $('expeditionTitle').textContent = `${contract.zone} · ${contract.title}`;
    renderRoute(); showNode();
  }

  function renderRoute() {
    $('route').innerHTML = Array.from({ length: expedition.total }, (_, i) => `<span class="${i < expedition.node ? 'done' : i === expedition.node ? 'current' : ''}"></span>`).join('');
  }

  function showNode() {
    renderRoute();
    if (expedition.node >= expedition.total) return finishExpedition();
    if(expedition.node===expedition.total-1){expedition.encounter='final';return startCombat();}
    showRouteChoice();
  }

  function showRouteChoice(){
    const alternatives=[
      {id:'elite',symbol:'!',name:'精英蹤跡',desc:'必定遭遇帶有特性的敵人；金幣與裝備掉落率提高。',risk:'高風險'},
      {id:'event',symbol:'?',name:'未知岔路',desc:'可能獲得資源、恢復或遭遇交換事件。',risk:'未知'},
      {id:'camp',symbol:'△',name:'荒廢營地',desc:'安全休整，恢復生命與少量氣勢，但會消耗一個節點。',risk:'安全'}
    ];
    const options=[{id:'skirmish',symbol:'×',name:'巡邏路線',desc:'敵人數量較少，報酬與風險穩定。',risk:'一般'},pick(alternatives)];
    if(state.facilities.scouts>=2){const extra=alternatives.find(x=>!options.some(o=>o.id===x.id));if(extra)options.push(extra);}
    $('eventStage').innerHTML=`<article class="event-card route-choice"><span class="eyebrow">CHOOSE YOUR PATH · ${expedition.node+1}/${expedition.total}</span><h2>決定下一段路線</h2><p>路線會改變遭遇與收益。終點必定是區域威脅。</p><div class="route-options">${options.map(o=>`<button data-route-choice="${o.id}"><i>${o.symbol}</i><span>${o.risk}</span><b>${o.name}</b><small>${o.desc}</small></button>`).join('')}</div></article>`;
    document.querySelectorAll('[data-route-choice]').forEach(b=>b.addEventListener('click',()=>chooseRoute(b.dataset.routeChoice)));
  }
  function chooseRoute(type){expedition.encounter=type;if(type==='event')return showEvent();if(type==='camp'){expedition.party.filter(h=>h.hp>0).forEach(h=>{h.hp=Math.min(h.maxHp,h.hp+18);h.ultCharge=Math.min(100,h.ultCharge+10);h.poison=0;});return nextNode('隊伍在營地休整，恢復生命與氣勢');}startCombat();}

  function showEvent() {
    const chain=chainEvent();
    const events = [
      { symbol: '✦', title: '廢棄營火', text: '灰裡仍藏著溫度。休息能恢復生命，但附近也許有人監視。', options: [
        { label: '紮營休息', action: () => { const amount=expedition.party.some(h=>h.specialization==='pathfinder')?30:22; expedition.party.forEach(h => h.hp = Math.min(h.maxHp, h.hp + amount)); nextNode(`隊伍恢復了 ${amount} 生命`); } },
        { label: '搜索物資', action: () => { const g = rand(12, 28); expedition.earned += g; nextNode(`找到 ${g} 金幣`); } }
      ]},
      { symbol: '?', title: '戴面具的旅人', text: '旅人提出交易：用一份補給換取他手中的古老護符。', options: [
        { label: state.supplies > 0 ? '交換補給' : '補給不足', disabled: state.supplies <= 0, action: () => { state.supplies--; expedition.party.forEach(h => h.power += 2); nextNode('護符令全隊威力提升'); } },
        { label: '禮貌離開', action: () => nextNode('你們繼續趕路') }
      ]}
    ];
    const e = chain||pick(events);
    $('eventStage').innerHTML = `<article class="event-card"><div class="event-symbol">${e.symbol}</div><span class="eyebrow">旅途事件</span><h2>${e.title}</h2><p>${e.text}</p><div class="event-options">${e.options.map((o,i) => `<button class="action-btn" data-option="${i}" ${o.disabled?'disabled':''}>${o.label}</button>`).join('')}</div></article>`;
    document.querySelectorAll('[data-option]').forEach(b => b.addEventListener('click', () => e.options[+b.dataset.option].action()));
  }

  function chainEvent(){
    const zone=expedition.contract.zone;const stage=state.chains[zone]||0;
    if(stage>=2||Math.random()>.55)return null;
    const data={
      '狼煙丘陵':[
        {symbol:'車',title:'翻覆的商車',text:'車輪還在轉，貨主卻不見蹤影。地上有兩組腳印。',options:[{label:'沿腳印追查',action:()=>{state.chains[zone]=1;expedition.earned+=10;nextNode('找到商隊徽記，線索將延續到下次事件');}},{label:'先救回貨物',action:()=>{expedition.earned+=28;nextNode('取回能用的貨物，但線索就此中斷');}}]},
        {symbol:'旗',title:'流寇的白旗',text:'先前的徽記讓流寇認出你們。他們願交還人質，條件是放棄懸賞。',options:[{label:'交換人質',action:()=>{state.chains[zone]=2;state.regions[zone].threat=clamp(state.regions[zone].threat-12,0,100);addChronicle('救回狼煙丘陵失蹤的商旅，流寇勢力暫時退讓。');nextNode('人質獲救，丘陵威脅下降');}},{label:'拒絕並取走懸賞',action:()=>{state.chains[zone]=2;expedition.earned+=45;state.regions[zone].threat=clamp(state.regions[zone].threat+8,0,100);nextNode('獲得懸賞，但流寇開始報復');}}]}
      ],
      '腐根沼地':[
        {symbol:'苔',title:'會呼吸的藥圃',text:'夜光苔圍著一具仍有心跳的樹根生長。',options:[{label:'留下樣本觀察',action:()=>{state.chains[zone]=1;expedition.party.forEach(h=>h.hp=Math.min(h.maxHp,h.hp+12));nextNode('藥苔恢復了隊伍，研究仍可繼續');}},{label:'全部採走',action:()=>{expedition.earned+=32;nextNode('藥材價值不菲，但藥圃已枯萎');}}]},
        {symbol:'芽',title:'沼地的新芽',text:'被保留下來的樹根結出淨化孢子，足以改變整片水域。',options:[{label:'散播孢子',action:()=>{state.chains[zone]=2;state.regions[zone].threat=clamp(state.regions[zone].threat-16,0,100);addChronicle('公會協助淨化腐根沼地，夜光苔重新生長。');nextNode('沼地生態逐漸恢復');}},{label:'製成珍稀藥劑',action:()=>{state.chains[zone]=2;state.supplies=Math.min(5,state.supplies+2);nextNode('製成兩份遠征補給');}}]}
      ]
    };
    return data[zone]?.[stage]||null;
  }

  function nextNode(message) { toast(message); expedition.node++; renderRoute(); setTimeout(showNode, 500); }

  function startCombat() {
    const c = expedition.contract;const encounter=expedition.encounter||'skirmish'; const count = encounter==='skirmish'?Math.min(2,c.risk):c.risk === 1 ? rand(1,2) : rand(2, Math.min(3,c.risk));
    let types = Array.from({ length: count }, () => pick(c.pool));
    if (expedition.node === expedition.total - 1 && c.risk === 3) types = ['warden'];
    const enemies = types.map((type, i) => {
      const t = enemyTemplates[type]; const scale = 1 + (state.day - 1) * .025; const hpScale = expedition.modifier === 'fortified' ? 1.15 : 1;
      const maxHp = Math.round(t.hp * scale * hpScale);
      const seasonalElite=currentSeason().id==='beast'?.12:currentSeason().id==='longnight'&&expedition.node===expedition.total-1?.18:0;
      const threatElite=(state.regions[c.zone]?.threat||0)/500;
      const eliteChance=encounter==='elite'?1:(c.risk===3?.55:c.risk===2?.28:0)+(difficulties[state.difficulty]?.elite||0)+seasonalElite+threatElite; const affix=!t.boss&&Math.random()<eliteChance?pick(eliteAffixes):null;
      return { ...t, power: t.power + (expedition.modifier === 'cruel' ? 2 : 0), id: `${type}-${i}`, type, maxHp, hp: maxHp, stagger: 0, shield: 0, burn: 0, vulnerable: 0, stunned: 0, intent: null, affix, affixTriggered:false, phase2:false };
    });
    types.forEach(type=>discover('enemies',type));save();
    expedition.party.forEach(h => {
      h.shield = (expedition.relics.includes('ward') ? 8 : 0)+(hasTrait(h,'warding')?10:0);
      h.focusUsed=false; h.evasionUsed=false;h.counter=0;h.dodge=false;h.regenTurns=0;
      if (expedition.modifier === 'tailwind') h.sp = Math.min(h.maxSp, h.sp + 1);
      if (h.specialization === 'vanguard') h.sp = Math.min(h.maxSp, h.sp + 1);
    });
    if(expedition.party.some(h=>hasTrait(h,'command'))) expedition.party.forEach(h=>h.sp=Math.min(h.maxSp,h.sp+1));
    combat = { enemies, heroIndex: 0, round: 1, encounter, heroTurns:0, log: [encounter==='elite'?'你們循跡找到精英敵人。':'遭遇敵人。先觀察他們的行動意圖。'], locked: false };
    planIntents(); beginHeroTurn();
  }

  function planIntents() {
    const special=difficulties[state.difficulty]?.special||0;
    combat.enemies.filter(e => e.hp > 0).forEach(e => {
      if(e.affix?.id==='regenerator'&&e.hp<e.maxHp)e.hp=Math.min(e.maxHp,e.hp+6);
      if(e.affix?.id==='armored')e.shield+=8;
      if(e.boss&&!e.phase2&&e.hp<=e.maxHp*.5){e.phase2=true;combat.log.push(`${e.name}進入第二階段：攻擊模式改變！`);}
      if (e.stunned > 0) e.intent = { type: 'stunned', label: '破勢：無法行動' };
      else if(e.boss&&e.phase2) e.intent={type:'cleave',value:9+combat.round,label:`橫掃全隊 ${9+combat.round}`};
      else if(e.type==='cultist'&&Math.random()<.42+special) e.intent={type:'empower',value:2,label:'戰意儀式'};
      else if(e.type==='golem'&&Math.random()<.42+special) e.intent={type:'guard',value:16,label:'岩盾守護'};
      else if(e.type==='bandit'&&Math.random()<.35+special) e.intent={type:'sunder',value:7,label:'破盾斬 7'};
      else if (e.healer && combat.enemies.some(a=>a.hp>0&&a.hp<a.maxHp) && Math.random()<.6) e.intent = { type: 'heal', value: 14, label: '聚光治療' };
      else if (e.venomous && Math.random()<.48) e.intent = { type: 'venom', value: 6, label: '毒牙 6＋中毒' };
      else if (e.support && Math.random() < .38) e.intent = { type: 'shield', value: 10 + combat.round * 2, label: '邪術護盾' };
      else if(e.affix?.id==='frenzied'&&e.hp<=e.maxHp*.5)e.intent={type:'heavy',value:Math.round(e.power*1.65),label:`狂怒重擊 ${Math.round(e.power*1.65)}`};
      else if(e.type==='wolf'&&combat.enemies.filter(x=>x.hp>0&&x.type==='wolf').length>1)e.intent={type:'attack',value:e.power+3,label:`狼群夾擊 ${e.power+3}`};
      else if (Math.random() < .28) e.intent = { type: 'heavy', value: Math.round(e.power * 1.55), label: `蓄力 ${Math.round(e.power * 1.55)}` };
      else e.intent = { type: 'attack', value: e.power + rand(-2,2), label: `攻擊 ${e.power}` };
    });
  }

  function beginHeroTurn() {
    while (combat.heroIndex < expedition.party.length && expedition.party[combat.heroIndex].hp <= 0) combat.heroIndex++;
    if (combat.heroIndex >= expedition.party.length) return enemyTurn();
    const hero=expedition.party[combat.heroIndex];hero.sp = Math.min(hero.maxSp, hero.sp + 1);if(hero.regenTurns>0){hero.hp=Math.min(hero.maxHp,hero.hp+hero.regenAmount);hero.regenTurns--;combat.log.push(`${hero.name}受到持續恢復，回復 ${hero.regenAmount} 生命。`);}
    pendingSkill = null; renderCombat();
  }

  function renderCombat() {
    const active = expedition.party[combat.heroIndex];
    $('eventStage').innerHTML = `<div class="battle-layout"><section class="battlefield"><div class="enemy-zone">${combat.enemies.map(enemyHtml).join('')}</div><div class="party-strip">${expedition.party.map((h,i) => partyHtml(h,i)).join('')}</div></section><aside class="combat-ui"><section class="turn-card"><span class="eyebrow">ROUND ${combat.round}</span><h2>${active ? `${active.name}的行動` : '敵方行動'}</h2><p>${pendingSkill ? `選擇「${pendingSkill.name}」的目標` : '選擇技能。技能點會在每次行動開始時恢復 1 點。'}</p></section><div class="skills">${active ? active.skills.map(s=>skillHtml(trainedSkill(active,s))).join('')+ultimateHtml(active) : ''}</div><section class="log-card">${combat.log.slice(-8).reverse().map(x => `<p>${x}</p>`).join('')}</section></aside></div>`;
    document.querySelectorAll('[data-skill]').forEach(b => b.addEventListener('click', () => chooseSkill(b.dataset.skill)));
    document.querySelectorAll('[data-ultimate]').forEach(b=>b.addEventListener('click',()=>chooseUltimate()));
    document.querySelectorAll('[data-enemy]').forEach(b => b.addEventListener('click', () => { if (pendingSkill) executeSkill(pendingSkill, combat.enemies.find(e => e.id === b.dataset.enemy)); }));
  }

  function enemyHtml(e) {
    const hp = clamp(e.hp/e.maxHp*100,0,100), st = clamp(e.stagger/e.staggerMax*100,0,100);
    const intent=difficulties[state.difficulty]?.conceal?e.intent.label.replace(/\d+/g,'?'):e.intent.label;
    return `<article class="unit ${e.hp<=0?'dead':''} ${pendingSkill?.target==='enemy'&&e.hp>0?'targetable':''}" data-enemy="${e.id}" style="--accent:${e.color}"><span class="intent">${e.hp>0?intent:'倒下'}</span><div class="unit-icon">${e.icon}</div><h3>${e.name}${e.affix?` <em class="elite-tag">${e.affix.name}</em>`:''}${e.phase2?' <em class="phase-tag">Ⅱ</em>':''}</h3>${e.affix?`<small class="enemy-trait">${e.affix.desc}</small>`:''}<div class="numbers"><span>HP ${Math.max(0,e.hp)}/${e.maxHp}</span><span>${e.shield?`盾 ${e.shield}`:''}</span></div><div class="hp-track"><i style="width:${hp}%;background:var(--red)"></i></div><div class="numbers"><span>破勢</span><span>${e.stagger}/${e.staggerMax}</span></div><div class="stagger-track"><i style="width:${st}%"></i></div></article>`;
  }
  function partyHtml(h,i) { const hp=clamp(h.hp/h.maxHp*100,0,100); return `<article class="party-unit ${i===combat.heroIndex?'active':''} ${h.hp<=0?'dead':''}"><h4 style="color:${h.color}">${h.name} · ${h.job}</h4><div class="numbers"><span>HP ${Math.max(0,h.hp)}/${h.maxHp}</span><span>技能 ${h.sp}/${h.maxSp} ${h.shield?`· 盾 ${h.shield}`:''}${h.poison?` · 毒 ${h.poison}`:''}</span></div><div class="hp-track"><i style="width:${hp}%;background:${h.color}"></i></div><div class="ult-track" title="絕招氣勢 ${h.ultCharge}/100"><i style="width:${h.ultCharge}%"></i></div></article>`; }
  function skillCost(hero,skill){return Math.max(0,skill.cost-(hasTrait(hero,'focus')&&!hero.focusUsed&&skill.cost>0?1:0));}
  function skillHtml(s) { const h=expedition.party[combat.heroIndex],cost=skillCost(h,s); return `<button class="skill" data-skill="${s.id}" ${combat.locked||h.sp<cost?'disabled':''}><b>${s.name}</b><span>${s.desc}</span><small>${cost ? `${cost} 技能點` : '基礎行動'}${cost<s.cost?' · 專注':''}</small></button>`; }
  function ultimateHtml(hero){return `<button class="skill ultimate-skill" data-ultimate ${combat.locked||hero.ultCharge<100?'disabled':''}><b>✦ ${hero.ultimate.name}</b><span>${hero.ultimate.desc}</span><small>${hero.ultCharge>=100?'氣勢已滿 · 可發動':`氣勢 ${hero.ultCharge}/100`}</small></button>`;}

  function chooseSkill(id) {
    if (combat.locked) return; const hero = expedition.party[combat.heroIndex]; const base = hero.skills.find(s => s.id === id);const skill=base?trainedSkill(hero,base):null;if (!skill || hero.sp < skillCost(hero,skill)) return;
    if (skill.target === 'enemy') { pendingSkill = skill; tone(430); renderCombat(); }
    else executeSkill(skill);
  }
  function chooseUltimate(){const hero=expedition.party[combat.heroIndex];if(combat.locked||hero.ultCharge<100)return;progressDaily('ultimate');save();const skill={...hero.ultimate,isUltimate:true,cost:0};if(skill.target==='enemy'){pendingSkill=skill;tone(820,.12);renderCombat();}else executeSkill(skill);}

  function executeSkill(skill, target) {
    if (combat.locked) return; const hero = expedition.party[combat.heroIndex];const cost=skill.isUltimate?0:skillCost(hero,skill);if(skill.isUltimate)hero.ultCharge=0;else{hero.sp-=cost;if(cost<skill.cost)hero.focusUsed=true;}combat.locked = true;
    const targets = skill.target === 'enemies' ? combat.enemies.filter(e=>e.hp>0) : target ? [target] : [];
    targets.forEach(e => damageEnemy(hero, e, skill));
    if (skill.shield && skill.target === 'allies') expedition.party.filter(h=>h.hp>0).forEach(h=>h.shield+=skill.shield+(hero.specialization==='bulwark'?5:0));
    if (skill.shield && skill.target === 'self') hero.shield += skill.shield;
    if (skill.taunt) hero.taunt = true;
    if(skill.counter)hero.counter=skill.counter;
    if(skill.dodge)hero.dodge=true;
    if(skill.restoreSelf)hero.sp=Math.min(hero.maxSp,hero.sp+skill.restoreSelf);
    if (skill.restoreAll) expedition.party.filter(h=>h.hp>0).forEach(h=>h.sp=Math.min(h.maxSp,h.sp+skill.restoreAll));
    const healBoost = (expedition.relics.includes('ember') ? 1.35 : 1) * (hero.specialization==='hearth'?1.3:1) * (hero.specialization==='saint'?1.25:1);
    if(skill.reviveAll)expedition.party.filter(h=>h.hp<=0).forEach(h=>{h.hp=Math.max(1,Math.round(h.maxHp*skill.reviveAll));combat.log.push(`${h.name}重新站了起來！`);});
    if (skill.heal) { const ally=[...expedition.party].filter(h=>h.hp>0).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0]; const amount=Math.min(Math.round(skill.heal*healBoost),ally.maxHp-ally.hp); ally.hp+=amount; combat.log.push(`${hero.name}使${ally.name}恢復 ${amount} 生命。`); }
    if (skill.healAll) expedition.party.filter(h=>h.hp>0).forEach(h=>h.hp=Math.min(h.maxHp,h.hp+Math.round(skill.healAll*healBoost)));
    if(skill.cleanseAll)expedition.party.forEach(h=>h.poison=0);
    if(skill.regenAll)expedition.party.filter(h=>h.hp>0).forEach(h=>{h.regenTurns=3;h.regenAmount=skill.regenAll;});
    if((skill.heal||skill.healAll)&&hasTrait(hero,'kindle'))hero.sp=Math.min(hero.maxSp,hero.sp+1);
    if (!skill.damage) combat.log.push(`${hero.name}使用了${skill.name}。`);
    if(!skill.isUltimate)hero.ultCharge=Math.min(100,hero.ultCharge+18);else combat.log.push(`${hero.name}發動絕招「${skill.name}」！`);
    tone(skill.damage ? 180 : 620, .09); pendingSkill = null;
    if(expedition.party.every(h=>h.hp<=0))return setTimeout(loseExpedition,300);
    if (combat.enemies.every(e=>e.hp<=0)) return setTimeout(winCombat, 450);
    combat.heroIndex++; combat.locked = false; setTimeout(beginHeroTurn, 280);
  }

  function damageEnemy(hero, enemy, skill) {
    let specDamage=hero.specialization==='deadeye'&&skill.id==='pierce'?1.2:1;
    if(hero.specialization==='duelist'&&skill.target==='enemy')specDamage*=1.15;
    if(hero.specialization==='dancer'&&skill.target==='enemies')specDamage*=1.2;
    if(skill.statusScale)specDamage*=1+([enemy.vulnerable>0,enemy.burn>0,enemy.stunned>0].filter(Boolean).length*.2);
    if(skill.ultimateExecute&&enemy.hp<=enemy.maxHp*.5)specDamage*=1.35;
    if(hasTrait(hero,'opening')&&combat.round===1)specDamage*=1.25;
    if(hasTrait(hero,'execute')&&enemy.hp<=enemy.maxHp*.35)specDamage*=1.3;
    const raw = Math.round(hero.power * skill.damage * specDamage * (.9 + Math.random()*.2)); const armor = skill.pierce ? 0 : enemy.armor; let dmg=Math.max(1,raw-armor);
    if (enemy.vulnerable>0) dmg=Math.round(dmg*1.35);
    if (enemy.stagger>=enemy.staggerMax*.5 && expedition.relics.includes('hunter')) dmg=Math.round(dmg*1.3);
    const absorbed = Math.min(enemy.shield, dmg); enemy.shield -= absorbed; dmg -= absorbed; enemy.hp -= dmg;
    let stagger=skill.stagger || 4;
    if(hero.specialization==='breaker') stagger=Math.round(stagger*1.25);
    if(hero.specialization==='storm'&&skill.id==='nova') stagger+=8;
    if(hero.specialization==='inquisitor') stagger+=5;
    if(hasTrait(hero,'resolve')&&hero.hp<=hero.maxHp*.5)stagger=Math.round(stagger*1.3);
    enemy.stagger += stagger; if (skill.vulnerable) enemy.vulnerable=skill.vulnerable; if(skill.burn) enemy.burn=skill.burn;if(skill.weaken)enemy.power=Math.max(1,enemy.power-skill.weaken);
    if(skill.burn&&hasTrait(hero,'wildfire')){const other=combat.enemies.find(e=>e.hp>0&&e!==enemy);if(other)other.burn=Math.max(other.burn,1);}
    combat.log.push(`${hero.name}以${skill.name}對${enemy.name}造成 ${dmg} 傷害${absorbed ? `（護盾吸收 ${absorbed}）` : ''}。`);
    if(enemy.stagger>=enemy.staggerMax&&enemy.hp>0){enemy.stagger=0;enemy.stunned=1;if(hasTrait(hero,'momentum'))hero.sp=Math.min(hero.maxSp,hero.sp+1);if(hasTrait(hero,'aftershock'))combat.enemies.filter(e=>e.hp>0&&e!==enemy).forEach(e=>{e.hp-=5;resolveEnemyDeath(e);});combat.log.push(`${enemy.name}被破勢，本輪無法行動！`);}
    resolveEnemyDeath(enemy,hero);
  }

  function resolveEnemyDeath(enemy,killer){if(enemy.hp>0||enemy.affixTriggered)return;enemy.affixTriggered=true;if(killer&&hasTrait(killer,'hunt'))killer.hp=Math.min(killer.maxHp,killer.hp+4);if(enemy.affix?.id==='volatile'){expedition.party.filter(h=>h.hp>0).forEach(h=>hurtHero(h,5,true));combat.log.push(`${enemy.name}爆裂，對全隊造成 5 傷害！`);}}

  function hurtHero(target,amount,bypassShield=false,attacker=null){
    if(target.dodge){target.dodge=false;amount=0;combat.log.push(`${target.name}完全閃避了攻擊！`);}
    else if(hasTrait(target,'evasion')&&!target.evasionUsed){target.evasionUsed=true;amount=Math.ceil(amount/2);}
    const absorbed=bypassShield?0:Math.min(target.shield,amount);target.shield-=absorbed;const damage=amount-absorbed;target.hp-=damage;
    if(target.hp<=0&&hasTrait(target,'laststand')&&!target.laststandUsed){target.laststandUsed=true;target.hp=1;combat.log.push(`${target.name}的不熄羽衣阻止了致命傷！`);}
    if(damage>0)target.ultCharge=Math.min(100,target.ultCharge+12);
    if(attacker&&target.counter>0&&attacker.hp>0){attacker.hp-=target.counter;combat.log.push(`${target.name}反擊造成 ${target.counter} 傷害。`);resolveEnemyDeath(attacker);target.counter=0;}
    return {damage,absorbed};
  }

  function enemyTurn() {
    combat.locked=true; renderCombat();
    setTimeout(() => {
      combat.enemies.forEach(e=>e.shield=0);
      for (const e of combat.enemies.filter(x=>x.hp>0)) {
        if(e.burn>0){const d=7;e.hp-=d;e.burn--;combat.log.push(`${e.name}受到 ${d} 點燃燒傷害。`);if(e.hp<=0){resolveEnemyDeath(e);continue;}}
        if(e.stunned>0){e.stunned--;combat.log.push(`${e.name}失去本輪行動。`);continue;}
        if(e.intent.type==='shield'){combat.enemies.filter(x=>x.hp>0).forEach(x=>x.shield+=e.intent.value);combat.log.push(`${e.name}為敵方施加護盾。`);continue;}
        if(e.intent.type==='heal'){const ally=[...combat.enemies].filter(x=>x.hp>0).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];const healed=Math.min(e.intent.value,ally.maxHp-ally.hp);ally.hp+=healed;combat.log.push(`${e.name}使${ally.name}恢復 ${healed} 生命。`);continue;}
        if(e.intent.type==='guard'){const ally=[...combat.enemies].filter(x=>x.hp>0).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];ally.shield+=e.intent.value;combat.log.push(`${e.name}為${ally.name}架起 ${e.intent.value} 岩盾。`);continue;}
        if(e.intent.type==='empower'){combat.enemies.filter(x=>x.hp>0&&x!==e).forEach(x=>x.power+=e.intent.value);combat.log.push(`${e.name}完成儀式，其他敵人威力提升！`);continue;}
        if(e.intent.type==='cleave'){expedition.party.filter(h=>h.hp>0).forEach(h=>hurtHero(h,e.intent.value,false,e));combat.log.push(`${e.name}橫掃全隊。`);continue;}
        const taunter=expedition.party.find(h=>h.hp>0&&h.taunt); const alive=expedition.party.filter(h=>h.hp>0); if(!alive.length)break;
        const target=taunter||pick(alive);if(e.intent.type==='sunder')target.shield=0;const hit=hurtHero(target,e.intent.value,false,e);
        if(e.intent.type==='venom'){target.poison=Math.max(target.poison,hasTrait(target,'antidote')?1:2);}
        combat.log.push(`${e.name}攻擊${target.name}，造成 ${hit.damage} 傷害${hit.absorbed?`（護盾吸收 ${hit.absorbed}）`:''}。`);
      }
      expedition.party.filter(h=>h.hp>0&&h.poison>0).forEach(h=>{hurtHero(h,4,true);h.poison--;combat.log.push(`${h.name}受到 4 點毒素傷害。`);});
      expedition.party.forEach(h=>{h.taunt=false;h.shield=0;}); combat.enemies.forEach(e=>{if(e.vulnerable>0)e.vulnerable--;});
      if(expedition.party.every(h=>h.hp<=0)) return loseExpedition();
      if(combat.enemies.every(e=>e.hp<=0)) return winCombat();
      combat.round++;combat.heroIndex=0;combat.locked=false;planIntents();beginHeroTurn();
    },550);
  }

  function winCombat() {
    let loot=rand(10,18)+expedition.contract.risk*4;
    if(combat?.encounter==='elite')loot+=14;
    if(expedition.modifier==='bounty') loot=Math.round(loot*1.5);
    if(expedition.modifier==='fortified') loot+=5;
    if(expedition.party.some(h=>h.specialization==='pathfinder')) loot=Math.round(loot*1.2);
    expedition.party.filter(h=>hasTrait(h,'purify')).forEach(h=>h.poison=0);
    const drop=rollEquipmentDrop();if(drop)expedition.lootItems.push(drop.id);
    if(combat?.encounter==='elite')progressDirective('elite');progressDaily('battle');
    expedition.earned+=loot; state.stats.wins++; combat=null; expedition.node++; renderRoute();
    toast(`戰鬥勝利，取得 ${loot} 金幣${drop?`與「${drop.name}」`:''}`);
    if(expedition.node < expedition.total) setTimeout(showRelicChoice, 420); else setTimeout(showNode, 420);
  }

  function rollEquipmentDrop(){
    const risk=expedition.contract.risk;const fortune=expedition.party.some(h=>hasTrait(h,'fortune'));const final=expedition.node===expedition.total-1;
    if(Math.random()>.1+risk*.09+(fortune ? .1 : 0)+(final ? .12 : 0)+(expedition.encounter==='elite' ? .16 : 0)+(currentSeason().id==='mire'?.08:0))return null;
    const roll=Math.random();let rarity=risk===3&&roll<.2?'epic':risk>=2&&roll<.62?'rare':'common';
    let pool=equipment.filter(i=>i.rarity===rarity);if(!pool.length)pool=equipment.filter(i=>i.rarity==='common');return pick(pool);
  }

  function showRelicChoice() {
    const choices=[...relics].sort(()=>Math.random()-.5).slice(0,3);
    $('eventStage').innerHTML=`<article class="event-card"><div class="event-symbol">◇</div><span class="eyebrow">EXPEDITION RELIC</span><h2>選擇遠征遺物</h2><p>只能帶走其中一件。效果會持續到本次遠征結束。</p><div class="relic-grid">${choices.map(r=>`<button class="relic" data-relic="${r.id}"><span class="relic-symbol">${r.symbol}</span><b>${r.name}</b><small>${r.desc}</small></button>`).join('')}</div></article>`;
    document.querySelectorAll('[data-relic]').forEach(b=>b.addEventListener('click',()=>takeRelic(b.dataset.relic)));
  }

  function takeRelic(id) {
    const relic=relics.find(r=>r.id===id); if(!relic)return;
    expedition.relics.push(id);
    if(id==='whetstone') expedition.party.forEach(h=>h.power+=3);
    if(id==='oak') expedition.party.forEach(h=>{h.maxHp+=12;h.hp+=12;});
    if(id==='quicksilver') expedition.party.forEach(h=>{h.maxSp+=1;h.sp=Math.min(h.maxSp,h.sp+1);});
    if(id==='ember') expedition.party.filter(h=>h.hp>0).forEach(h=>h.hp=Math.min(h.maxHp,h.hp+18));
    tone(690,.12); toast(`獲得遺物：${relic.name}`); setTimeout(showNode,320);
  }
  function finishExpedition() {
    const c=expedition.contract; const total=c.gold+expedition.earned; let earnedRenown=Math.round(c.renown*(expedition.modifier==='cruel'?1.25:1));if(c.crisis&&state.facilities.archive>=3)earnedRenown=Math.round(earnedRenown*1.2); state.gold+=total; state.renown+=earnedRenown; state.inventory.push(...expedition.lootItems);expedition.lootItems.forEach(id=>discover('equipment',id));const tradeBonus=currentSeason().id==='trade'?2:0,scrapGain=2+c.risk+tradeBonus,clothGain=1+c.risk+tradeBonus,dustGain=c.risk;state.materials.scrap+=scrapGain;state.materials.cloth+=clothGain;state.materials.skillDust+=dustGain;
    const region=state.regions[c.zone];region.cleared++;region.threat=clamp(region.threat-(c.crisis?38+(state.facilities.scouts>=3?8:0):18+c.risk*3),0,100);progressDirective('contract');progressDaily('contract');if(expedition.lootItems.length)progressDirective('gear',expedition.lootItems.length);
    let trophy='';if(c.crisis||c.risk===3){state.materials.bossCore++;const first=!state.trophies[c.zone];state.trophies[c.zone]=(state.trophies[c.zone]||0)+1;region.crises+=(c.crisis?1:0);trophy=`獲得「${c.zone}戰證」與首領核心`;if(first){const bonus=30+(state.facilities.archive||0)*10;state.gold+=bonus;trophy+=`，首勝陳列獎勵 ${bonus} 金幣`;}addChronicle(`遠征隊平定「${c.title}」，帶回第 ${state.trophies[c.zone]} 枚${c.zone}戰證。`);}
    if(c.crisis)progressDirective('crisis');else addChronicle(`完成${c.zone}契約「${c.title}」。`);
    advanceDay();const newInjuries=applyInjuries(false); state.stats.completed++;
    state.heroes.filter(h=>state.activeParty.includes(h.id)).forEach(h=>{h.xp+=18+c.risk*8;while(h.xp>=h.level*45){h.xp-=h.level*45;h.level++;h.attributePoints=(h.attributePoints||0)+1+(state.facilities.training>=2?1:0);}});syncRenownHeroes();
    state.contracts=[]; state.shopStock=[]; checkAchievements(); save();
    const lootNames=expedition.lootItems.map(id=>equipment.find(i=>i.id===id)?.name).filter(Boolean);
    $('eventStage').innerHTML=`<article class="event-card"><div class="event-symbol">✓</div><span class="eyebrow">CONTRACT COMPLETE</span><h2>${c.crisis?'危機解除':'遠征歸來'}</h2><p>${lootNames.length?`本次帶回裝備：${lootNames.join('、')}。`:'沒有發現可用裝備。'} 取得鐵屑 ${scrapGain}、韌布 ${clothGain}、戰技殘頁 ${dustGain}。${newInjuries.length?` ${newInjuries.join('、')}帶傷歸隊。`:' 隊員均平安歸隊。'}${trophy?` ${trophy}。`:''}</p><div class="event-options"><span><b>${total}</b> 金幣</span><span><b>${earnedRenown}</b> 聲望</span><span><b>${lootNames.length}</b> 件裝備</span><button class="action-btn" id="returnBtn">返回公會</button></div></article>`;
    $('returnBtn').addEventListener('click', returnGuild); tone(740,.18);
  }
  function advanceDay(){state.day++;const season=currentSeason();Object.entries(state.regions).forEach(([zone,r])=>{let growth=rand(3,7);if(season.id==='beast'&&(zone==='狼煙丘陵'||zone==='北風林線'))growth+=4;r.threat=clamp(r.threat+growth,0,100);});state.heroes.forEach(h=>{if(h.injury){h.injury.days--;if(h.injury.days<=0)h.injury=null;}});state.contracts=[];state.shopStock=[];ensureDirective();ensureDaily();}
  function applyInjuries(severe){const hurt=[];expedition.party.forEach(p=>{const hero=state.heroes.find(h=>h.id===p.id);const chance=severe ? .7 : (p.hp/p.maxHp<.3 ? .38 : 0);if(hero&&!hero.injury&&Math.random()<chance){hero.injury={...pick(injuries)};hurt.push(hero.name);}});return hurt;}
  function loseExpedition(){advanceDay();const hurt=applyInjuries(true);save();$('eventStage').innerHTML=`<article class="event-card"><div class="event-symbol">×</div><span class="eyebrow">EXPEDITION FAILED</span><h2>隊伍被迫撤退</h2><p>搜救隊在天亮前找到了眾人。${hurt.length?`${hurt.join('、')}受到傷勢，需要休養。`:'所幸無人留下長期傷勢。'}</p><button class="action-btn" id="returnBtn">返回公會</button></article>`;$('returnBtn').addEventListener('click',returnGuild);}
  function returnGuild(){expedition=null;combat=null;$('expeditionView').classList.remove('active');$('guildView').classList.add('active');renderGuild();window.scrollTo(0,0);}

  function openRecords() {
    checkAchievements(false);
    const unlocked=achievementDefs.filter(a=>state.achievements[a.id]).length;
    $('modal').classList.add('open'); $('modal').setAttribute('aria-hidden','false');
    $('modalTitle').textContent='公會紀錄冊';
    const trophyCount=Object.values(state.trophies).reduce((a,b)=>a+b,0);
    $('modalBody').innerHTML=`<div class="records-summary"><div class="record-stat"><b>${state.stats.expeditions}</b><small>遠征</small></div><div class="record-stat"><b>${state.stats.wins}</b><small>勝利</small></div><div class="record-stat"><b>${trophyCount}</b><small>頭目戰證</small></div></div><span class="eyebrow">BOSS TROPHIES</span><div class="trophy-grid">${contractSeeds.map(c=>`<div class="trophy ${state.trophies[c.zone]?'earned':''}"><b>${state.trophies[c.zone]||0}</b><small>${c.zone}戰證</small></div>`).join('')}</div><span class="eyebrow">ACHIEVEMENTS ${unlocked}/${achievementDefs.length}</span>${achievementDefs.map(a=>`<div class="achievement ${state.achievements[a.id]?'':'locked'}"><b>${state.achievements[a.id]?'✓ ':''}${a.name}</b><span>${a.desc}</span><em>${state.achievements[a.id]?`已領取 ${a.reward} G`:`獎勵 ${a.reward} G`}</em></div>`).join('')}<span class="eyebrow chronicle-title">GUILD CHRONICLE</span><div class="chronicle">${state.chronicle.length?state.chronicle.map(e=>`<p><b>第 ${e.day} 日</b>${e.text}</p>`).join(''):'<p>公會的故事將從下一次重要行動開始記錄。</p>'}</div>`;
  }

  function openCodex(){
    state.inventory.forEach(id=>discover('equipment',id));state.heroes.forEach(h=>Object.values(h.equipment||{}).filter(Boolean).forEach(id=>discover('equipment',id)));save();
    const enemyNotes={wolf:'成群時會發動夾擊，優先減少數量。',bandit:'會使用破盾斬，護盾隊伍需優先打斷。',shaman:'能為全體敵人施加護盾。',spider:'毒牙會留下持續傷害。',wisp:'會治療生命最低的敵人。',cultist:'儀式會永久提升同伴威力。',golem:'替受傷同伴架設岩盾。',warden:'半血後進入第二階段並橫掃全隊。'};
    const zones=[...new Set(contractSeeds.map(c=>c.zone))];
    $('modal').classList.add('open');$('modal').setAttribute('aria-hidden','false');$('modalTitle').textContent='邊境探索圖鑑';
    $('modalBody').innerHTML=`<div class="codex-progress"><b>${state.discovered.enemies.length}/${Object.keys(enemyTemplates).length}</b> 敵人　<b>${state.discovered.equipment.length}/${equipment.length}</b> 裝備　<b>${state.discovered.zones.length}/${zones.length}</b> 區域</div><span class="eyebrow">REGIONS</span><div class="codex-grid compact-codex">${zones.map(z=>`<article class="codex-entry ${state.discovered.zones.includes(z)?'':'unknown'}"><b>${state.discovered.zones.includes(z)?z:'未知區域'}</b></article>`).join('')}</div><span class="eyebrow">ENEMIES</span><div class="codex-grid">${Object.entries(enemyTemplates).map(([id,e])=>{const seen=state.discovered.enemies.includes(id);return `<article class="codex-entry ${seen?'':'unknown'}"><i>${seen?e.icon:'?'}</i><b>${seen?e.name:'未知敵人'}</b><small>${seen?enemyNotes[id]:'在遠征中遭遇後解鎖'}</small></article>`;}).join('')}</div><span class="eyebrow">EQUIPMENT</span><div class="codex-grid">${equipment.map(i=>{const seen=state.discovered.equipment.includes(i.id);return `<article class="codex-entry ${seen?`rarity-${i.rarity}`:'unknown'}"><b>${seen?i.name:'未知裝備'}</b><small>${seen?`${slotName(i.slot)} · ${i.desc}`:'購買或帶回公會後解鎖'}</small></article>`;}).join('')}</div>`;
  }

  function openSystem(){
    const saved=state.savedAt?new Date(state.savedAt).toLocaleString('zh-TW'):'尚未建立';
    $('modal').classList.add('open');$('modal').setAttribute('aria-hidden','false');$('modalTitle').textContent='系統與測試工具';
    $('modalBody').innerHTML=`<div class="system-status"><div><small>存檔版本</small><b>v${state.saveVersion||SAVE_VERSION}</b></div><div><small>最後儲存</small><b>${saved}</b></div><div><small>儲存位置</small><b>此瀏覽器</b></div></div><span class="eyebrow">SAVE MANAGEMENT</span><p>大型更新後建議先匯出備份。匯入會覆蓋目前進度；重置則會刪除本瀏覽器中的遊戲存檔。</p><div class="system-actions"><button class="action-btn" id="exportSaveBtn">匯出存檔</button><button class="action-btn secondary" id="importSaveBtn">匯入存檔</button><button class="action-btn danger-fill" id="resetSaveBtn">刪除並重開</button></div><input id="importSaveInput" type="file" accept="application/json,.json" hidden><span class="eyebrow guide-title">QUICK GUIDE</span><ul><li>每日任務每天輪替三項，達成後會自動領取素材或金幣。</li><li>角色隨聲望加入；角色升級獲得能力點，技能則消耗素材強化。</li><li>鐵匠鋪能製作、強化與分解裝備，背包可確認全部素材。</li><li>從隊伍介面安排三名成員與出戰順序。</li><li>區域威脅達到 75% 會產生危機契約。</li></ul>`;
    $('exportSaveBtn').addEventListener('click',exportSave);$('importSaveBtn').addEventListener('click',()=>$('importSaveInput').click());$('importSaveInput').addEventListener('change',importSave);$('resetSaveBtn').addEventListener('click',resetSave);
  }

  function exportSave(){
    save();const payload={game:'ashen-guild',version:SAVE_VERSION,exportedAt:new Date().toISOString(),state};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`ashen-guild-day-${state.day}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast('存檔備份已匯出');
  }

  function importSave(event){
    const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(reader.result);const incoming=parsed?.state||parsed;if(parsed?.game&&parsed.game!=='ashen-guild')throw new Error('不是《灰燼公會》存檔');if(!incoming||typeof incoming.day!=='number'||!Array.isArray(incoming.heroes)||!incoming.heroes.length)throw new Error('缺少必要的進度資料');if(!confirm(`匯入第 ${incoming.day} 日的進度並覆蓋目前存檔？`))return;localStorage.setItem(SAVE_KEY,JSON.stringify(incoming));location.reload();}catch(error){toast(`匯入失敗：${error.message}`);}};reader.onerror=()=>toast('匯入失敗：無法讀取檔案');reader.readAsText(file);
  }

  function resetSave(){if(!confirm('確定刪除目前進度？此動作無法復原，建議先匯出備份。'))return;if(!confirm('再次確認：要從第 1 日重新開始嗎？'))return;localStorage.removeItem(SAVE_KEY);location.reload();}

  function openIntro(){ $('modal').classList.add('open');$('modal').setAttribute('aria-hidden','false');$('modalBody').innerHTML='<p>《灰燼公會》沒有固定主線。你決定今天值得冒什麼風險，也決定邊境會變成什麼模樣。</p><ul><li>敵人頭上的標記會預告下一個行動；累積「破勢」可打斷敵人。</li><li>每日任務、季節與公會方針會定期輪替。</li><li>角色會隨聲望主動加入；升級取得能力點，可自由培養。</li><li>素材可升級技能，也能在鐵匠鋪製作、強化或分解裝備。</li><li>從「隊伍」調整三名成員與實際出戰順序。</li><li>遠征失敗不會刪除進度；整備後再次出發。</li></ul><button class="action-btn" id="introOk">查看邊境局勢</button>';$('introOk').addEventListener('click',closeModal); }
  function closeModal(){ $('modal').classList.remove('open');$('modal').setAttribute('aria-hidden','true');state.seenIntro=true;save(); }

  $('refreshBtn').addEventListener('click',()=>{if(state.gold<10)return toast('金幣不足');state.gold-=10;generateContracts();renderGuild();toast('新的委託已張貼');});
  $('retreatBtn').addEventListener('click',()=>{if(confirm('確定放棄本次遠征？已取得的臨時戰利品將會失去。')){advanceDay();applyInjuries(false);save();returnGuild();}});
  $('soundBtn').addEventListener('click',()=>{audioOn=!audioOn;if(audioOn)startBgm();else stopBgm();$('soundBtn').textContent=audioOn?'♪':'×';toast(audioOn?'音效與背景音樂已開啟':'音效與背景音樂已關閉');});
  $('recordsBtn').addEventListener('click',openRecords);
  $('codexBtn').addEventListener('click',openCodex);
  $('bagBtn').addEventListener('click',openBag);
  $('partyBtn').addEventListener('click',openParty);
  $('systemBtn').addEventListener('click',openSystem);
  $('modalClose').addEventListener('click',closeModal);
  $('modal').addEventListener('click',e=>{if(e.target===$('modal'))closeModal();});
  window.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
  window.addEventListener('pointerdown',startBgm,{once:true});

  renderGuild();
  if(!state.seenIntro)setTimeout(openIntro,350);
})();
