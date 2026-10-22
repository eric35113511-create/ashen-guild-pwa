(() => {
  'use strict';

  const LEGACY_SAVE_KEY = 'ashen-guild-save-v1';
  const SAVE_KEY = 'ashen-guild-save-v2';
  const SAVE_VERSION = 9;
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
    { id: 'whetstone', symbol: '/', name: '傭兵磨刀石', desc: '本次遠征全隊物理威力 +3。' },
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
    { id: 'prestige', name: '名聲遠播', desc: '公會聲望達到 300', reward: 90, test: s => s.renown>=300 },
    { id: 'trophies', name: '邊境獵手', desc: '蒐集三個不同區域的戰證', reward: 120, test: s => Object.keys(s.trophies||{}).filter(k=>s.trophies[k]>0).length>=3 },
    { id: 'chronicler', name: '寫進歷史', desc: '完成一條跨遠征事件鏈', reward: 80, test: s => Object.values(s.chains||{}).some(v=>v>=2) }
  ];

  const specializations = {
    bran: [
      { id: 'bulwark', name: '不動壁壘', symbol: '▣', desc: '生命上限 +20，立盾額外提供 5 護盾。' },
      { id: 'breaker', name: '碎陣先鋒', symbol: '◆', desc: '物理威力 +3，造成的破勢提高 25%。' }
    ],
    mira: [
      { id: 'deadeye', name: '鷹眼獵手', symbol: '⊙', desc: '物理威力 +4，貫穿箭傷害再提高 20%。' },
      { id: 'pathfinder', name: '荒野尋路者', symbol: '⌁', desc: '戰鬥金幣收益提高 20%，遠征事件治療量提高。' }
    ],
    sena: [
      { id: 'hearth', name: '守火醫者', symbol: '✚', desc: '所有治療效果提高 30%。' },
      { id: 'storm', name: '雷燼術師', symbol: 'ϟ', desc: '魔法威力 +4，擅長在持續傷害與隊伍增益間切換。' }
    ],
    riven: [
      { id: 'duelist', name: '決鬥劍士', symbol: 'Ⅱ', desc: '對單一敵人的攻擊傷害提高 15%。' },
      { id: 'dancer', name: '刃舞者', symbol: '∞', desc: '群體攻擊傷害提高 20%。' }
    ],
    alda: [
      { id: 'saint', name: '巡禮聖者', symbol: '✦', desc: '治療效果提高 25%，生命上限 +10。' },
      { id: 'inquisitor', name: '異端審判者', symbol: '☼', desc: '魔法威力 +4，攻擊額外造成破勢。' }
    ],
    tor: [
      { id: 'vanguard', name: '疾風前鋒', symbol: '≫', desc: '物理威力 +3，每場戰鬥開始額外獲得技能點。' },
      { id: 'captain', name: '戰陣隊長', symbol: '♜', desc: '全隊生命上限 +8。' }
    ]
  };

  const heroTemplates = [
    {
      id: 'bran', name: '布蘭', job: '盾衛', icon: 'B', color: '#c79b45', maxHp: 92, maxSp: 3, physicalPower: 12, magicPower: 4,
      skills: [
        { id: 'strike', name: '盾擊', desc: '造成傷害與 12 點破勢。', cost: 0, target: 'enemy', damage: 1, stagger: 12 },
        { id: 'guard', name: '立盾', desc: '全隊獲得 10 點護盾。', cost: 1, target: 'allies', shield: 10 },
        { id: 'challenge', name: '挑釁', desc: '獲得 24 護盾，敵人本輪集中攻擊自己。', cost: 2, target: 'self', shield: 24, taunt: true },
        { id: 'crush', name: '震懾怒吼', desc: '削弱全體敵人並累積破勢。', cost: 2, target: 'enemies', weaken: 2, stagger: 12 },
        { id: 'intercept', name: '攔截陣線', desc: '全隊獲得護盾，自己進入挑釁。', cost: 2, target: 'allies', shield: 8, taunt: true },
        { id: 'revenge', name: '守勢反擊', desc: '獲得反擊姿態，受擊時反傷。', cost: 1, target: 'self', counter: 8 }
      ],
      ultimate:{id:'lastwall',name:'最後城牆',desc:'全隊獲得 28 護盾，布蘭強制挑釁。',target:'allies',shield:28,taunt:true}
    },
    {
      id: 'mira', name: '米拉', job: '遊俠', icon: 'M', color: '#4f7c5b', maxHp: 70, maxSp: 3, physicalPower: 15, magicPower: 4,
      skills: [
        { id: 'shot', name: '精準射擊', desc: '可靠的單體攻擊。', cost: 0, target: 'enemy', damage: 1.05, stagger: 7 },
        { id: 'mark', name: '獵人標記', desc: '造成傷害，使目標易傷 2 回合。', cost: 1, target: 'enemy', damage: .65, vulnerable: 2 },
        { id: 'volley', name: '風向號令', desc: '提高全隊威力，持續 2 回合。', cost: 2, target: 'allies', powerAll: 3, buffTurns: 2 },
        { id: 'pierce', name: '貫穿箭', desc: '高傷害且無視部分護甲。', cost: 2, target: 'enemy', damage: 1.7, pierce: true },
        { id: 'snare', name: '束縛陷阱', desc: '造成少量傷害並大幅累積破勢。', cost: 1, target: 'enemy', damage:.45, stagger:24 },
        { id: 'camouflage', name: '煙葉偽裝', desc: '本輪首次受擊完全閃避。', cost: 1, target: 'self', dodge:true }
      ],
      ultimate:{id:'arrowstorm',name:'星落箭雨',desc:'攻擊全體並施加 2 回合易傷。',target:'enemies',damage:1.25,vulnerable:2}
    },
    {
      id: 'sena', name: '瑟娜', job: '燼術師', icon: 'S', color: '#c75a3d', maxHp: 62, maxSp: 4, physicalPower: 5, magicPower: 16,
      skills: [
        { id: 'spark', name: '燼火', desc: '造成法術傷害。', cost: 0, target: 'enemy', damage: 1, damageType:'magic' },
        { id: 'mend', name: '餘燼復甦', desc: '治療生命最低的隊友。', cost: 1, target: 'lowest', heal: 20 },
        { id: 'burn', name: '灼魂', desc: '附加 3 回合燃燒。', cost: 2, target: 'enemy', damage: .7, burn: 3, damageType:'magic' },
        { id: 'nova', name: '星火共鳴', desc: '治療、護盾並提高全隊威力。', cost: 3, target: 'allies', healAll: 8, shield:8, powerAll:2, buffTurns:2 },
        { id: 'frost', name: '冷燼封印', desc: '低傷害，但造成大量破勢。', cost: 1, target:'enemy', damage:.4, stagger:28, damageType:'magic' },
        { id: 'warmth', name: '守夜餘溫', desc: '使全隊獲得持續恢復。', cost:2,target:'allies',regenAll:7 }
      ],
      ultimate:{id:'rekindle',name:'重燃命火',desc:'復甦倒下隊友並治療全隊。',target:'allies',reviveAll:.3,healAll:24,cleanseAll:true}
    },
    {
      id: 'riven', name: '里文', job: '影刃', icon: 'R', color: '#805b91', maxHp: 66, maxSp: 4, physicalPower: 17, magicPower: 3, recruitCost: 145,
      skills: [
        { id: 'cut', name: '快斬', desc: '快速的單體攻擊。', cost: 0, target: 'enemy', damage: 1.05, stagger: 5 },
        { id: 'feint', name: '佯攻', desc: '造成傷害並施加易傷。', cost: 1, target: 'enemy', damage: .7, vulnerable: 2 },
        { id: 'fan', name: '煙幕', desc: '使全體敵人致盲 2 回合。', cost: 2, target: 'enemies', blind: 2 },
        { id: 'execute', name: '處決式', desc: '高傷害的單體終結技。', cost: 3, target: 'enemy', damage: 2.05, stagger: 12 },
        { id: 'poisonedge', name: '裂甲毒', desc: '降低敵人護甲並施加易傷。', cost:1,target:'enemy',armorBreak:2,vulnerable:2 },
        { id: 'vanish', name: '消失', desc: '完全閃避本輪首次受擊並恢復技能點。', cost:2,target:'self',dodge:true,restoreSelf:1 }
      ],
      ultimate:{id:'deathdance',name:'死亡輪舞',desc:'連斬所有敵人，對低生命目標威力更高。',target:'enemies',damage:1.15,ultimateExecute:true}
    },
    {
      id: 'alda', name: '阿爾妲', job: '祈誓者', icon: 'A', color: '#b8c9d6', maxHp: 74, maxSp: 4, physicalPower: 7, magicPower: 12, recruitCost: 155,
      skills: [
        { id: 'smite', name: '懲戒', desc: '造成傷害與破勢。', cost: 0, target: 'enemy', damage: .95, stagger: 10, damageType:'magic' },
        { id: 'prayer', name: '療癒禱言', desc: '治療生命最低的隊友。', cost: 1, target: 'lowest', heal: 24 },
        { id: 'aegis', name: '誓約庇護', desc: '全隊獲得 13 護盾。', cost: 2, target: 'allies', shield: 13 },
        { id: 'sanctuary', name: '聖域', desc: '大幅治療全隊。', cost: 3, target: 'allies', healAll: 20 },
        { id: 'cleanse', name: '淨化儀式', desc: '清除全隊中毒並恢復少量生命。', cost:1,target:'allies',cleanseAll:true,healAll:6 },
        { id: 'judgment', name: '祝福聖印', desc: '提高全隊威力並減少承受傷害。', cost:2,target:'allies',powerAll:2,guardAll:.2,buffTurns:2 }
      ],
      ultimate:{id:'dawn',name:'黎明誓約',desc:'治療、淨化並賦予全隊護盾。',target:'allies',healAll:22,shield:18,cleanseAll:true}
    },
    {
      id: 'tor', name: '托爾', job: '風槍手', icon: 'T', color: '#438c8a', maxHp: 80, maxSp: 3, physicalPower: 15, magicPower: 5, recruitCost: 150,
      skills: [
        { id: 'thrust', name: '突刺', desc: '穩定的單體攻擊。', cost: 0, target: 'enemy', damage: 1, stagger: 9 },
        { id: 'sweep', name: '壓陣戰吼', desc: '降低全體敵人威力。', cost: 1, target: 'enemies', weaken: 2 },
        { id: 'rally', name: '振奮戰吼', desc: '全隊恢復 1 技能點。', cost: 2, target: 'allies', restoreAll: 1 },
        { id: 'skyfall', name: '墜星槍', desc: '強力攻擊並造成大量破勢。', cost: 3, target: 'enemy', damage: 1.75, stagger: 28 },
        { id: 'formation', name: '雁行陣', desc: '全隊獲得護盾與 1 技能點。', cost:2,target:'allies',shield:7,restoreAll:1 },
        { id: 'impale', name: '定風穿刺', desc: '無視護甲並降低敵人威力。', cost:2,target:'enemy',damage:1.15,pierce:true,weaken:2 }
      ],
      ultimate:{id:'dragonfall',name:'天槍墜龍',desc:'單體決戰技，造成巨大傷害與破勢。',target:'enemy',damage:2.5,stagger:42,pierce:true}
    }
  ];

  const equipment = [
    { id:'ironblade', name:'邊軍鐵刃', slot:'weapon', rarity:'common', set:'frontier', cost:48, physicalPower:3, jobs:['盾衛','影刃','風槍手'], desc:'物理威力 +3' },
    { id:'moonbow', name:'月枝長弓', slot:'weapon', rarity:'rare', set:'moon', trait:'opening', cost:76, physicalPower:4, jobs:['遊俠'], desc:'物理威力 +4；首輪攻擊傷害 +25%' },
    { id:'ashstaff', name:'灰晶法杖', slot:'weapon', rarity:'rare', set:'ash', trait:'kindle', cost:82, magicPower:4, sp:1, jobs:['燼術師','祈誓者'], desc:'魔法威力 +4；施放治療後恢復自己 1 技能點' },
    { id:'oathspear', name:'誓約長槍', slot:'weapon', rarity:'epic', set:'oath', trait:'momentum', cost:118, physicalPower:5, jobs:['風槍手','祈誓者'], desc:'物理威力 +5；擊破敵人破勢時恢復 1 技能點' },
    { id:'thornknife', name:'荊棘短刀', slot:'weapon', rarity:'rare', trait:'execute', cost:78, physicalPower:3, jobs:['影刃','遊俠'], desc:'物理威力 +3；對生命低於 35% 的敵人傷害 +30%' },
    { id:'bellhammer', name:'喪鐘戰鎚', slot:'weapon', rarity:'epic', trait:'aftershock', cost:125, physicalPower:4, jobs:['盾衛'], desc:'物理威力 +4；破勢攻擊會波及其他敵人' },
    { id:'leather', name:'獵戶皮甲', slot:'armor', rarity:'common', set:'frontier', cost:44, hp:12, desc:'生命 +12' },
    { id:'plate', name:'灰鋼板甲', slot:'armor', rarity:'rare', set:'oath', trait:'warding', cost:82, hp:20, jobs:['盾衛','祈誓者'], desc:'每場戰鬥開始獲得 10 護盾' },
    { id:'silk', name:'符文絲衣', slot:'armor', rarity:'rare', set:'ash', trait:'focus', cost:78, hp:8, sp:1, jobs:['燼術師','影刃'], desc:'每場首個付費技能少消耗 1 點' },
    { id:'windcoat', name:'逐風外套', slot:'armor', rarity:'rare', set:'moon', trait:'evasion', cost:76, hp:14, jobs:['遊俠','風槍手'], desc:'每場第一次受擊傷害減半' },
    { id:'mirecloak', name:'沼行斗篷', slot:'armor', rarity:'common', trait:'antidote', cost:55, hp:10, desc:'中毒持續時間減少 1 回合' },
    { id:'phoenixmail', name:'不熄羽衣', slot:'armor', rarity:'epic', trait:'laststand', cost:132, hp:16, jobs:['燼術師','祈誓者'], desc:'每次遠征首次致命傷改為保留 1 生命' },
    { id:'fang', name:'狼牙墜飾', slot:'charm', rarity:'common', set:'frontier', trait:'hunt', cost:52, physicalPower:2, hp:6, desc:'物理威力 +2；擊倒敵人恢復 4 生命' },
    { id:'amber', name:'琥珀護符', slot:'charm', rarity:'rare', set:'moon', trait:'purify', cost:80, hp:12, sp:1, desc:'戰鬥結束時清除中毒' },
    { id:'guildseal', name:'老會長印戒', slot:'charm', rarity:'epic', set:'oath', trait:'command', cost:126, physicalPower:1, magicPower:1, hp:10, desc:'物理／魔法威力 +1；開戰時全隊獲得 1 技能點' },
    { id:'glassstar', name:'玻璃星盤', slot:'charm', rarity:'epic', set:'ash', trait:'wildfire', cost:122, magicPower:3, jobs:['燼術師','祈誓者'], desc:'魔法威力 +3；燃燒可跳躍至另一名敵人' },
    { id:'coppercoin', name:'缺角幸運幣', slot:'charm', rarity:'common', trait:'fortune', cost:46, hp:5, desc:'裝備掉落機率稍微提高' },
    { id:'chainmark', name:'斷鏈徽記', slot:'charm', rarity:'rare', trait:'resolve', cost:84, physicalPower:1, magicPower:1, desc:'雙威力 +1；生命低於一半時破勢量提高 30%' }
    ,{ id:'stormstring', name:'風暴弓弦', slot:'weapon', rarity:'rare', trait:'tailshot', cost:92, physicalPower:4, sp:1, jobs:['遊俠'], desc:'物理威力 +4、技能點 +1；攻擊致盲目標時破勢 +8' }
    ,{ id:'emberrod', name:'餘火短杖', slot:'weapon', rarity:'rare', trait:'cinder', cost:94, magicPower:5, jobs:['燼術師'], desc:'魔法威力 +5；燃燒傷害額外 +2' }
    ,{ id:'veilblade', name:'暮紗短刃', slot:'weapon', rarity:'rare', trait:'ambush', cost:94, physicalPower:4, jobs:['影刃'], desc:'物理威力 +4；對帶有負面狀態的敵人傷害 +12%' }
    ,{ id:'pilgrimplate', name:'巡禮者胸甲', slot:'armor', rarity:'rare', trait:'mending', cost:96, hp:18, jobs:['盾衛','祈誓者'], desc:'生命 +18；受到治療時額外恢復 3 生命' }
    ,{ id:'mistweave', name:'霧紋戰衣', slot:'armor', rarity:'rare', trait:'clarity', cost:90, hp:12, sp:1, jobs:['遊俠','影刃','燼術師'], desc:'生命 +12、技能點 +1；每戰首次受到負面狀態時免疫' }
    ,{ id:'warhorn', name:'裂風號角', slot:'charm', rarity:'rare', trait:'firstcommand', cost:98, physicalPower:1, magicPower:1, hp:8, desc:'雙威力 +1、生命 +8；首輪全隊威力 +1' }
    ,{ id:'sunbreaker', name:'曙光破城劍', slot:'weapon', rarity:'epic', set:'oath', trait:'execute', physicalPower:6, hp:10, jobs:['盾衛','風槍手'], desc:'物理威力 +6、生命 +10；對生命低於 35% 的敵人傷害 +30%' }
    ,{ id:'nightglass', name:'夜璃雙刃', slot:'weapon', rarity:'epic', set:'moon', trait:'ambush', physicalPower:6, sp:1, jobs:['影刃','遊俠'], desc:'物理威力 +6、技能點 +1；對帶有負面狀態的敵人傷害 +12%' }
    ,{ id:'starpyre', name:'星火權杖', slot:'weapon', rarity:'epic', set:'ash', trait:'cinder', magicPower:7, jobs:['燼術師','祈誓者'], desc:'魔法威力 +7；燃燒傷害額外 +2' }
    ,{ id:'citadelmail', name:'城塞龍鱗甲', slot:'armor', rarity:'epic', set:'oath', trait:'warding', hp:28, jobs:['盾衛','風槍手'], desc:'生命 +28；每場戰鬥開始獲得 10 護盾' }
    ,{ id:'phantomcoat', name:'無影夜行衣', slot:'armor', rarity:'epic', set:'moon', trait:'evasion', hp:18, sp:1, jobs:['遊俠','影刃'], desc:'生命 +18、技能點 +1；每場第一次受擊傷害減半' }
    ,{ id:'oraclevestment', name:'神諭星紗', slot:'armor', rarity:'epic', set:'ash', trait:'clarity', hp:16, magicPower:2, sp:1, jobs:['燼術師','祈誓者'], desc:'生命 +16、魔法威力 +2、技能點 +1；每戰首次受到負面狀態時免疫' }
    ,{ id:'lionstandard', name:'黃金獅旗章', slot:'charm', rarity:'epic', set:'oath', trait:'firstcommand', physicalPower:2, magicPower:2, hp:10, desc:'雙威力 +2、生命 +10；首輪全隊威力 +1' }
    ,{ id:'eclipsependant', name:'蝕月墜飾', slot:'charm', rarity:'epic', set:'moon', trait:'resolve', physicalPower:2, magicPower:2, sp:1, desc:'雙威力 +2、技能點 +1；生命低於一半時破勢量提高 30%' }
    ,{ id:'phoenixember', name:'不死鳥餘燼', slot:'charm', rarity:'epic', set:'ash', trait:'laststand', magicPower:3, hp:12, desc:'魔法威力 +3、生命 +12；每次遠征首次致命傷改為保留 1 生命' }
    ,{ id:'bran_aegis', name:'布蘭專武・不落城門', slot:'weapon', rarity:'legendary', trait:'branLegacy', uniqueFor:'bran', physicalPower:7, hp:38, sp:1, desc:'生命 +38、物理威力 +7、技能點 +1；護盾技能額外 +12，反擊傷害 +10' }
    ,{ id:'mira_longbow', name:'米拉專武・逐月', slot:'weapon', rarity:'legendary', trait:'miraLegacy', uniqueFor:'mira', physicalPower:10, sp:2, hp:12, desc:'物理威力 +10、技能點 +2、生命 +12；攻擊易傷目標傷害 +30%，並額外造成 8 破勢' }
    ,{ id:'sena_catalyst', name:'瑟娜專武・長明燼心', slot:'weapon', rarity:'legendary', trait:'senaLegacy', uniqueFor:'sena', magicPower:10, sp:2, hp:12, desc:'魔法威力 +10、技能點 +2、生命 +12；燃燒傷害 +6、治療量 +20%' }
    ,{ id:'riven_twins', name:'里文專武・無聲雙生', slot:'weapon', rarity:'legendary', trait:'rivenLegacy', uniqueFor:'riven', physicalPower:11, sp:1, hp:10, desc:'物理威力 +11、技能點 +1、生命 +10；對負面狀態目標傷害 +30%，擊倒時恢復 2 技能點' }
    ,{ id:'alda_reliquary', name:'阿爾妲專武・晨誓聖匣', slot:'weapon', rarity:'legendary', trait:'aldaLegacy', uniqueFor:'alda', magicPower:9, hp:24, sp:2, desc:'魔法威力 +9、生命 +24、技能點 +2；治療與護盾 +25%' }
    ,{ id:'tor_lance', name:'托爾專武・天穹軍旗', slot:'weapon', rarity:'legendary', trait:'torLegacy', uniqueFor:'tor', physicalPower:9, hp:24, sp:1, desc:'物理威力 +9、生命 +24、技能點 +1；全隊增益延長 1 回合，開戰全隊威力 +2' }
  ];

  const rarityInfo={common:{name:'普通',color:'#a7a99e',max:3},rare:{name:'稀有',color:'#6ea4c8',max:5},epic:{name:'史詩',color:'#bd79cf',max:7},legendary:{name:'專武',color:'#e39b4a',max:9}};
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
    {id:'sprain',name:'筋腱拉傷',days:2,desc:'物理威力 -3',physicalPower:-3},
    {id:'shock',name:'魔力震盪',days:3,desc:'魔法威力 -3、技能點上限 -1',magicPower:-3,sp:-1}
  ];

  const enemyTemplates = {
    wolf: { name: '荒原狼', icon: 'W', hp: 42, power: 9, armor: 0, magicResist:0, staggerMax: 35, color: '#b77d61' },
    bandit: { name: '流寇', icon: 'R', hp: 56, power: 11, armor: 2, magicResist:1, staggerMax: 45, color: '#bb6a54' },
    shaman: { name: '腐枝薩滿', icon: 'S', hp: 48, power: 10, armor: 1, magicResist:3, staggerMax: 40, color: '#8d7563', support: true },
    spider: { name: '墓穴毒蛛', icon: 'A', hp: 38, power: 7, armor: 0, magicResist:1, staggerMax: 32, color: '#8b718e', venomous: true },
    wisp: { name: '殘光妖火', icon: 'I', hp: 36, power: 8, armor: 0, magicResist:4, staggerMax: 30, color: '#7295a9', healer: true },
    cultist: { name: '灰冠祭徒', icon: 'C', hp: 62, power: 12, armor: 2, magicResist:3, staggerMax: 48, color: '#9b6572' },
    golem: { name: '苔岩魔像', icon: 'G', hp: 88, power: 14, armor: 5, magicResist:2, staggerMax: 60, color: '#7e806c' },
    harpy: { name: '裂風妖鳥', icon: 'H', hp: 44, power: 10, armor: 0, magicResist:1, staggerMax: 34, color: '#8aa0a5', disruptor: true },
    hexer: { name: '枯印咒師', icon: 'X', hp: 52, power: 9, armor: 1, magicResist:4, staggerMax: 42, color: '#9a708d', hexer: true },
    leech: { name: '血沼潛獸', icon: 'L', hp: 68, power: 12, armor: 1, magicResist:2, staggerMax: 46, color: '#8e5f59', drainer: true },
    sentinel: { name: '鏽誓哨兵', icon: 'K', hp: 76, power: 11, armor: 4, magicResist:1, staggerMax: 56, color: '#89806d', protector: true },
    warden: { name: '失落守衛', icon: 'V', hp: 190, power: 21, armor: 6, magicResist:5, staggerMax: 92, color: '#9d705b', boss: true },
    direalpha:{name:'赤牙狼王',icon:'Ω',hp:175,power:22,armor:4,magicResist:3,staggerMax:88,color:'#b85d48',boss:true},
    miremother:{name:'腐沼母體',icon:'M',hp:205,power:19,armor:4,magicResist:6,staggerMax:96,color:'#718755',boss:true,venomous:true},
    warmachine:{name:'灰鐵戰爭機偶',icon:'G',hp:230,power:23,armor:8,magicResist:3,staggerMax:108,color:'#817762',boss:true,protector:true},
    archcultist:{name:'魔王軍大祭司',icon:'C',hp:185,power:20,armor:4,magicResist:8,staggerMax:90,color:'#95536f',boss:true,hexer:true},
    stormroc:{name:'北境風災巨鳥',icon:'H',hp:180,power:24,armor:3,magicResist:5,staggerMax:86,color:'#5f8990',boss:true,disruptor:true},
    demonking:{name:'灰冠魔王・瓦爾克斯',icon:'王',hp:360,power:28,armor:8,magicResist:8,staggerMax:135,color:'#b13f4b',boss:true,demon:true}
  };
  const zoneBosses={'狼煙丘陵':'direalpha','腐根沼地':'miremother','碎石古道':'warmachine','灰冠遺跡':'archcultist','北風林線':'stormroc'};
  const campaignChapters=[
    {need:0,name:'餘燼中的公會',desc:'魔王軍重新越過灰冠山脈。弱小的公會必須先守住五片領地，才能追查魔王本陣。'},
    {need:20,name:'黑旗斥候',desc:'各地頭目身上都帶著同一枚黑冠印記。這些襲擊不是偶然，而是魔王軍的先遣作戰。'},
    {need:50,name:'五將軍的命令',desc:'公會確認五名領地頭目受魔王直屬將軍指揮。繼續平定領地，削弱黑冠軍勢。'},
    {need:80,name:'通往灰冠王座',desc:'最後的軍令揭露魔王藏身於灰冠遺跡深處。情報達到 100% 後，最終討伐將取代該區頭目。'},
    {need:100,name:'魔王討伐戰',desc:'道路已經打開。前往灰冠遺跡，在遠征末段挑戰灰冠魔王・瓦爾克斯。'}
  ];

  const contractSeeds = [
    { zone: '狼煙丘陵', title: '失蹤的商旅', desc: '車轍停在舊道中央。找回貨物，或至少帶回商隊的消息。', risk: 1, accent: '#c9a252', pool: ['wolf', 'bandit', 'harpy'] },
    { zone: '腐根沼地', title: '會走路的藥草', desc: '藥師願為一株夜光苔付出高價，只是沼地最近並不安靜。', risk: 2, accent: '#779b68', pool: ['wolf', 'shaman', 'spider', 'leech'] },
    { zone: '碎石古道', title: '沉默的哨塔', desc: '連續三夜沒有烽火升起。軍需官要一份現場勘查報告。', risk: 2, accent: '#b77d61', pool: ['bandit', 'golem', 'sentinel'] },
    { zone: '灰冠遺跡', title: '封印下的回聲', desc: '探勘隊挖出不該甦醒的東西。高風險，也意味著高報酬。', risk: 3, accent: '#a77891', pool: ['shaman', 'spider', 'wisp', 'cultist', 'golem', 'hexer', 'sentinel', 'warden'] },
    { zone: '北風林線', title: '冬糧護送', desc: '護送補給穿越獸群領地。每一袋糧食都能讓聚落多撐一天。', risk: 1, accent: '#6d91a5', pool: ['wolf', 'wolf', 'bandit', 'harpy'] }
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
  const renownPerks=[
    {id:'routes',need:60,name:'邊境情報網',desc:'遠征岔路固定提供三個選擇'},
    {id:'rareCraft',need:80,name:'稀有軍備許可',desc:'遠征可掉落、鐵匠鋪可製作稀有裝備'},
    {id:'salvage',need:160,name:'回收專精',desc:'分解裝備取得的素材 +25%'},
    {id:'mentor',need:220,name:'導師名冊',desc:'解鎖高階能力培養提示與角色專精檔案'},
    {id:'epicCraft',need:300,name:'史詩軍備許可',desc:'遠征可掉落、鐵匠鋪可製作史詩裝備'},
    {id:'legacy',need:400,name:'英雄傳承',desc:'危機契約聲望 +20%，首勝額外獲得 30 金幣'}
  ];
  const talentDefs={
    bran:[['守壁',[['bran_wall','厚重盾面','護盾技能 +5','shieldBoost',5],['bran_guard','不動壁壘','守護減傷額外 +10%','guardBoost',.1]]],['反擊',[['bran_counter','荊棘架勢','反擊傷害 +4','counterBoost',4],['bran_grit','鋼鐵意志','生命上限 +10','hpBoost',10]]],['震懾',[['bran_break','盾陣教範','破勢效果 +15%','staggerRate',.15],['bran_roar','威壓怒吼','弱化效果額外 -1 威力','weakenBoost',1]]]],
    mira:[['獵殺',[['mira_mark','深刻標記','易傷延長 1 回合','debuffTurns',1],['mira_hunt','弱點追獵','對易傷目標傷害 +15%','vulnerableDamage',.15]]],['號令',[['mira_wind','順風旗語','隊伍威力增益 +1','buffPower',1],['mira_long','持續號令','我方增益延長 1 回合','buffTurns',1]]],['陷阱',[['mira_snare','鋼索陷阱','破勢技能額外 +6','staggerFlat',6],['mira_smoke','遮蔽獵場','致盲延長 1 回合','blindTurns',1]]]],
    sena:[['燼火',[['sena_burn','餘火不滅','燃燒延長 1 回合','burnTurns',1],['sena_flame','灼熱核心','燃燒每回合傷害 +3','burnDamage',3]]],['守火',[['sena_heal','溫暖火種','治療量 +15%','healRate',.15],['sena_regen','長明餘燼','持續恢復量 +2','regenBoost',2]]],['共鳴',[['sena_magic','灰晶共振','魔法威力 +3','magicBoost',3],['sena_chorus','星火合唱','隊伍威力增益 +1','buffPower',1]]]],
    riven:[['暗影',[['riven_smoke','濃重煙幕','致盲延長 1 回合','blindTurns',1],['riven_vanish','無聲退場','閃避技能額外恢復 1 技能點','dodgeSp',1]]],['毒術',[['riven_armor','腐蝕配方','裂甲效果 +1','armorBreakBoost',1],['riven_expose','滲透毒素','易傷延長 1 回合','debuffTurns',1]]],['處決',[['riven_edge','致命節奏','對半血以下敵人傷害 +15%','executeDamage',.15],['riven_speed','迅捷手法','物理威力 +3','physicalBoost',3]]]],
    alda:[['恩典',[['alda_heal','豐饒禱文','治療量 +15%','healRate',.15],['alda_aegis','聖盾禱文','護盾技能 +5','shieldBoost',5]]],['祝福',[['alda_long','悠長祝福','我方增益延長 1 回合','buffTurns',1],['alda_guard','堅定聖印','守護減傷額外 +10%','guardBoost',.1]]],['審判',[['alda_magic','聖光灌注','魔法威力 +3','magicBoost',3],['alda_rebuke','斥責','弱化效果額外 -1 威力','weakenBoost',1]]]],
    tor:[['戰陣',[['tor_shield','密集隊形','護盾技能 +4','shieldBoost',4],['tor_guard','互相掩護','守護減傷額外 +10%','guardBoost',.1]]],['號令',[['tor_rally','高昂戰意','恢復技能點效果 +1','restoreBoost',1],['tor_long','軍令如山','我方增益延長 1 回合','buffTurns',1]]],['破軍',[['tor_break','破陣槍術','破勢效果 +15%','staggerRate',.15],['tor_pierce','甲冑剋星','裂甲效果 +1','armorBreakBoost',1]]]]
  };
  const gearAffixDefs=[
    {id:'sturdy',name:'堅固',desc:'生命 +6',hp:6},{id:'keen',name:'銳利',desc:'物理威力 +2',physicalPower:2},{id:'arcane',name:'秘法',desc:'魔法威力 +2',magicPower:2},{id:'focused',name:'專注',desc:'技能點上限 +1',sp:1},{id:'warded',name:'護佑',desc:'開戰護盾 +5',startShield:5}
  ];
  const bondSpecials={
    'alda-bran':'護盾技能額外 +3','mira-riven':'攻擊易傷目標傷害 +10%','sena-tor':'我方增益延長 1 回合',
    'bran-tor':'破勢效果 +10%','mira-sena':'治療與持續恢復 +10%','alda-riven':'敵方負面狀態延長 1 回合'
  };
  const materialDefs={scrap:{name:'鐵屑',symbol:'▰',group:'gear',desc:'鍛造武器與強化裝備'},cloth:{name:'韌布',symbol:'▧',group:'gear',desc:'製作護甲與防具'},essence:{name:'灰燼精華',symbol:'✦',group:'gear',desc:'製作飾品與稀有裝備'},bossCore:{name:'鍛造核心',symbol:'◆',group:'gear',desc:'史詩裝備製作與強化'},skillDust:{name:'戰技殘頁',symbol:'頁',group:'skill',desc:'技能第一階升級'},skillCore:{name:'奧義印記',symbol:'印',group:'skill',desc:'技能精通階段專用'},growthCrystal:{name:'能力結晶',symbol:'晶',group:'ability',desc:'分配角色體魄、力量與專注'}};
  const marketCatalog=[
    {id:'scrap',name:'鐵屑箱',desc:'裝備素材 ×5',price:30,type:'material',key:'scrap',amount:5},
    {id:'cloth',name:'韌布捆',desc:'裝備素材 ×4',price:32,type:'material',key:'cloth',amount:4},
    {id:'essence',name:'精華瓶',desc:'裝備素材 ×2',price:48,type:'material',key:'essence',amount:2},
    {id:'skillDust',name:'戰技抄本',desc:'戰技殘頁 ×3',price:55,type:'material',key:'skillDust',amount:3},
    {id:'supply',name:'遠征補給',desc:'遠征事件可消耗的補給 ×1',price:45,type:'supply',amount:1},
    {id:'treatment',name:'醫療憑證',desc:'立即治療一名受傷角色',price:70,type:'treatment'},
    {id:'skillCore',name:'奧義印記',desc:'技能精通素材 ×1',price:160,type:'material',key:'skillCore',amount:1,need:220},
    {id:'bossCore',name:'鍛造核心',desc:'史詩裝備素材 ×1',price:180,type:'material',key:'bossCore',amount:1,need:300}
  ];
  const joinThresholds={riven:80,tor:180,alda:320};
  const dailyQuestDefs=[
    {id:'battles',name:'清理道路',desc:'贏得 2 場戰鬥',type:'battle',target:2,reward:{gold:24,skillDust:2}},
    {id:'contract',name:'完成值勤',desc:'完成 1 份契約',type:'contract',target:1,reward:{gold:35,scrap:3}},
    {id:'ultimate',name:'氣勢如虹',desc:'施放 1 次絕招',type:'ultimate',target:1,reward:{skillCore:1,skillDust:1}},
    {id:'craft',name:'工坊委託',desc:'製作或強化 1 次裝備',type:'craft',target:1,reward:{gold:25,cloth:3}},
    {id:'dismantle',name:'物資回收',desc:'分解 1 件裝備',type:'dismantle',target:1,reward:{scrap:4,essence:1}}
  ];

  const freshState = () => ({ day: 1, gold: 120, renown: 0, supplies: 2, difficulty:'omen',campaign:{intel:0,bosses:0,demonDefeated:false}, upgrades: { forge: 0, infirmary: 0 },materials:{scrap:8,cloth:5,essence:3,bossCore:0,skillDust:4,skillCore:0,growthCrystal:0},gearLevels:{},gearAffixes:{},bonds:{},daily:null,regions:Object.fromEntries(contractSeeds.map((c,i)=>[c.zone,{threat:24+i*7,cleared:0,crises:0}])), directive:null, trophies:{}, chronicle:[], chains:{}, contracts: [], heroes: heroTemplates.map(h => ({ ...h, level: 1, xp: 0,abilityCrystals:1,attributes:{vitality:0,might:0,magic:0,focus:0},talents:[],bonusTalentPoints:0,breakthrough:0,skillRanks:{},skillEvolutions:{}, activeSkills:h.skills.slice(0,4).map(s=>s.id), injury:null, owned: !joinThresholds[h.id], equipment: { weapon: null, armor: null, charm: null } })), activeParty: ['bran','mira','sena'], inventory: ['ironblade','leather'], shopStock: [], marketRefreshes:0, discovered:{enemies:[],equipment:['ironblade','leather'],zones:[]}, seenIntro: false, stats: { wins: 0, expeditions: 0, completed: 0 }, achievements: {} });
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
  [...state.inventory,...state.heroes.flatMap(h=>Object.values(h.equipment||{}).filter(Boolean))].forEach(ensureGearAffix);

  function normalizeState(s){
    const previousVersion=s.saveVersion||0;
    s.day=Math.max(1,Math.floor(Number(s.day)||1));s.gold=Math.max(0,Math.floor(Number(s.gold)||0));s.renown=Math.max(0,Math.floor(Number(s.renown)||0));s.supplies=clamp(Math.floor(Number(s.supplies)||0),0,5);
    Object.keys(materialDefs).forEach(id=>s.materials[id]=Math.max(0,Math.floor(Number(s.materials[id])||0)));
    if((s.saveVersion||0)<5)s.materials.growthCrystal+=s.heroes.reduce((n,h)=>n+(h.attributePoints||0),0);s.heroes.forEach(h=>delete h.attributePoints);
    if((s.saveVersion||0)<6&&s.facilities){const costs=[0,95,265,510];s.gold+=Object.values(s.facilities).reduce((sum,lv)=>sum+(costs[clamp(Math.floor(Number(lv)||0),0,3)]||0),0);}delete s.facilities;
    if((s.saveVersion||0)<7)s.heroes.forEach(h=>{if(h.injury?.id==='sprain'){delete h.injury.power;h.injury.physicalPower=-3;}if(h.injury?.id==='shock')h.injury.magicPower=-3;});s.saveVersion=SAVE_VERSION;
    s.gearAffixes=s.gearAffixes&&typeof s.gearAffixes==='object'?s.gearAffixes:{};s.bonds=s.bonds&&typeof s.bonds==='object'?s.bonds:{};
    const ownedCount=Math.max(1,s.heroes.filter(h=>h.owned).length),legacyCrystals=previousVersion<9?Math.floor((s.materials.growthCrystal||0)/ownedCount):0;
    s.heroes.forEach(h=>{h.talents=Array.isArray(h.talents)?h.talents.filter(id=>talentDefs[h.id]?.some(([,nodes])=>nodes.some(n=>n[0]===id))):[];h.bonusTalentPoints=Math.max(0,Math.floor(Number(h.bonusTalentPoints)||0));h.skillEvolutions=h.skillEvolutions&&typeof h.skillEvolutions==='object'?h.skillEvolutions:{};if(previousVersion<9&&Object.keys(h.skillEvolutions).length)Object.keys(h.skillEvolutions).forEach(id=>h.skillRanks[id]=Math.max(3,h.skillRanks[id]||0));h.abilityCrystals=Math.max(0,Math.floor(Number(h.abilityCrystals)||0)+(h.owned?legacyCrystals:0));h.breakthrough=Math.max(h.level>=11?2:h.level>=6?1:0,clamp(Math.floor(Number(h.breakthrough)||0),0,2));});
    s.materials.growthCrystal=0;s.difficulty='omen';s.campaign={intel:0,bosses:0,demonDefeated:false,...s.campaign};s.campaign.intel=clamp(Math.floor(Number(s.campaign.intel)||0),0,100);
    Object.values(s.regions).forEach(r=>{r.threat=clamp(Math.floor(Number(r.threat)||0),0,100);r.cleared=Math.max(0,Math.floor(Number(r.cleared)||0));r.crises=Math.max(0,Math.floor(Number(r.crises)||0));});
    s.activeParty=(Array.isArray(s.activeParty)?s.activeParty:[]).filter((id,i,a)=>a.indexOf(id)===i&&s.heroes.some(h=>h.id===id&&h.owned)).slice(0,3);if(!s.activeParty.length)s.activeParty=s.heroes.filter(h=>h.owned).slice(0,3).map(h=>h.id);
    s.inventory=Array.isArray(s.inventory)?s.inventory.filter(id=>equipment.some(i=>i.id===id)):[];s.contracts=Array.isArray(s.contracts)?s.contracts:[];s.shopStock=Array.isArray(s.shopStock)?s.shopStock.filter(x=>x&&typeof x==='object'&&marketCatalog.some(i=>i.id===x.itemId)):[];s.marketRefreshes=Math.max(0,Math.floor(Number(s.marketRefreshes)||0));s.chronicle=Array.isArray(s.chronicle)?s.chronicle:[];
    if(s.directive&&!directiveDefs.some(d=>d.id===s.directive.id))s.directive=null;return s;
  }

  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVE_KEY));
      const base = freshState();
      return parsed ? { ...base, ...parsed, upgrades: { ...base.upgrades, ...parsed.upgrades },materials:{...base.materials,...parsed.materials},gearLevels:{...base.gearLevels,...parsed.gearLevels},gearAffixes:{...base.gearAffixes,...parsed.gearAffixes},bonds:{...base.bonds,...parsed.bonds},regions:Object.fromEntries(Object.entries(base.regions).map(([z,v])=>[z,{...v,...parsed.regions?.[z]}])), trophies:{...base.trophies,...parsed.trophies}, chains:{...base.chains,...parsed.chains}, chronicle:parsed.chronicle||[], stats: { ...base.stats, ...parsed.stats }, achievements: { ...base.achievements, ...parsed.achievements }, discovered:{...base.discovered,...parsed.discovered}, activeParty: parsed.activeParty || base.activeParty, inventory: parsed.inventory || base.inventory, shopStock: parsed.shopStock || [], heroes: heroTemplates.map(h => { const old=parsed.heroes?.find?.(x=>x.id===h.id); return { ...h, level:1, xp:0, attributePoints:Math.max(0,(old?.level||1)-1),attributes:{vitality:0,might:0,magic:0,focus:0},talents:[],bonusTalentPoints:0,breakthrough:0,skillRanks:{},skillEvolutions:{}, activeSkills:h.skills.slice(0,4).map(s=>s.id), injury:null, owned:!joinThresholds[h.id], ...old, physicalPower:h.physicalPower,magicPower:h.magicPower,skills:h.skills, ultimate:h.ultimate,attributes:{vitality:0,might:0,magic:0,focus:0,...old?.attributes},talents:[...(old?.talents||[])],skillEvolutions:{...(old?.skillEvolutions||{})}, activeSkills:(old?.activeSkills||h.skills.slice(0,4).map(s=>s.id)).filter(id=>h.skills.some(s=>s.id===id)).slice(0,4), skillRanks:{...(old?.skillRanks||{})}, equipment:{ weapon:null, armor:null, charm:null, ...(old?.equipment||{}) } }; }) } : base;
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
  function addChronicle(text){state.chronicle.unshift({day:state.day,text});state.chronicle=state.chronicle.slice(0,30);}
  function hasRenownPerk(id){const perk=renownPerks.find(p=>p.id===id);return !!perk&&state.renown>=perk.need;}
  function talentValue(hero,key){let total=0;(hero.talents||[]).forEach(id=>{talentDefs[hero.id]?.forEach(([,nodes])=>nodes.forEach(n=>{if(n[0]===id&&n[3]===key)total+=n[4];}));});return total;}
  function talentPoints(hero){return Math.max(0,Math.floor((hero.level-1)/2)+(hero.bonusTalentPoints||0)-(hero.talents?.length||0));}
  function bondKey(a,b){return [a,b].sort().join('-');}
  function bondLevel(a,b){const n=state.bonds[bondKey(a,b)]||0;return n>=8?2:n>=3?1:0;}
  function heroEffect(hero,key){
    let value=talentValue(hero,key);const active=state.activeParty.filter(id=>id!==hero.id);
    active.forEach(other=>{if(bondLevel(hero.id,other)<2)return;const pair=bondKey(hero.id,other);const effects={'alda-bran':{shieldBoost:3},'mira-riven':{vulnerableDamage:.1},'sena-tor':{buffTurns:1},'bran-tor':{staggerRate:.1},'mira-sena':{healRate:.1},'alda-riven':{debuffTurns:1}};value+=effects[pair]?.[key]||0;});
    return value;
  }
  function setCounts(hero){return Object.values(hero.equipment||{}).reduce((m,id)=>{const set=equipment.find(i=>i.id===id)?.set;if(set)m[set]=(m[set]||0)+1;return m;},{});}
  function setBonusText(set){return {frontier:'2 件：生命 +8',moon:'2 件：物理威力 +2',ash:'2 件：魔法威力 +2、技能點 +1',oath:'2 件：開戰護盾 +8'}[set]||'';}
  function ensureGearAffix(id){if(!id)return null;if(!state.gearAffixes[id])state.gearAffixes[id]=pick(gearAffixDefs).id;return gearAffixDefs.find(a=>a.id===state.gearAffixes[id]);}
  function gearAffix(id){return gearAffixDefs.find(a=>a.id===state.gearAffixes[id])||ensureGearAffix(id);}
  function breakthroughCap(hero){return [5,10,15][hero.breakthrough||0];}
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
    $('worldModifier').innerHTML = `<i class="world-symbol">${modifier.symbol}</i><strong>今日局勢 · ${modifier.name}</strong><span>${modifier.desc}</span><small class="fixed-difficulty">固定難度：凶兆。敵方不再因選項而放水，報酬已包含最高難度加成。</small>`;
    renderWorldDashboard();
    $('contractList').innerHTML = state.contracts.map(c => `
      <article class="contract" style="--accent:${c.accent}">
        <div class="contract-top"><span>${c.zone} · 威脅 ${c.threat ?? state.regions[c.zone]?.threat}%</span><b class="risk">${c.crisis?'危機 ':''}${'◆'.repeat(c.risk)}${'◇'.repeat(Math.max(0,3-c.risk))}</b></div>
        <h3>${c.title}</h3><p>${c.desc}</p>
        <div class="contract-reward"><div class="reward-numbers"><b>${c.gold}</b> 金幣<br><b>${c.renown}</b> 聲望 · ${c.nodes} 節點</div><button class="action-btn" data-contract="${c.id}">接受</button></div>
      </article>`).join('');
    document.querySelectorAll('[data-contract]').forEach(btn => btn.addEventListener('click', () => startExpedition(btn.dataset.contract)));
    $('roster').innerHTML = state.heroes.filter(h=>h.owned).map(h => {
      const scaled=scaledHero(h),max=scaled.maxHp;
      const spec=specInfo(h);
      const active=state.activeParty.includes(h.id); const equipped=Object.values(h.equipment||{}).filter(Boolean).length;
      return `<article class="hero-card ${active?'selected':''} ${h.injury?'injured':''}" style="--accent:${h.color}"><div class="portrait"><img src="${portraitPath(h.id,'small')}" alt="${h.name}整身立繪" loading="lazy"></div><div class="hero-meta"><div><h3>${h.name}</h3><small>${h.job}${spec?` · ${spec.name}`:''}</small></div><b>Lv.${h.level}</b></div>${h.injury?`<div class="injury-tag">${h.injury.name} · ${h.injury.days} 日</div>`:''}<div class="stats"><span>生命 ${max}</span><span>物理 ${scaled.physicalPower}</span><span>魔法 ${scaled.magicPower}</span></div><button class="hero-detail-btn" data-hero-panel="${h.id}">查看完整角色面板</button></article>`;
    }).join('')+state.heroes.filter(h=>!h.owned).map(h=>`<article class="hero-card locked-hero" style="--accent:${h.color}"><div class="portrait">?</div><h3>${h.name} · ${h.job}</h3><small>公會聲望達到 ${joinThresholds[h.id]} 時加入</small><div class="rank-progress"><i style="width:${Math.min(100,state.renown/joinThresholds[h.id]*100)}%"></i></div></article>`).join('');
    document.querySelectorAll('[data-hero-panel]').forEach(b=>b.addEventListener('click',()=>openHeroPanel(b.dataset.heroPanel)));
    renderShop();
  }

  function changeDifficulty(id){if(!difficulties[id]||id===state.difficulty)return;state.difficulty=id;state.contracts=[];generateContracts();renderGuild();toast(`戰術難度已切換為「${difficulties[id].name}」`);}

  function renderWorldDashboard(){
    const season=currentSeason();const d=directiveDefs.find(x=>x.id===state.directive.id);const left=Math.max(0,state.directive.expires-state.day+1);
    const daily=state.daily.tasks.map(t=>{const q=dailyQuestDefs.find(x=>x.id===t.id);return `<div class="daily-task ${t.claimed?'done':''}"><b>${t.claimed?'✓ ':''}${q.name}</b><span>${q.desc} · ${rewardText(q.reward)}</span><em>${t.progress}/${q.target}</em></div>`;}).join('');
    $('worldDashboard').innerHTML=`<article class="season-card"><span class="dashboard-symbol">${season.symbol}</span><div><small>第 ${Math.floor((state.day-1)/7)+1} 季 · ${7-(state.day-1)%7} 日後輪替</small><h3>${season.name}</h3><p>${season.desc}</p></div></article><article class="directive-card"><small>公會方針 · 剩餘 ${left} 日</small><h3>${d.name}</h3><p>${d.desc}</p><div class="directive-progress"><i style="width:${state.directive.progress/d.target*100}%"></i></div><b>${state.directive.progress}/${d.target}${state.directive.claimed?' · 已完成':` · 獎勵 ${d.gold} G / ${d.renown} 聲望`}</b></article><article class="daily-card"><small>DAILY ORDERS · 每日更新</small><h3>今日任務</h3>${daily}</article><div class="region-grid">${contractSeeds.map(c=>{const r=state.regions[c.zone];return `<article class="region-state ${r.threat>=75?'crisis':''}"><span>${threatLabel(r.threat)}</span><b>${c.zone}</b><small>威脅 ${r.threat}% · 平定 ${r.cleared} 次</small><div><i style="width:${r.threat}%"></i></div></article>`;}).join('')}</div>`;
    const chapter=[...campaignChapters].reverse().find(x=>state.campaign.intel>=x.need);$('worldDashboard').insertAdjacentHTML('afterbegin',`<article class="campaign-card"><small>MAIN CAMPAIGN · 魔王軍戰線</small><h3>${state.campaign.demonDefeated?'灰冠王座已陷落':chapter.name}</h3><p>${state.campaign.demonDefeated?'魔王已被討伐，但各地殘軍與危機仍等待公會處理。':chapter.desc}</p><div class="campaign-progress"><i style="width:${state.campaign.intel}%"></i></div><b>討伐情報 ${state.campaign.intel}% · 擊破頭目 ${state.campaign.bosses}</b></article><p class="region-explain"><b>領地進度條＝威脅度。</b>每天會自然上升；完成該領地遠征會下降。達到 75% 會變成危機契約：敵人與報酬提高，若長期不處理則更容易出現精英。它不是完成度，而是需要壓制的危險程度。</p>`);
  }

  function ensureMarketStock(){if(state.shopStock.length)return;const available=marketCatalog.filter(i=>(i.need||0)<=state.renown&&!(i.type==='treatment'&&!state.heroes.some(h=>h.injury)));state.shopStock=[...available].sort(()=>Math.random()-.5).slice(0,5).map((i,n)=>({id:`${state.day}-${state.marketRefreshes}-${n}-${i.id}`,itemId:i.id,sold:false}));}
  function marketRefreshCost(){return 25+state.marketRefreshes*15;}
  function renderShop() {
    ensureMarketStock();
    const market=state.shopStock.map(s=>{const item=marketCatalog.find(i=>i.id===s.itemId),unusable=item?.type==='supply'&&state.supplies>=5;return item?`<article class="market-item ${s.sold?'sold':''}"><div><b>${item.name}</b><span>${unusable?'補給已達上限':item.desc}</span></div><button data-market-buy="${s.id}" ${s.sold||unusable||state.gold<item.price?'disabled':''}>${s.sold?'售罄':item.price+' G'}</button></article>`:'';}).join('');
    $('shop').innerHTML = `<span class="shop-label">鐵匠鋪</span><div class="workshop-links"><button data-open-forge="shop">武器商店</button><button data-open-forge="craft">製作裝備</button><button data-open-forge="upgrade">強化裝備</button><button data-open-forge="dismantle">分解裝備</button><button data-open-bag>查看背包</button></div><span class="shop-label">每日市場</span><div class="market-head"><small>每日自動刷新；商品購買後售罄</small><button data-market-refresh ${state.gold<marketRefreshCost()?'disabled':''}>刷新 ${marketRefreshCost()} G</button></div><div class="market-list">${market}</div><span class="shop-label">聲望里程碑</span><div class="renown-perks">${renownPerks.map(p=>`<article class="renown-perk ${state.renown>=p.need?'unlocked':''}"><b>${state.renown>=p.need?'✓':'◇'} ${p.need} 聲望 · ${p.name}</b><span>${p.desc}</span></article>`).join('')}</div>`;
    document.querySelectorAll('[data-open-forge]').forEach(b=>b.addEventListener('click',()=>openForge(b.dataset.openForge)));
    document.querySelectorAll('[data-open-bag]').forEach(b=>b.addEventListener('click',openBag));
    document.querySelectorAll('[data-market-buy]').forEach(b=>b.addEventListener('click',()=>buyMarketItem(b.dataset.marketBuy)));
    document.querySelectorAll('[data-market-refresh]').forEach(b=>b.addEventListener('click',refreshMarket));
  }

  function buyMarketItem(stockId){const stock=state.shopStock.find(s=>s.id===stockId&&!s.sold),item=stock&&marketCatalog.find(i=>i.id===stock.itemId);if(!item||state.gold<item.price)return;state.gold-=item.price;if(item.type==='material')state.materials[item.key]+=item.amount;if(item.type==='supply')state.supplies=clamp(state.supplies+item.amount,0,5);if(item.type==='treatment'){const hero=state.heroes.find(h=>h.injury);if(!hero){state.gold+=item.price;return toast('目前沒有人需要治療');}hero.injury=null;}stock.sold=true;save();renderGuild();tone(620,.1);toast(`購得：${item.name}`);}
  function refreshMarket(){const cost=marketRefreshCost();if(state.gold<cost)return toast('金幣不足');state.gold-=cost;state.marketRefreshes++;state.shopStock=[];ensureMarketStock();save();renderGuild();tone(500,.1);toast('市場商品已刷新');}

  function slotName(slot){return {weapon:'武器',armor:'護甲',charm:'飾品'}[slot]||slot;}
  function portraitPath(heroId,variant='avatar'){return `assets/characters/${heroId}/${variant}.webp`;}
  function scheduleHeroBack(heroId){queueMicrotask(()=>{const card=document.querySelector('.modal-card');if(!card||document.querySelector('[data-hero-back]'))return;card.insertAdjacentHTML('afterbegin',`<button class="modal-back" data-hero-back aria-label="返回${state.heroes.find(h=>h.id===heroId)?.name||''}角色面板">← 返回角色面板</button>`);document.querySelector('[data-hero-back]')?.addEventListener('click',()=>openHeroPanel(heroId));});}
  function rarityName(item){return rarityInfo[item.rarity||'common'].name;}
  const rarityOrder={legendary:0,epic:1,rare:2,common:3};
  function sortGear(items){return [...items].sort((a,b)=>(rarityOrder[a.rarity]??9)-(rarityOrder[b.rarity]??9)||a.slot.localeCompare(b.slot)||a.name.localeCompare(b.name,'zh-Hant'));}
  function ownsGear(id){return state.inventory.includes(id)||state.heroes.some(h=>Object.values(h.equipment||{}).includes(id));}
  function legacyTrial(hero){const deepBond=state.heroes.some(h=>h.owned&&h.id!==hero.id&&bondLevel(hero.id,h.id)>=2),masteries=Object.keys(hero.skillEvolutions||{}).length;return {deepBond,masteries,ready:hero.owned&&hero.level>=10&&hero.breakthrough>=2&&!!hero.specialization&&masteries>=3&&deepBond&&state.renown>=650&&state.campaign.bosses>=8&&state.campaign.intel>=100};}
  function gearMax(item){return rarityInfo[item?.rarity||'common']?.max||3;}
  function gearStatsText(item){const lv=state.gearLevels[item.id]||0,parts=[];if(item.hp)parts.push(`生命 +${item.hp+lv*2}`);if(item.physicalPower)parts.push(`物理威力 +${item.physicalPower+(item.slot==='weapon'?lv:0)}`);if(item.magicPower)parts.push(`魔法威力 +${item.magicPower+(item.slot==='weapon'?lv:0)}`);if(item.sp)parts.push(`技能點 +${item.sp}`);return parts.join('、')||'戰術型裝備';}
  function gearUpgradeCost(item,lv){return {scrap:5+lv*3,essence:item.rarity==='common'?0:2+Math.floor(lv/2),bossCore:['epic','legendary'].includes(item.rarity)&&lv>=2?1:0};}
  function heroTraits(hero){return Object.values(hero.equipment||{}).map(id=>equipment.find(i=>i.id===id)?.trait).filter(Boolean);}
  function hasTrait(hero,trait){return heroTraits(hero).includes(trait);}


  function inventoryCounts(){return state.inventory.reduce((m,id)=>(m[id]=(m[id]||0)+1,m),{});}
  function materialGroupHtml(group,title){return `<span class="eyebrow material-heading">${title}</span><div class="material-grid">${Object.entries(materialDefs).filter(([,m])=>m.group===group).map(([id,m])=>`<article><i>${m.symbol}</i><b>${m.name}</b><strong>${state.materials[id]}</strong><small>${m.desc}</small></article>`).join('')}</div>`;}
  function openBag(){const counts=inventoryCounts(),crystals=state.heroes.filter(h=>h.owned).map(h=>`${h.name} ${h.abilityCrystals||0}`).join('　');$('modal').classList.add('open');$('modal').setAttribute('aria-hidden','false');$('modalTitle').textContent='公會背包';$('modalBody').innerHTML=`<div class="material-inline">遠征補給 <b>${state.supplies}/5</b>　可在特殊事件中換取優勢</div>${materialGroupHtml('gear','EQUIPMENT MATERIALS · 裝備素材')}${materialGroupHtml('skill','SKILL MATERIALS · 技能素材')}<span class="eyebrow material-heading">ABILITY CRYSTALS · 角色專屬能力結晶</span><div class="material-inline">${crystals}</div><span class="eyebrow material-heading">EQUIPMENT</span><div class="inventory-list">${sortGear(Object.keys(counts).map(id=>equipment.find(i=>i.id===id)).filter(Boolean)).map(i=>{const n=counts[i.id],lv=state.gearLevels[i.id]||0;return `<article class="inventory-item rarity-${i.rarity}"><b>${i.name} +${lv}/${gearMax(i)}</b><span>${rarityName(i)} · ${slotName(i.slot)} · ${gearStatsText(i)} · 持有 ${n}</span></article>`;}).join('')||'<p class="empty-note">背包內沒有未裝備的裝備</p>'}</div>`;}
  function craftCost(item){if(item.rarity==='legendary')return {scrap:26,cloth:10,essence:14,bossCore:3};const rare=item.rarity==='rare',epic=item.rarity==='epic';return item.slot==='weapon'?{scrap:epic?18:rare?10:6,essence:epic?8:rare?3:0,bossCore:epic?1:0}:item.slot==='armor'?{cloth:epic?18:rare?10:6,essence:epic?7:rare?3:0,bossCore:epic?1:0}:{scrap:epic?7:rare?4:2,cloth:epic?7:rare?4:2,essence:epic?12:rare?6:3,bossCore:epic?1:0};}
  function canPayMaterials(cost){return Object.entries(cost).every(([id,n])=>(state.materials[id]||0)>=n);}
  function payMaterials(cost){Object.entries(cost).forEach(([id,n])=>state.materials[id]-=n);}
  function costText(cost){return Object.entries(cost).filter(([,n])=>n).map(([id,n])=>`${materialDefs[id].name}×${n}`).join('、');}
  function openForge(mode='craft'){
    const counts=inventoryCounts();
    const allowed=sortGear(equipment.filter(i=>i.rarity!=='legendary'&&(i.rarity==='common'||i.rarity==='rare'&&hasRenownPerk('rareCraft')||i.rarity==='epic'&&hasRenownPerk('epicCraft'))));
    let body='';
    if(mode==='shop')body=allowed.map(i=>{const price={common:70,rare:190,epic:460,legendary:900}[i.rarity];return `<div class="forge-row rarity-${i.rarity}"><div><b>${i.name}</b><span>${rarityName(i)} · ${slotName(i.slot)} · ${gearStatsText(i)}<br>${i.desc}</span><small>${i.uniqueFor?'角色專武 · ':''}直接購買，不消耗素材</small></div><button data-buy-gear="${i.id}" data-price="${price}" ${state.gold<price?'disabled':''}>${price} G</button></div>`;}).join('');
    if(mode==='craft')body=allowed.map(i=>{const c=craftCost(i);return `<div class="forge-row rarity-${i.rarity}"><div><b>${i.name}</b><span>${rarityName(i)} · ${slotName(i.slot)} · ${i.desc}</span><small>${costText(c)}</small></div><button data-craft="${i.id}" ${canPayMaterials(c)?'':'disabled'}>製作</button></div>`;}).join('');
    if(mode==='upgrade'){const equippedIds=state.heroes.flatMap(h=>Object.values(h.equipment||{}).filter(Boolean)),ids=[...new Set([...Object.keys(counts),...equippedIds])];body=sortGear(ids.map(id=>equipment.find(i=>i.id===id)).filter(Boolean)).map(i=>{const id=i.id,lv=state.gearLevels[id]||0,max=gearMax(i),c=gearUpgradeCost(i,lv),holders=state.heroes.filter(h=>Object.values(h.equipment||{}).includes(id)).map(h=>h.name).join('、');return `<div class="forge-row rarity-${i.rarity}"><div><b>${i.name} +${lv}/${max}</b><span>${gearStatsText(i)}${holders?` · 裝備者：${holders}`:''}</span><small>${lv>=max?'已達此稀有度上限':costText(c)}</small></div><button data-upgrade-gear="${id}" ${lv>=max||!canPayMaterials(c)?'disabled':''}>${lv>=max?'MAX':'強化'}</button></div>`;}).join('')||'<p class="empty-note">沒有可強化裝備</p>';}
    if(mode==='reroll')body=sortGear(Object.keys(counts).map(id=>equipment.find(i=>i.id===id)).filter(Boolean)).map(i=>{const id=i.id,a=gearAffix(id),can=state.gold>=45&&state.materials.essence>=2;return `<div class="forge-row rarity-${i.rarity}"><div><b>${i.name}</b><span>目前詞綴「${a.name}」：${a.desc}</span><small>重鑄需 45 G、${materialDefs.essence.name}×2</small></div><button data-reroll-gear="${id}" ${can?'':'disabled'}>重鑄</button></div>`;}).join('')||'<p class="empty-note">背包中沒有可重鑄裝備</p>';
    if(mode==='dismantle')body=sortGear(Object.keys(counts).map(id=>equipment.find(i=>i.id===id)).filter(Boolean)).map(i=>{const id=i.id,n=counts[id],base=i.rarity==='legendary'?14:i.rarity==='epic'?8:i.rarity==='rare'?4:2,bonus=hasRenownPerk('salvage')?1.25:1;return `<div class="forge-row rarity-${i.rarity}"><div><b>${i.name}</b><span>持有 ${n} · 分解獲得鐵屑 ${Math.floor(base*bonus)}${i.rarity!=='common'?'、灰燼精華 '+Math.max(1,Math.floor(base/2*bonus)):''}</span></div><button data-dismantle="${id}" ${i.rarity==='legendary'?'disabled':''}>${i.rarity==='legendary'?'專武不可分解':'分解 1 件'}</button></div>`;}).join('')||'<p class="empty-note">背包中沒有可分解裝備</p>';
    if(mode==='legacy')body=sortGear(equipment.filter(i=>i.rarity==='legendary')).map(i=>{const h=state.heroes.find(x=>x.id===i.uniqueFor),owned=ownsGear(i.id),trial=legacyTrial(h);return `<div class="forge-row rarity-legendary"><div><b>${i.name}</b><span>${h.name}專屬 · ${gearStatsText(i)}<br>${i.desc}</span><small>${owned?'傳承已完成':`終局試煉：Lv.10 ${h.level>=10?'✓':'×'} · 二次突破 ${h.breakthrough>=2?'✓':'×'} · 職業專精 ${h.specialization?'✓':'×'} · 三項技能專精 ${trial.masteries}/3 · 深厚羈絆 ${trial.deepBond?'✓':'×'} · 聲望 ${state.renown}/650 · Boss ${state.campaign.bosses}/8 · 魔王情報 ${state.campaign.intel}/100`}</small></div><button data-claim-legacy="${i.id}" ${owned||!trial.ready?'disabled':''}>${owned?'已取得':'喚醒專武'}</button></div>`;}).join('');
    $('modal').classList.add('open');$('modal').setAttribute('aria-hidden','false');$('modalTitle').textContent='鐵匠鋪';
    $('modalBody').innerHTML=`<div class="forge-tabs"><button data-forge-tab="shop" class="${mode==='shop'?'active':''}">商店</button><button data-forge-tab="craft" class="${mode==='craft'?'active':''}">製作</button><button data-forge-tab="upgrade" class="${mode==='upgrade'?'active':''}">強化</button><button data-forge-tab="reroll" class="${mode==='reroll'?'active':''}">重鑄</button><button data-forge-tab="dismantle" class="${mode==='dismantle'?'active':''}">分解</button><button data-forge-tab="legacy" class="${mode==='legacy'?'active':''}">專武傳承</button></div><div class="forge-list">${body}</div>`;
    document.querySelectorAll('[data-forge-tab]').forEach(b=>b.addEventListener('click',()=>openForge(b.dataset.forgeTab)));
    document.querySelectorAll('[data-buy-gear]').forEach(b=>b.addEventListener('click',()=>buyGear(b.dataset.buyGear,+b.dataset.price)));
    document.querySelectorAll('[data-craft]').forEach(b=>b.addEventListener('click',()=>craftGear(b.dataset.craft)));
    document.querySelectorAll('[data-upgrade-gear]').forEach(b=>b.addEventListener('click',()=>upgradeGear(b.dataset.upgradeGear)));
    document.querySelectorAll('[data-reroll-gear]').forEach(b=>b.addEventListener('click',()=>rerollGear(b.dataset.rerollGear)));
    document.querySelectorAll('[data-dismantle]').forEach(b=>b.addEventListener('click',()=>dismantleGear(b.dataset.dismantle)));
    document.querySelectorAll('[data-claim-legacy]').forEach(b=>b.addEventListener('click',()=>claimLegacyGear(b.dataset.claimLegacy)));
  }
  function buyGear(id,price){const item=equipment.find(i=>i.id===id);if(!item||state.gold<price)return;state.gold-=price;state.inventory.push(id);ensureGearAffix(id);discover('equipment',id);save();openForge('shop');renderGuild();tone(700,.1);toast(`購得裝備：${item.name}`);}
  function craftGear(id){const item=equipment.find(i=>i.id===id),cost=item&&craftCost(item);if(!item||!canPayMaterials(cost))return;payMaterials(cost);state.inventory.push(id);ensureGearAffix(id);discover('equipment',id);progressDaily('craft');save();openForge('craft');renderGuild();tone(690,.12);toast(`製作完成：${item.name}`);}
  function upgradeGear(id,heroId){const item=equipment.find(i=>i.id===id),lv=state.gearLevels[id]||0,max=gearMax(item);if(!item||lv>=max)return;const cost=gearUpgradeCost(item,lv);if(!canPayMaterials(cost))return;payMaterials(cost);state.gearLevels[id]=lv+1;progressDaily('craft');save();heroId?openEquipment(heroId):openForge('upgrade');renderGuild();tone(760,.14);}
  function rerollGear(id){const current=gearAffix(id);if(!state.inventory.includes(id)||state.gold<45||state.materials.essence<2)return;state.gold-=45;state.materials.essence-=2;state.gearAffixes[id]=pick(gearAffixDefs.filter(a=>a.id!==current.id)).id;save();openForge('reroll');renderGuild();tone(580,.14);toast('裝備詞綴已重鑄');}
  function dismantleGear(id){const index=state.inventory.indexOf(id),item=equipment.find(i=>i.id===id);if(index<0||!item||item.rarity==='legendary')return;state.inventory.splice(index,1);const base=item.rarity==='epic'?8:item.rarity==='rare'?4:2,bonus=hasRenownPerk('salvage')?1.25:1;state.materials.scrap+=Math.floor(base*bonus);if(item.rarity!=='common')state.materials.essence+=Math.max(1,Math.floor(base/2*bonus));progressDaily('dismantle');save();openForge('dismantle');renderGuild();tone(320,.1);}
  function claimLegacyGear(id){const item=equipment.find(i=>i.id===id&&i.rarity==='legendary'),hero=item&&state.heroes.find(h=>h.id===item.uniqueFor);if(!item||!hero||!legacyTrial(hero).ready||ownsGear(id))return;state.inventory.push(id);ensureGearAffix(id);discover('equipment',id);addChronicle(`${hero.name}完成終局傳承試煉，專武「${item.name}」正式甦醒。`);save();openForge('legacy');renderGuild();tone(920,.22);toast(`${hero.name}喚醒專武：${item.name}`);}

  function toggleParty(id){
    if(state.activeParty.includes(id)){if(state.activeParty.length<=1)return toast('隊伍至少保留一人');state.activeParty=state.activeParty.filter(x=>x!==id);}
    else {if(state.activeParty.length>=3)return toast('遠征隊最多三人，請先移出一名角色');state.activeParty.push(id);}
    save();renderGuild();
  }

  function openParty(){const owned=state.heroes.filter(h=>h.owned);$('modal').classList.add('open');$('modal').setAttribute('aria-hidden','false');$('modalTitle').textContent='遠征隊伍與出戰順序';$('modalBody').innerHTML=`<p>第 1 位會最先行動。每名角色完成行動後依序輪替。</p><div class="party-order">${state.activeParty.map((id,index)=>{const h=state.heroes.find(x=>x.id===id);return `<article><b>${index+1}</b><span class="party-portrait" style="--accent:${h.color}"><img src="${portraitPath(h.id)}" alt="${h.name}頭像"></span><div><strong>${h.name}</strong><small>${h.job}</small></div><button data-party-up="${id}" ${index===0?'disabled':''}>↑</button><button data-party-down="${id}" ${index===state.activeParty.length-1?'disabled':''}>↓</button><button data-party-remove="${id}">移出</button></article>`;}).join('')}</div><span class="eyebrow">AVAILABLE</span><div class="party-bench">${owned.filter(h=>!state.activeParty.includes(h.id)).map(h=>`<button data-party-add="${h.id}" ${state.activeParty.length>=3?'disabled':''}><img src="${portraitPath(h.id)}" alt="">${h.name} · ${h.job}</button>`).join('')||'<small>所有成員都已編入隊伍</small>'}</div>`;document.querySelectorAll('[data-party-up]').forEach(b=>b.addEventListener('click',()=>moveParty(b.dataset.partyUp,-1)));document.querySelectorAll('[data-party-down]').forEach(b=>b.addEventListener('click',()=>moveParty(b.dataset.partyDown,1)));document.querySelectorAll('[data-party-remove]').forEach(b=>b.addEventListener('click',()=>{toggleParty(b.dataset.partyRemove);openParty();}));document.querySelectorAll('[data-party-add]').forEach(b=>b.addEventListener('click',()=>{toggleParty(b.dataset.partyAdd);openParty();}));}
  function moveParty(id,dir){const i=state.activeParty.indexOf(id),j=i+dir;if(i<0||j<0||j>=state.activeParty.length)return;[state.activeParty[i],state.activeParty[j]]=[state.activeParty[j],state.activeParty[i]];save();openParty();renderGuild();tone(520);}

  function openHeroPanel(heroId){
    const h=state.heroes.find(x=>x.id===heroId&&x.owned);if(!h)return;const scaled=scaledHero(h),spec=specInfo(h),active=state.activeParty.includes(h.id);
    $('modal').classList.remove('training-modal');
    document.querySelector('[data-hero-back]')?.remove();
    const gear=['weapon','armor','charm'].map(slot=>{const item=equipment.find(i=>i.id===h.equipment?.[slot]),affix=item&&gearAffix(item.id),lv=item?(state.gearLevels[item.id]||0):0;return `<article class="panel-gear ${item?`rarity-${item.rarity}`:''}"><small>${slotName(slot)}</small><b>${item?`${item.name} +${lv}/${gearMax(item)}`:'未裝備'}</b><span>${item?`${gearStatsText(item)}<br>${item.rarity!=='common'?`額外效果：${item.desc}<br>`:''}詞綴「${affix.name}」：${affix.desc}${item.set?`<br>套裝：${setBonusText(item.set)}`:''}`:'此欄位目前空白'}</span></article>`;}).join('');
    const skills=h.skills.map(base=>{const skill=trainedSkill(h,base),equipped=(h.activeSkills||[]).includes(base.id);return `<article class="panel-skill ${equipped?'equipped':''}"><div><b>${base.name}</b><em>${equipped?'已配置':'未配置'} · ${skill.damageType==='magic'?'魔法':skill.damage?'物理':'輔助'} · 強化 ${skill.rank}/3</em></div><span>${skillDetailText(h,skill)}</span></article>`;}).join('');
    const bonds=state.heroes.filter(x=>x.owned&&x.id!==h.id).map(x=>{const count=state.bonds[bondKey(h.id,x.id)]||0,lv=bondLevel(h.id,x.id);return `<article class="bond-entry"><b>${h.name} × ${x.name}</b><span>默契 ${count} · ${lv===2?'深厚羈絆':lv===1?'建立羈絆':'尚未建立'}</span><small>${lv===2?(bondSpecials[bondKey(h.id,x.id)]||'雙方生命 +3、雙威力 +1'):(lv===1?'同隊時雙方生命 +3':'共同完成 3 次遠征後生效')}</small></article>`;}).join('');
    $('modal').classList.add('open','hero-panel-modal');$('modal').setAttribute('aria-hidden','false');$('modalTitle').textContent=`${h.name} · 完整角色面板`;
    $('modalBody').innerHTML=`<section class="character-overview"><div class="character-mark" style="color:${h.color}">${h.icon}</div><div><span class="eyebrow">${h.job} · Lv.${h.level}</span><h3>${spec?.name||'尚未選擇專精'}</h3><p>${spec?.desc|| (h.level>=3?'已可選擇職業專精':'角色達到 Lv.3 後可選擇專精')}</p>${h.injury?`<div class="injury-tag">${h.injury.name} · ${h.injury.desc} · ${h.injury.days} 日</div>`:''}</div></section><section class="character-stat-grid"><article><small>生命</small><b>${scaled.maxHp}</b></article><article><small>技能點</small><b>${scaled.maxSp}</b></article><article><small>物理威力</small><b>${scaled.physicalPower}</b></article><article><small>魔法威力</small><b>${scaled.magicPower}</b></article><article><small>經驗</small><b>${h.xp}/${h.level*45}</b></article><article><small>能力結晶</small><b>${state.materials.growthCrystal}</b></article></section><section class="character-attributes"><span>體魄 <b>${h.attributes.vitality||0}</b></span><span>力量 <b>${h.attributes.might||0}</b></span><span>魔力 <b>${h.attributes.magic||0}</b></span><span>專注 <b>${h.attributes.focus||0}</b></span></section><div class="character-actions"><button data-panel-party>${active?'移出隊伍':'編入隊伍'}</button><button data-panel-gear>管理裝備</button><button data-panel-skills>配置／強化技能</button><button data-panel-attributes>分配能力</button>${!spec&&h.level>=3?'<button data-panel-spec>選擇專精</button>':''}</div><span class="eyebrow panel-heading">EQUIPMENT</span><div class="panel-gear-grid">${gear}</div><span class="eyebrow panel-heading">ULTIMATE</span><article class="panel-ultimate"><b>✦ ${h.ultimate.name}</b><span>${skillDetailText(h,h.ultimate)}</span></article><span class="eyebrow panel-heading">ALL SKILLS</span><div class="panel-skill-grid">${skills}</div>`;
    const crystalValue=document.querySelector('.character-stat-grid article:nth-child(6) b');if(crystalValue)crystalValue.textContent=h.abilityCrystals||0;
    const characterMark=document.querySelector('.character-mark');if(characterMark){characterMark.classList.add('has-art');characterMark.innerHTML=`<img src="${portraitPath(h.id,'half')}" alt="${h.name}半身立繪">`;}
    document.querySelector('.character-actions')?.insertAdjacentHTML('beforeend',`<button data-panel-talents>天賦樹 (${talentPoints(h)} 點)</button>${h.level>=breakthroughCap(h)&&h.breakthrough<2?'<button data-panel-breakthrough>角色突破</button>':''}`);
    $('modalBody').insertAdjacentHTML('beforeend',`<span class="eyebrow panel-heading">BONDS · 羈絆</span><div class="bond-grid">${bonds||'<p class="empty-note">尚無其他成員</p>'}</div><div class="breakthrough-status">突破階段 <b>${h.breakthrough||0}/2</b> · 等級上限 <b>Lv.${breakthroughCap(h)}</b></div>`);
    document.querySelector('[data-panel-party]')?.addEventListener('click',()=>{toggleParty(h.id);openHeroPanel(h.id);});
    document.querySelector('[data-panel-gear]')?.addEventListener('click',()=>{scheduleHeroBack(h.id);openEquipment(h.id);});
    document.querySelector('[data-panel-skills]')?.addEventListener('click',()=>{scheduleHeroBack(h.id);openTraining(h.id);});
    document.querySelector('[data-panel-attributes]')?.addEventListener('click',()=>{scheduleHeroBack(h.id);openAttributes(h.id);});
    document.querySelector('[data-panel-talents]')?.addEventListener('click',()=>{scheduleHeroBack(h.id);openTalents(h.id);});
    document.querySelector('[data-panel-breakthrough]')?.addEventListener('click',()=>{scheduleHeroBack(h.id);openBreakthrough(h.id);});
    document.querySelector('[data-panel-spec]')?.addEventListener('click',()=>{scheduleHeroBack(h.id);openSpecialization(h.id);});
  }

  function openAttributes(heroId){const h=state.heroes.find(x=>x.id===heroId);if(!h)return;const attrs=[['vitality','體魄','每點生命 +6'],['might','力量','每點物理威力 +2'],['magic','魔力','每點魔法威力 +2'],['focus','專注','每 3 點技能點上限 +1']];$('modal').classList.add('open');$('modal').setAttribute('aria-hidden','false');$('modalTitle').textContent=`${h.name} · 能力培養`;$('modalBody').innerHTML=`<p>${h.name}的能力結晶：<b>${h.abilityCrystals||0}</b>。角色每次升級固定獲得 1 枚，只能由本人使用。</p><div class="attribute-list">${attrs.map(([id,name,desc])=>`<article><div><b>${name}</b><span>${desc}</span></div><strong>${h.attributes[id]||0}</strong><button data-add-attribute="${id}" ${(h.abilityCrystals||0)<=0?'disabled':''}>＋</button></article>`).join('')}</div>`;document.querySelectorAll('[data-add-attribute]').forEach(b=>b.addEventListener('click',()=>addAttribute(heroId,b.dataset.addAttribute)));}
  function addAttribute(heroId,id){const h=state.heroes.find(x=>x.id===heroId);if(!h||!['vitality','might','magic','focus'].includes(id)||(h.abilityCrystals||0)<=0)return;h.abilityCrystals--;h.attributes[id]=(h.attributes[id]||0)+1;save();openAttributes(heroId);renderGuild();tone(660);}

  function openTalents(heroId){
    const h=state.heroes.find(x=>x.id===heroId);if(!h)return;
    $('modal').classList.add('open','hero-panel-modal');$('modal').setAttribute('aria-hidden','false');$('modalTitle').textContent=`${h.name} · 天賦樹`;
    const trees=talentDefs[h.id].map(([name,nodes])=>`<section class="talent-branch"><h3>${name}</h3>${nodes.map((n,i)=>{const learned=h.talents.includes(n[0]),locked=i>0&&!h.talents.includes(nodes[i-1][0]);return `<button class="talent-node ${learned?'learned':''}" data-talent="${n[0]}" ${learned||locked||talentPoints(h)<=0?'disabled':''}><b>${learned?'◆':'◇'} ${n[1]}</b><span>${n[2]}</span>${locked?'<small>需先學習前置天賦</small>':''}</button>`;}).join('')}</section>`).join('');
    $('modalBody').innerHTML=`<p>每兩級獲得 1 點天賦；每條路線需依序學習。可用金幣重置並重新配置。</p><div class="material-inline">可用天賦點 <b>${talentPoints(h)}</b>　已投入 <b>${h.talents.length}</b></div><div class="talent-grid">${trees}</div><button class="action-btn secondary" data-reset-talents ${!h.talents.length||state.gold<40?'disabled':''}>重置天賦 · 40 G</button>`;
    document.querySelectorAll('[data-talent]').forEach(b=>b.addEventListener('click',()=>learnTalent(heroId,b.dataset.talent)));document.querySelector('[data-reset-talents]')?.addEventListener('click',()=>resetTalents(heroId));
  }
  function learnTalent(heroId,id){const h=state.heroes.find(x=>x.id===heroId),branch=talentDefs[h?.id]?.find(([,nodes])=>nodes.some(n=>n[0]===id)),index=branch?.[1].findIndex(n=>n[0]===id);if(!h||!branch||h.talents.includes(id)||talentPoints(h)<=0||index>0&&!h.talents.includes(branch[1][index-1][0]))return;h.talents.push(id);save();openTalents(heroId);renderGuild();tone(720);}
  function resetTalents(heroId){const h=state.heroes.find(x=>x.id===heroId);if(!h||!h.talents.length||state.gold<40)return;state.gold-=40;h.talents=[];save();openTalents(heroId);renderGuild();toast('天賦已重置');}
  function openBreakthrough(heroId){const h=state.heroes.find(x=>x.id===heroId);if(!h)return;const stage=h.breakthrough||0,cost=stage===0?{gold:120,bossCore:1}:{gold:260,bossCore:2},can=h.level>=breakthroughCap(h)&&stage<2&&state.gold>=cost.gold&&canPayMaterials({bossCore:cost.bossCore});$('modal').classList.add('open');$('modal').setAttribute('aria-hidden','false');$('modalTitle').textContent=`${h.name} · 角色突破`;$('modalBody').innerHTML=`<p>突破解除等級上限並覺醒永久被動，也額外獲得 1 點天賦。能力結晶只用於本人能力加點，不再作為突破貨幣。</p><div class="breakthrough-card"><b>第 ${stage+1} 次突破</b><span>${stage===0?'覺醒：物理與魔法威力 +2，等級上限提升至 10':'覺醒：生命 +10、開戰絕招量表 25%，等級上限提升至 15'}</span><small>${cost.gold} G · ${materialDefs.bossCore.name}×${cost.bossCore}</small><button class="action-btn" data-breakthrough ${can?'':'disabled'}>進行突破</button></div>`;document.querySelector('[data-breakthrough]')?.addEventListener('click',()=>breakthroughHero(heroId));}
  function breakthroughHero(heroId){const h=state.heroes.find(x=>x.id===heroId),stage=h?.breakthrough||0,cost=stage===0?{gold:120,bossCore:1}:{gold:260,bossCore:2};if(!h||stage>=2||h.level<breakthroughCap(h)||state.gold<cost.gold||!canPayMaterials({bossCore:cost.bossCore}))return;state.gold-=cost.gold;payMaterials({bossCore:cost.bossCore});h.breakthrough++;h.bonusTalentPoints=(h.bonusTalentPoints||0)+1;save();openHeroPanel(heroId);renderGuild();tone(880,.2);toast(`${h.name}完成突破！`);}

  function scaledHero(h) {
    const spec=specInfo(h);
    const gear=Object.values(h.equipment||{}).map(id=>equipment.find(i=>i.id===id)).filter(Boolean);
    const affixes=gear.map(i=>gearAffix(i.id)).filter(Boolean),sets=setCounts(h);
    const gearHp=gear.reduce((n,i)=>n+(i.hp||0)+(state.gearLevels[i.id]||0)*2,0)+affixes.reduce((n,a)=>n+(a.hp||0),0), gearPhysical=gear.reduce((n,i)=>n+(i.physicalPower||0)+(i.slot==='weapon'?(state.gearLevels[i.id]||0):0),0)+affixes.reduce((n,a)=>n+(a.physicalPower||0),0), gearMagic=gear.reduce((n,i)=>n+(i.magicPower||0)+(i.slot==='weapon'?(state.gearLevels[i.id]||0):0),0)+affixes.reduce((n,a)=>n+(a.magicPower||0),0), gearSp=gear.reduce((n,i)=>n+(i.sp||0),0)+affixes.reduce((n,a)=>n+(a.sp||0),0);
    const captain=state.activeParty.includes('tor')&&state.heroes.find(x=>x.id==='tor')?.specialization==='captain';
    const specPhysical={breaker:3,deadeye:4,vanguard:3}[spec?.id]||0;const specMagic={storm:4,inquisitor:4}[spec?.id]||0;
    const specHp=(spec?.id==='bulwark'?20:0)+(spec?.id==='saint'?10:0)+(captain?8:0);
    const bondMates=state.activeParty.filter(id=>id!==h.id&&bondLevel(h.id,id)>0).length,bondMasters=state.activeParty.filter(id=>id!==h.id&&bondLevel(h.id,id)>1).length;
    const breakPower=(h.breakthrough||0)>=1?2:0,breakHp=(h.breakthrough||0)>=2?10:0;
    return { ...h, skills:h.skills.filter(s=>(h.activeSkills||h.skills.slice(0,4).map(x=>x.id)).includes(s.id)), maxHp: Math.max(20,h.maxHp + (h.level - 1) * 5 +(h.attributes?.vitality||0)*6+specHp+gearHp+heroEffect(h,'hpBoost')+breakHp+bondMates*3+(sets.frontier>=2?8:0)+(h.injury?.hp||0)), maxSp:Math.max(1,h.maxSp+gearSp+(sets.ash>=2?1:0)+Math.floor((h.attributes?.focus||0)/3)+(h.injury?.sp||0)), physicalPower:Math.max(2,h.physicalPower+(h.level-1)+(h.attributes?.might||0)*2+specPhysical+gearPhysical+heroEffect(h,'physicalBoost')+breakPower+bondMasters+(sets.moon>=2?2:0)+(h.injury?.physicalPower||0)),magicPower:Math.max(2,h.magicPower+(h.level-1)+(h.attributes?.magic||0)*2+specMagic+gearMagic+heroEffect(h,'magicBoost')+breakPower+bondMasters+(sets.ash>=2?2:0)+(h.injury?.magicPower||0)) };
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
    const equipped=slots.map(slot=>{const item=equipment.find(i=>i.id===hero.equipment?.[slot]),lv=item?(state.gearLevels[item.id]||0):0,c=item&&gearUpgradeCost(item,lv);return `<div class="gear-slot ${item?`rarity-${item.rarity}`:''}"><span>${slotName(slot)}</span>${item?`<b>${item.name} +${lv}/${gearMax(item)}</b><em>${rarityName(item)}${item.uniqueFor?' · 專武':''}</em><small>${gearStatsText(item)}${item.rarity!=='common'?`<br>額外效果：${item.desc}`:''}</small><div class="gear-progress"><i style="width:${lv/gearMax(item)*100}%"></i></div><button data-upgrade-equipped="${item.id}" ${lv>=gearMax(item)||!canPayMaterials(c)?'disabled':''}>${lv>=gearMax(item)?'強化完成':`強化 · ${costText(c)}`}</button><button data-unequip="${slot}">卸下</button>`:'<b>— 空欄位 —</b>'}</div>`;}).join('');
    const counts=state.inventory.reduce((m,id)=>(m[id]=(m[id]||0)+1,m),{});
    const usable=sortGear(Object.keys(counts).map(id=>equipment.find(i=>i.id===id)).filter(i=>i&&(!i.jobs||i.jobs.includes(hero.job))&&(!i.uniqueFor||i.uniqueFor===hero.id)));
    $('modalBody').innerHTML=`<div class="gear-slots">${equipped}</div><span class="eyebrow">可裝備物品</span><div class="inventory-list">${usable.map(i=>`<button class="inventory-item rarity-${i.rarity}" data-equip="${i.id}"><b>${i.name} +${state.gearLevels[i.id]||0}/${gearMax(i)}${counts[i.id]>1?` ×${counts[i.id]}`:''} <em>${rarityName(i)}</em></b><span>${slotName(i.slot)} · ${gearStatsText(i)}${i.rarity!=='common'?` · ${i.desc}`:''}</span></button>`).join('')||'<p class="empty-note">背包中沒有此角色可使用的裝備</p>'}</div>`;
    document.querySelectorAll('[data-equip]').forEach(b=>b.addEventListener('click',()=>equipItem(heroId,b.dataset.equip)));
    document.querySelectorAll('[data-unequip]').forEach(b=>b.addEventListener('click',()=>unequipItem(heroId,b.dataset.unequip)));
    document.querySelectorAll('[data-upgrade-equipped]').forEach(b=>b.addEventListener('click',()=>upgradeGear(b.dataset.upgradeEquipped,heroId)));
  }

  function equipItem(heroId,itemId){const hero=state.heroes.find(h=>h.id===heroId);const item=equipment.find(i=>i.id===itemId);const index=state.inventory.indexOf(itemId);if(!hero||!item||index<0||item.jobs&&!item.jobs.includes(hero.job)||item.uniqueFor&&item.uniqueFor!==hero.id)return;if(hero.equipment[item.slot])state.inventory.push(hero.equipment[item.slot]);hero.equipment[item.slot]=itemId;state.inventory.splice(index,1);save();openEquipment(heroId);renderGuild();tone(600);}
  function unequipItem(heroId,slot){const hero=state.heroes.find(h=>h.id===heroId);const id=hero?.equipment?.[slot];if(!hero||!id)return;state.inventory.push(id);hero.equipment[slot]=null;save();openEquipment(heroId);renderGuild();}

  function trainedSkill(hero,base){
    const rank=hero.skillRanks?.[base.id]||0,skill={...base,rank};
    if(rank>=1)['damage','heal','healAll','shield','stagger','powerAll'].forEach(k=>{if(skill[k])skill[k]=Math.round(skill[k]*1.15*100)/100;});
    if(rank>=2)skill.cost=Math.max(0,skill.cost-1);
    const evo=rank>=3?hero.skillEvolutions?.[base.id]:null,category=skillCategory(base);
    if(evo==='force'){const keys=category==='sustain'?['heal','healAll','regenAll','reviveAll']:category==='buff'?['shield','powerAll','guardAll','counter']:['damage','stagger'];keys.forEach(k=>{if(skill[k])skill[k]=Math.round(skill[k]*(category==='single'?1.25:1.2)*100)/100;});if(category==='debuff')skill.stagger=(skill.stagger||0)+10;}
    if(evo==='tactics'){if(category==='single')skill.vulnerable=Math.max(skill.vulnerable||0,1);else if(category==='aoe')skill.weaken=(skill.weaken||0)+1;else if(category==='sustain')skill.cleanseAll=true;else if(category==='buff')skill.buffTurns=(skill.buffTurns||2)+1;else {let applied=false;['vulnerable','burn','blind'].forEach(k=>{if(skill[k]){skill[k]++;applied=true;}});if(skill.weaken){skill.weaken++;applied=true;}if(skill.armorBreak){skill.armorBreak++;applied=true;}if(!applied)skill.restoreSelf=(skill.restoreSelf||0)+1;}}
    if(skill.shield)skill.shield+=heroEffect(hero,'shieldBoost')+(hasTrait(hero,'branLegacy')?12:0);if(skill.guardAll)skill.guardAll+=heroEffect(hero,'guardBoost');if(skill.counter)skill.counter+=heroEffect(hero,'counterBoost')+(hasTrait(hero,'branLegacy')?10:0);
    if(skill.stagger)skill.stagger=Math.round(skill.stagger*(1+heroEffect(hero,'staggerRate'))+heroEffect(hero,'staggerFlat'));if(skill.weaken)skill.weaken+=heroEffect(hero,'weakenBoost');
    if(skill.vulnerable)skill.vulnerable+=heroEffect(hero,'debuffTurns');if(skill.burn)skill.burn+=heroEffect(hero,'burnTurns');if(skill.blind)skill.blind+=heroEffect(hero,'blindTurns');if(skill.armorBreak)skill.armorBreak+=heroEffect(hero,'armorBreakBoost');
    if(skill.powerAll)skill.powerAll+=heroEffect(hero,'buffPower');if(skill.buffTurns)skill.buffTurns+=heroEffect(hero,'buffTurns')+(hasTrait(hero,'torLegacy')?1:0);if(skill.restoreAll)skill.restoreAll+=heroEffect(hero,'restoreBoost');if(skill.regenAll)skill.regenAll+=heroEffect(hero,'regenBoost');
    skill.healRate=heroEffect(hero,'healRate')+(hasTrait(hero,'senaLegacy')?.2:0)+(hasTrait(hero,'aldaLegacy')?.25:0);if(hasTrait(hero,'aldaLegacy')&&skill.shield)skill.shield=Math.round(skill.shield*1.25);skill.burnDamage=7+heroEffect(hero,'burnDamage')+(hasTrait(hero,'cinder')?2:0)+(hasTrait(hero,'senaLegacy')?6:0);return skill;
  }
  function skillCategory(skill){if(skill.heal||skill.healAll||skill.regenAll||skill.reviveAll)return 'sustain';if(skill.powerAll||skill.guardAll||skill.shield||skill.taunt||skill.counter||skill.dodge||skill.restoreAll)return 'buff';if(!skill.damage&&(skill.vulnerable||skill.burn||skill.blind||skill.weaken||skill.armorBreak))return 'debuff';return skill.target==='enemies'?'aoe':'single';}
  function skillEvolutionText(skill,choice){const c=skillCategory(skill),texts={single:['決殺專精：單體傷害／破勢 +25%','獵隙專精：命中後附加 1 回合易傷'],aoe:['掃蕩專精：全體傷害／破勢 +20%','壓制專精：全體附加威力 -1'],sustain:['聖療專精：治療與再生 +20%','淨化專精：同時清除全隊中毒'],buff:['鼓舞專精：護盾與增益強度 +20%','延續專精：增益持續時間 +1 回合'],debuff:['崩解專精：額外造成 10 破勢','侵蝕專精：負面狀態延長 1 回合']};return texts[c][choice==='force'?0:1];}
  function skillDetailText(hero,skill){
    const targetNames={enemy:'單體敵人',enemies:'全體敵人',self:'自身',allies:'全體友軍',lowest:'生命最低友軍'};
    const source=hero?.hp!==undefined?hero:scaledHero(hero);const power=skill.damageType==='magic'?source.magicPower:source.physicalPower;
    const parts=[`目標：${targetNames[skill.target]||'特殊'}`];
    if(skill.damage){const type=skill.damageType==='magic'?'魔法':'物理';const estimate=Math.round(power*skill.damage);parts.push(`${type}威力 ×${skill.damage}（約 ${estimate} 傷害／防禦前）`);}
    if(skill.heal)parts.push(`治療 ${skill.heal}`);
    if(skill.healAll)parts.push(`全隊治療 ${skill.healAll}`);
    if(skill.shield)parts.push(`護盾 ${skill.shield}`);
    if(skill.stagger)parts.push(`破勢 ${skill.stagger}`);else if(skill.damage)parts.push('破勢 4');
    if(skill.vulnerable)parts.push(`易傷 ${skill.vulnerable} 回合（承傷 +35%）`);
    if(skill.burn)parts.push(`燃燒 ${skill.burn} 回合（每回合 ${skill.burnDamage||7}）`);
    if(skill.taunt)parts.push('嘲諷本輪攻擊');
    if(skill.counter)parts.push(`下次受擊反傷 ${skill.counter}`);
    if(skill.dodge)parts.push('閃避下次攻擊');
    if(skill.restoreSelf)parts.push(`自身技能點 +${skill.restoreSelf}`);
    if(skill.restoreAll)parts.push(`全隊技能點 +${skill.restoreAll}`);
    if(skill.regenAll)parts.push(`全隊每回合恢復 ${skill.regenAll}，持續 3 回合`);
    if(skill.powerAll)parts.push(`全隊物理／魔法威力 +${skill.powerAll}，持續 ${skill.buffTurns||2} 回合`);
    if(skill.guardAll)parts.push(`全隊承傷 -${Math.round(skill.guardAll*100)}%，持續 ${skill.buffTurns||2} 回合`);
    if(skill.cleanseAll)parts.push('清除全隊中毒');
    if(skill.reviveAll)parts.push(`復甦倒下隊友至 ${Math.round(skill.reviveAll*100)}% 生命`);
    if(skill.pierce)parts.push('無視護甲');
    if(skill.weaken)parts.push(`永久降低敵人威力 ${skill.weaken}`);
    if(skill.blind)parts.push(`致盲 ${skill.blind} 回合（造成傷害 -30%）`);
    if(skill.armorBreak)parts.push(`永久降低護甲 ${skill.armorBreak}`);
    if(skill.statusScale)parts.push('目標每有易傷、燃燒或失衡其中 1 種，傷害 +20%');
    if(skill.ultimateExecute)parts.push('目標生命 ≤50% 時，傷害 +35%');
    return parts.join(' · ');
  }
  function openTraining(heroId){
    const hero=state.heroes.find(h=>h.id===heroId&&h.owned);if(!hero)return;
    $('modal').classList.add('open','training-modal');$('modal').setAttribute('aria-hidden','false');$('modalTitle').textContent=`${hero.name}的技能配置`;
    const active=hero.activeSkills||hero.skills.slice(0,4).map(s=>s.id);
    const slots=active.map((id,index)=>`<label>技能欄 ${index+1}<select data-skill-slot="${index}">${hero.skills.map(s=>`<option value="${s.id}" ${s.id===id?'selected':''}>${s.name}</option>`).join('')}</select></label>`).join('');
    $('modalBody').innerHTML=`<p>從六項技能中配置四項出戰技能。每招可強化三次；第三次後再選擇符合技能類型的永久專精。</p><div class="material-inline">戰技殘頁 <b>${state.materials.skillDust}</b>　奧義印記 <b>${state.materials.skillCore}</b></div><div class="loadout-grid">${slots}</div><article class="ultimate-preview"><span>絕招</span><b>${hero.ultimate.name}</b><small>${skillDetailText(hero,{...hero.ultimate,cost:0})}</small></article><div class="training-list">${hero.skills.map(s=>{const rank=hero.skillRanks?.[s.id]||0,cost=skillUpgradeCost(rank),trained=trainedSkill(hero,s);return `<div class="training-skill"><div><b>${s.name}</b><span>${skillDetailText(hero,trained)}</span></div><em>${'◆'.repeat(rank)}${'◇'.repeat(3-rank)}</em><button data-upgrade-skill="${s.id}" ${rank>=3||!canPayMaterials(cost)?'disabled':''}>${rank>=3?'等待專精':costText(cost)}</button></div>`;}).join('')}</div>`;
    document.querySelectorAll('.training-skill').forEach((card,index)=>{const s=hero.skills[index],rank=hero.skillRanks?.[s.id]||0,evo=hero.skillEvolutions?.[s.id];if(rank>=3)card.insertAdjacentHTML('beforeend',evo?`<small class="evolution-chosen">專精：${skillEvolutionText(s,evo)}</small>`:`<div class="evolution-options"><button data-evolve-skill="${s.id}" data-evolution="force">${skillEvolutionText(s,'force')}</button><button data-evolve-skill="${s.id}" data-evolution="tactics">${skillEvolutionText(s,'tactics')}</button></div>`);});
    document.querySelectorAll('[data-upgrade-skill]').forEach(b=>b.addEventListener('click',()=>upgradeSkill(heroId,b.dataset.upgradeSkill)));
    document.querySelectorAll('[data-skill-slot]').forEach(s=>s.addEventListener('change',()=>setSkillSlot(heroId,+s.dataset.skillSlot,s.value)));
    document.querySelectorAll('[data-evolve-skill]').forEach(b=>b.addEventListener('click',()=>chooseSkillEvolution(heroId,b.dataset.evolveSkill,b.dataset.evolution)));
  }
  function setSkillSlot(heroId,index,skillId){const hero=state.heroes.find(h=>h.id===heroId);if(!hero||!hero.skills.some(s=>s.id===skillId))return;if(hero.activeSkills.some((id,i)=>id===skillId&&i!==index)){toast('同一技能不能重複裝備');return openTraining(heroId);}hero.activeSkills[index]=skillId;save();openTraining(heroId);tone(540);}
  function skillUpgradeCost(rank){return rank===0?{skillDust:4}:rank===1?{skillDust:10,skillCore:1}:{skillDust:18,skillCore:2};}
  function upgradeSkill(heroId,skillId){const hero=state.heroes.find(h=>h.id===heroId);const rank=hero?.skillRanks?.[skillId]||0,cost=skillUpgradeCost(rank);if(!hero||rank>=3||!canPayMaterials(cost))return;payMaterials(cost);hero.skillRanks[skillId]=rank+1;save();openTraining(heroId);renderGuild();tone(700);}
  function chooseSkillEvolution(heroId,skillId,choice){const hero=state.heroes.find(h=>h.id===heroId);if(!hero||hero.skillRanks?.[skillId]<3||hero.skillEvolutions?.[skillId]||!['force','tactics'].includes(choice))return;hero.skillEvolutions[skillId]=choice;save();openTraining(heroId);tone(820,.16);toast('技能已完成三階專精');}

  function startExpedition(id) {
    const contract = state.contracts.find(c => c.id === id); if (!contract) return;
    if(state.activeParty.length!==3)return toast('請先編成三人遠征隊');
    const selected=state.activeParty.map(id=>state.heroes.find(h=>h.id===id&&h.owned)).filter(Boolean);if(selected.length!==3)return toast('隊伍資料異常，請重新編成');
    discover('zones',contract.zone);
    expedition = { contract, node: 0, total: contract.nodes, modifier: dailyModifier().id, relics: [], lootItems:[], party: selected.map(h => {const scaled=scaledHero(h);return { ...scaled, hp: scaled.maxHp, sp: scaled.maxSp, shield: 0, burn: 0, poison: 0, vulnerable: 0, frail:0, powerBuff:0, powerBuffTurns:0, guardBuff:0, guardBuffTurns:0, taunt: false, ultCharge:0, counter:0, dodge:false, regenTurns:0, regenAmount:0, laststandUsed:false };}), earned: 0 };
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
    if(hasRenownPerk('routes')){const extra=alternatives.find(x=>!options.some(o=>o.id===x.id));if(extra)options.push(extra);}
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
        { label: state.supplies > 0 ? '交換補給' : '補給不足', disabled: state.supplies <= 0, action: () => { state.supplies--; expedition.party.forEach(h => {h.physicalPower+=2;h.magicPower+=2;}); nextNode('護符令全隊雙威力提升'); } },
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
    const c = expedition.contract;let encounter=expedition.encounter||'skirmish';const final=expedition.node===expedition.total-1;if(final)encounter='boss';const count = encounter==='skirmish'?Math.min(2,c.risk):c.risk === 1 ? rand(1,2) : rand(2, Math.min(3,c.risk));
    let types = Array.from({ length: count }, () => pick(c.pool));
    if(final)types=[state.campaign.intel>=100&&c.zone==='灰冠遺跡'&&!state.campaign.demonDefeated?'demonking':zoneBosses[c.zone]||'warden'];
    const enemies = types.map((type, i) => {
      const t = enemyTemplates[type]; const scale = 1 + (state.day - 1) * .035+c.risk*.08; const hpScale = (expedition.modifier === 'fortified' ? 1.15 : 1)*(t.boss?1.15:1);
      const maxHp = Math.round(t.hp * scale * hpScale);
      const seasonalElite=currentSeason().id==='beast'?.12:currentSeason().id==='longnight'&&expedition.node===expedition.total-1?.18:0;
      const threatElite=(state.regions[c.zone]?.threat||0)/500;
      const eliteChance=encounter==='elite'?1:(c.risk===3?.55:c.risk===2?.28:0)+(difficulties[state.difficulty]?.elite||0)+seasonalElite+threatElite; const affix=!t.boss&&Math.random()<eliteChance?pick(eliteAffixes):null;
      return { ...t, power: Math.round((t.power + (expedition.modifier === 'cruel' ? 2 : 0))*scale), id: `${type}-${i}`, type, maxHp, hp: maxHp, stagger: 0, shield: 0, burn: 0, vulnerable: 0, stunned: 0, weaken: 0, blind:0, armorBreak:0, intent: null, affix, affixTriggered:false, phase2:false };
    });
    types.forEach(type=>discover('enemies',type));save();
    expedition.party.forEach(h => {
      const affixShield=Object.values(h.equipment||{}).reduce((n,id)=>n+(gearAffix(id)?.startShield||0),0),oathShield=setCounts(h).oath>=2?8:0;
      h.shield = (expedition.relics.includes('ward') ? 8 : 0)+(hasTrait(h,'warding')?10:0)+affixShield+oathShield;
      h.focusUsed=false; h.evasionUsed=false;h.counter=0;h.dodge=false;h.regenTurns=0;
      if((h.breakthrough||0)>=2)h.ultCharge=Math.max(h.ultCharge||0,25);
      if (expedition.modifier === 'tailwind') h.sp = Math.min(h.maxSp, h.sp + 1);
      if (h.specialization === 'vanguard') h.sp = Math.min(h.maxSp, h.sp + 1);
    });
    if(expedition.party.some(h=>hasTrait(h,'command'))) expedition.party.forEach(h=>h.sp=Math.min(h.maxSp,h.sp+1));
    if(expedition.party.some(h=>hasTrait(h,'firstcommand')))expedition.party.forEach(h=>{h.powerBuff=Math.max(h.powerBuff||0,1);h.powerBuffTurns=Math.max(h.powerBuffTurns||0,1);});
    if(expedition.party.some(h=>hasTrait(h,'torLegacy')))expedition.party.forEach(h=>{h.powerBuff=Math.max(h.powerBuff||0,2);h.powerBuffTurns=Math.max(h.powerBuffTurns||0,2);});
    combat = { enemies, heroIndex: 0, round: 1, encounter, heroTurns:0, log: [encounter==='boss'?'區域首領現身——這不是能輕忽的戰鬥。':encounter==='elite'?'你們循跡找到精英敵人。':'遭遇敵人。先觀察他們的行動意圖。'], locked: false };
    planIntents(); beginHeroTurn();
  }

  function bossIntent(e){
    const r=Math.random(),p=e.phase2,round=combat.round;
    if(e.type==='direalpha')return p?(r<.72?{type:'multi',value:Math.round(e.power*.82),hits:3,label:'血月連獵：隨機三擊'}:{type:'howl',value:3,label:'狼王長嚎：全隊脆弱 3 回合'}):(r<.24?{type:'maul',value:Math.round(e.power*.9),duration:3,label:'獵殺印記：傷害＋脆弱 3 回合'}:{type:r<.62?'heavy':'attack',value:r<.62?Math.round(e.power*1.45):e.power+3,label:r<.62?'裂骨撲殺':'迅猛爪擊'});
    if(e.type==='miremother')return p?(r<.68?{type:'brood',value:7,label:'腐卵爆發：全隊傷害＋中毒'}:{type:'molt',value:30,label:'蛻殼再生：治療並獲得護盾'}):(r<.22?{type:'plague',duration:3,label:'孢子瘴氣：全隊中毒 3 回合'}:{type:r<.62?'venom':'heavy',value:r<.62?Math.round(e.power*1.05):Math.round(e.power*1.4),label:r<.62?'腐蝕毒牙':'母巢重壓'});
    if(e.type==='warmachine')return p?(r<.7?{type:'siege',value:Math.round(e.power*1.65),shield:24,label:'攻城模式：裝甲充能後重砲'}:{type:'overload',value:Math.round(e.power*.65),label:'核心過載：全隊震擊'}):(r<.2?{type:'guard',value:24,label:'灰鐵壁壘：護盾 24'}:{type:r<.58?'sunder':'heavy',value:r<.58?Math.round(e.power*1.15):Math.round(e.power*1.5),label:r<.58?'液壓破盾錘':'攻城重拳'});
    if(e.type==='archcultist')return p?(r<.65?{type:'doom',value:Math.round(e.power*.72),duration:3,label:'黑冠末日：全隊傷害＋脆弱'}:{type:'drainall',value:Math.round(e.power*.55),label:'群體獻祭：汲取全隊生命'}):(r<.23?{type:'curse',value:3,label:'長夜烙印：脆弱 3 回合'}:{type:r<.6?'drain':'heavy',value:r<.6?e.power:Math.round(e.power*1.45),label:r<.6?'祭血虹吸':'暗焰轟擊'});
    if(e.type==='stormroc')return p?(r<.7?{type:'tempest',value:Math.round(e.power*.72),label:'風災領域：全隊傷害＋技能點 -1'}:{type:'skyfall',value:Math.round(e.power*1.9),label:'墜空獵殺：猛烈單體攻擊'}):(r<.2?{type:'disrupt',value:2,label:'裂空尖嘯：技能點 -2'}:{type:r<.58?'multi':'heavy',value:r<.58?Math.round(e.power*.72):Math.round(e.power*1.5),hits:r<.58?2:1,label:r<.58?'疾風雙襲':'雷翼俯衝'});
    if(e.type==='demonking')return p?(round%3===0?{type:'doom',value:12,duration:3,label:'灰冠敕令：全隊傷害＋脆弱'}:round%2===0?{type:'tempest',value:11,label:'王座風暴：全隊傷害＋技能點 -1'}:{type:'multi',value:18,hits:3,label:'魔劍三連斬'}):(r<.2?{type:'curse',value:3,label:'魔王凝視：脆弱 3 回合'}:{type:r<.55?'heavy':'multi',value:r<.55?Math.round(e.power*1.5):Math.round(e.power*.7),hits:2,label:r<.55?'灰冠斬':'雙重魔刃'});
    return null;
  }

  function planIntents() {
    const special=difficulties[state.difficulty]?.special||0;
    combat.enemies.filter(e => e.hp > 0).forEach(e => {
      if(e.affix?.id==='regenerator'&&e.hp<e.maxHp)e.hp=Math.min(e.maxHp,e.hp+6);
      if(e.affix?.id==='armored')e.shield+=8;
      if(e.boss&&!e.phase2&&e.hp<=e.maxHp*.5){e.phase2=true;combat.log.push(`${e.name}進入第二階段：攻擊模式改變！`);}
      const plannedBoss=e.boss?bossIntent(e):null;
      if (e.stunned > 0) e.intent = { type: 'stunned', label: '破勢：無法行動' };
      else if(plannedBoss)e.intent=plannedBoss;
      else if(e.type==='cultist'&&Math.random()<.42+special) e.intent={type:'empower',value:2,label:'戰意儀式'};
      else if(e.type==='golem'&&Math.random()<.42+special) e.intent={type:'guard',value:16,label:'岩盾守護'};
      else if(e.disruptor&&Math.random()<.5+special) e.intent={type:'disrupt',value:1,label:'裂風尖嘯：技能點 -1'};
      else if(e.hexer&&Math.random()<.5+special) e.intent={type:'curse',value:2,label:'枯印詛咒：脆弱'};
      else if(e.drainer&&e.hp<e.maxHp*.8&&Math.random()<.5+special) e.intent={type:'drain',value:e.power,label:`汲血 ${e.power}`};
      else if(e.protector&&Math.random()<.5+special) e.intent={type:'guard',value:18,label:'誓盾守護'};
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

  function statusChip(kind,name,value,detail){return `<span class="status-chip ${kind}" title="${detail}"><b>${name}</b>${value?` ${value}`:''}</span>`;}
  function statusHtml(unit,side){
    const buffs=[],debuffs=[];
    if(unit.shield>0)buffs.push(statusChip('buff','護盾',unit.shield,`優先承受 ${unit.shield} 點傷害`));
    if(unit.taunt)buffs.push(statusChip('buff','嘲諷','','本輪敵人優先攻擊此角色'));
    if(unit.dodge)buffs.push(statusChip('buff','閃避','1 次','完全避開下一次攻擊'));
    if(unit.counter>0)buffs.push(statusChip('buff','反擊',unit.counter,`下次受擊反傷 ${unit.counter}`));
    if(unit.regenTurns>0)buffs.push(statusChip('buff','再生',`${unit.regenAmount}×${unit.regenTurns}`,`每次行動恢復 ${unit.regenAmount} 生命，剩餘 ${unit.regenTurns} 回合`));
    if(unit.powerBuffTurns>0)buffs.push(statusChip('buff','振奮',`+${unit.powerBuff}`,`威力提高 ${unit.powerBuff}，剩餘 ${unit.powerBuffTurns} 回合`));
    if(unit.guardBuffTurns>0)buffs.push(statusChip('buff','守護',`-${Math.round(unit.guardBuff*100)}%`,`承受傷害降低 ${Math.round(unit.guardBuff*100)}%，剩餘 ${unit.guardBuffTurns} 回合`));
    if(side==='enemy'&&unit.phase2)buffs.push(statusChip('buff','狂化','','首領進入第二階段，行動模式改變'));
    if(side==='enemy'&&unit.affix)buffs.push(statusChip('buff',unit.affix.name,'',unit.affix.desc));
    if(unit.vulnerable>0)debuffs.push(statusChip('debuff','易傷',unit.vulnerable,`承受傷害 +35%，剩餘 ${unit.vulnerable} 回合`));
    if(unit.burn>0)debuffs.push(statusChip('debuff','燃燒',unit.burn,`每回合受到 7 傷害，剩餘 ${unit.burn} 回合`));
    if(unit.poison>0)debuffs.push(statusChip('debuff','中毒',unit.poison,`敵方回合結束受到 4 傷害，剩餘 ${unit.poison} 回合`));
    if(unit.stunned>0)debuffs.push(statusChip('debuff','失衡',unit.stunned,`無法行動，剩餘 ${unit.stunned} 回合`));
    if(unit.weaken>0)debuffs.push(statusChip('debuff','弱化',`-${unit.weaken}`,`威力永久降低 ${unit.weaken}`));
    if(unit.blind>0)debuffs.push(statusChip('debuff','致盲',unit.blind,`造成傷害降低 30%，剩餘 ${unit.blind} 回合`));
    if(unit.armorBreak>0)debuffs.push(statusChip('debuff','裂甲',`-${unit.armorBreak}`,`護甲永久降低 ${unit.armorBreak}`));
    if(unit.frail>0)debuffs.push(statusChip('debuff','脆弱',unit.frail,`承受傷害提高 25%，剩餘 ${unit.frail} 回合`));
    if(unit.injury)debuffs.push(statusChip('debuff','傷勢','',unit.injury.desc||'能力受到傷勢影響'));
    return `<div class="status-bar" aria-label="目前狀態">${buffs.join('')}${debuffs.join('')||(!buffs.length?'<span class="status-empty">無狀態</span>':'')}</div>`;
  }

  function enemyHtml(e) {
    const hp = clamp(e.hp/e.maxHp*100,0,100), st = clamp(e.stagger/e.staggerMax*100,0,100);
    const intent=difficulties[state.difficulty]?.conceal?e.intent.label.replace(/\d+/g,'?'):e.intent.label;
    return `<article class="unit ${e.hp<=0?'dead':''} ${pendingSkill?.target==='enemy'&&e.hp>0?'targetable':''}" data-enemy="${e.id}" style="--accent:${e.color}"><span class="intent">${e.hp>0?intent:'倒下'}</span><div class="unit-icon">${e.icon}</div><h3>${e.name}${e.affix?` <em class="elite-tag">${e.affix.name}</em>`:''}${e.phase2?' <em class="phase-tag">Ⅱ</em>':''}</h3>${e.affix?`<small class="enemy-trait">${e.affix.desc}</small>`:''}<div class="numbers"><span>HP ${Math.max(0,e.hp)}/${e.maxHp}</span><span>${e.shield?`盾 ${e.shield}`:''}</span></div><div class="hp-track"><i style="width:${hp}%;background:var(--red)"></i></div><div class="numbers"><span>物防 ${Math.max(0,e.armor-(e.armorBreak||0))}</span><span>魔防 ${e.magicResist||0}</span></div>${statusHtml(e,'enemy')}<div class="numbers"><span>破勢</span><span>${e.stagger}/${e.staggerMax}</span></div><div class="stagger-track"><i style="width:${st}%"></i></div></article>`;
  }
  function partyHtml(h,i) { const hp=clamp(h.hp/h.maxHp*100,0,100); return `<article class="party-unit ${i===combat.heroIndex?'active':''} ${h.hp<=0?'dead':''}"><div class="combat-portrait" style="--accent:${h.color}"><img src="${portraitPath(h.id)}" alt="${h.name}頭像"></div><div class="party-unit-info"><h4 style="color:${h.color}">${h.name} · ${h.job}</h4><div class="numbers"><span>HP ${Math.max(0,h.hp)}/${h.maxHp}</span><span>技能 ${h.sp}/${h.maxSp}</span></div><div class="hp-track"><i style="width:${hp}%;background:${h.color}"></i></div>${statusHtml(h,'party')}<div class="ult-track" title="絕招氣勢 ${h.ultCharge}/100"><i style="width:${h.ultCharge}%"></i></div></div></article>`; }
  function skillCost(hero,skill){return Math.max(0,skill.cost-(hasTrait(hero,'focus')&&!hero.focusUsed&&skill.cost>0?1:0));}
  function skillHtml(s) { const h=expedition.party[combat.heroIndex],cost=skillCost(h,s); return `<button class="skill" data-skill="${s.id}" ${combat.locked||h.sp<cost?'disabled':''}><b>${s.name}</b><span class="skill-details">${skillDetailText(h,s)}</span><small>${cost ? `${cost} 技能點` : '基礎行動'}${cost<s.cost?' · 專注減免':''}${s.rank?` · 強化 ${s.rank}`:''}</small></button>`; }
  function ultimateHtml(hero){const ultimate=trainedSkill(hero,hero.ultimate);return `<button class="skill ultimate-skill" data-ultimate ${combat.locked||hero.ultCharge<100?'disabled':''}><b>✦ ${hero.ultimate.name}</b><span class="skill-details">${skillDetailText(hero,ultimate)}</span><small>${hero.ultCharge>=100?'氣勢已滿 · 可發動':`氣勢 ${hero.ultCharge}/100`}</small></button>`;}

  function chooseSkill(id) {
    if (combat.locked) return; const hero = expedition.party[combat.heroIndex]; const base = hero.skills.find(s => s.id === id);const skill=base?trainedSkill(hero,base):null;if (!skill || hero.sp < skillCost(hero,skill)) return;
    if (skill.target === 'enemy') { pendingSkill = skill; tone(430); renderCombat(); }
    else executeSkill(skill);
  }
  function chooseUltimate(){const hero=expedition.party[combat.heroIndex];if(combat.locked||hero.ultCharge<100)return;progressDaily('ultimate');save();const skill={...trainedSkill(hero,hero.ultimate),isUltimate:true,cost:0};if(skill.target==='enemy'){pendingSkill=skill;tone(820,.12);renderCombat();}else executeSkill(skill);}

  function executeSkill(skill, target) {
    if (combat.locked) return; const hero = expedition.party[combat.heroIndex];const cost=skill.isUltimate?0:skillCost(hero,skill);if(skill.isUltimate)hero.ultCharge=0;else{hero.sp-=cost;if(cost<skill.cost)hero.focusUsed=true;}combat.locked = true;
    const targets = skill.target === 'enemies' ? combat.enemies.filter(e=>e.hp>0) : target ? [target] : [];
    targets.forEach(e => {if(skill.damage)damageEnemy(hero,e,skill);else{if(skill.vulnerable)e.vulnerable=Math.max(e.vulnerable,skill.vulnerable);if(skill.blind)e.blind=Math.max(e.blind,skill.blind);if(skill.armorBreak){e.armorBreak=(e.armorBreak||0)+skill.armorBreak;}if(skill.weaken){e.power=Math.max(1,e.power-skill.weaken);e.weaken=(e.weaken||0)+skill.weaken;}if(skill.stagger){e.stagger+=skill.stagger;if(e.stagger>=e.staggerMax){e.stagger=0;e.stunned=1;}}}});
    if (skill.shield && skill.target === 'allies') expedition.party.filter(h=>h.hp>0).forEach(h=>h.shield+=skill.shield+(hero.specialization==='bulwark'?5:0));
    if (skill.shield && skill.target === 'self') hero.shield += skill.shield;
    if (skill.taunt) hero.taunt = true;
    if(skill.counter)hero.counter=skill.counter;
    if(skill.dodge)hero.dodge=true;
    if(skill.restoreSelf)hero.sp=Math.min(hero.maxSp,hero.sp+skill.restoreSelf);
    if (skill.restoreAll) expedition.party.filter(h=>h.hp>0).forEach(h=>h.sp=Math.min(h.maxSp,h.sp+skill.restoreAll));
    if(skill.powerAll)expedition.party.filter(h=>h.hp>0).forEach(h=>{h.powerBuff=Math.max(h.powerBuff||0,skill.powerAll);h.powerBuffTurns=Math.max(h.powerBuffTurns||0,skill.buffTurns||2);});
    if(skill.guardAll)expedition.party.filter(h=>h.hp>0).forEach(h=>{h.guardBuff=Math.max(h.guardBuff||0,skill.guardAll);h.guardBuffTurns=Math.max(h.guardBuffTurns||0,skill.buffTurns||2);});
    const healBoost = (expedition.relics.includes('ember') ? 1.35 : 1) * (hero.specialization==='hearth'?1.3:1) * (hero.specialization==='saint'?1.25:1) * (1+(skill.healRate||0));
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
    if(enemy.vulnerable>0)specDamage*=1+heroEffect(hero,'vulnerableDamage');
    if(enemy.vulnerable>0&&hasTrait(hero,'miraLegacy'))specDamage*=1.3;
    if((enemy.vulnerable>0||enemy.burn>0||enemy.blind>0||enemy.weaken>0||enemy.armorBreak>0)&&hasTrait(hero,'ambush'))specDamage*=1.12;
    if((enemy.vulnerable>0||enemy.burn>0||enemy.blind>0||enemy.weaken>0||enemy.armorBreak>0)&&hasTrait(hero,'rivenLegacy'))specDamage*=1.3;
    if(enemy.hp<=enemy.maxHp*.35)specDamage*=1+heroEffect(hero,'executeDamage');
    if(hasTrait(hero,'opening')&&combat.round===1)specDamage*=1.25;
    if(hasTrait(hero,'execute')&&enemy.hp<=enemy.maxHp*.35)specDamage*=1.3;
    const attackPower=(skill.damageType==='magic'?hero.magicPower:hero.physicalPower)+(hero.powerBuff||0);const raw = Math.round(attackPower * skill.damage * specDamage * (.9 + Math.random()*.2)); const defense=skill.pierce?0:skill.damageType==='magic'?(enemy.magicResist||0):Math.max(0,enemy.armor-(enemy.armorBreak||0)); let dmg=Math.max(1,raw-defense);
    if (enemy.vulnerable>0) dmg=Math.round(dmg*1.35);
    if (enemy.stagger>=enemy.staggerMax*.5 && expedition.relics.includes('hunter')) dmg=Math.round(dmg*1.3);
    const absorbed = Math.min(enemy.shield, dmg); enemy.shield -= absorbed; dmg -= absorbed; enemy.hp -= dmg;
    let stagger=skill.stagger || 4;
    if(hero.specialization==='breaker') stagger=Math.round(stagger*1.25);
    if(hero.specialization==='inquisitor') stagger+=5;if(enemy.blind>0&&hasTrait(hero,'tailshot'))stagger+=8;if(enemy.vulnerable>0&&hasTrait(hero,'miraLegacy'))stagger+=8;
    if(hasTrait(hero,'resolve')&&hero.hp<=hero.maxHp*.5)stagger=Math.round(stagger*1.3);
    enemy.stagger += stagger; if (skill.vulnerable) enemy.vulnerable=skill.vulnerable; if(skill.burn){enemy.burn=skill.burn;enemy.burnDamage=skill.burnDamage||7;}if(skill.weaken){enemy.power=Math.max(1,enemy.power-skill.weaken);enemy.weaken=(enemy.weaken||0)+skill.weaken;}
    if(skill.burn&&hasTrait(hero,'wildfire')){const other=combat.enemies.find(e=>e.hp>0&&e!==enemy);if(other)other.burn=Math.max(other.burn,1);}
    combat.log.push(`${hero.name}以${skill.name}對${enemy.name}造成 ${dmg} 傷害${absorbed ? `（護盾吸收 ${absorbed}）` : ''}。`);
    if(enemy.stagger>=enemy.staggerMax&&enemy.hp>0){enemy.stagger=0;enemy.stunned=1;if(hasTrait(hero,'momentum'))hero.sp=Math.min(hero.maxSp,hero.sp+1);if(hasTrait(hero,'aftershock'))combat.enemies.filter(e=>e.hp>0&&e!==enemy).forEach(e=>{e.hp-=5;resolveEnemyDeath(e);});combat.log.push(`${enemy.name}被破勢，本輪無法行動！`);}
    resolveEnemyDeath(enemy,hero);
  }

  function resolveEnemyDeath(enemy,killer){if(enemy.hp>0||enemy.affixTriggered)return;enemy.affixTriggered=true;if(killer&&hasTrait(killer,'hunt'))killer.hp=Math.min(killer.maxHp,killer.hp+4);if(killer&&hasTrait(killer,'rivenLegacy'))killer.sp=Math.min(killer.maxSp,killer.sp+2);if(enemy.affix?.id==='volatile'){expedition.party.filter(h=>h.hp>0).forEach(h=>hurtHero(h,5,true));combat.log.push(`${enemy.name}爆裂，對全隊造成 5 傷害！`);}}

  function hurtHero(target,amount,bypassShield=false,attacker=null){
    if(target.frail>0)amount=Math.ceil(amount*1.25);
    if(target.guardBuff>0)amount=Math.max(0,Math.ceil(amount*(1-target.guardBuff)));
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
        if(e.burn>0){const d=e.burnDamage||7;e.hp-=d;e.burn--;combat.log.push(`${e.name}受到 ${d} 點燃燒傷害。`);if(e.hp<=0){resolveEnemyDeath(e);continue;}}
        if(e.stunned>0){e.stunned--;combat.log.push(`${e.name}失去本輪行動。`);continue;}
        if(e.intent.type==='shield'){combat.enemies.filter(x=>x.hp>0).forEach(x=>x.shield+=e.intent.value);combat.log.push(`${e.name}為敵方施加護盾。`);continue;}
        if(e.intent.type==='heal'){const ally=[...combat.enemies].filter(x=>x.hp>0).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];const healed=Math.min(e.intent.value,ally.maxHp-ally.hp);ally.hp+=healed;combat.log.push(`${e.name}使${ally.name}恢復 ${healed} 生命。`);continue;}
        if(e.intent.type==='guard'){const ally=[...combat.enemies].filter(x=>x.hp>0).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];ally.shield+=e.intent.value;combat.log.push(`${e.name}為${ally.name}架起 ${e.intent.value} 岩盾。`);continue;}
        if(e.intent.type==='empower'){combat.enemies.filter(x=>x.hp>0&&x!==e).forEach(x=>x.power+=e.intent.value);combat.log.push(`${e.name}完成儀式，其他敵人威力提升！`);continue;}
        if(e.intent.type==='disrupt'){expedition.party.filter(h=>h.hp>0).forEach(h=>h.sp=Math.max(0,h.sp-e.intent.value));combat.log.push(`${e.name}的尖嘯擾亂全隊，技能點下降。`);continue;}
        if(e.intent.type==='curse'){expedition.party.filter(h=>h.hp>0).forEach(h=>h.frail=Math.max(h.frail,e.intent.value));combat.log.push(`${e.name}施加脆弱詛咒。`);continue;}
        if(e.intent.type==='howl'){expedition.party.filter(h=>h.hp>0).forEach(h=>h.frail=Math.max(h.frail,e.intent.value));combat.log.push(`${e.name}以長嚎標記全隊，脆弱持續 ${e.intent.value} 回合。`);continue;}
        if(e.intent.type==='plague'){expedition.party.filter(h=>h.hp>0).forEach(h=>h.poison=Math.max(h.poison,e.intent.duration));combat.log.push(`${e.name}散播瘴氣，全隊中毒 ${e.intent.duration} 回合。`);continue;}
        if(e.intent.type==='molt'){e.hp=Math.min(e.maxHp,e.hp+e.intent.value);e.shield+=e.intent.value;combat.log.push(`${e.name}蛻去腐殼，恢復並獲得 ${e.intent.value} 護盾。`);continue;}
        if(e.intent.type==='multi'){for(let i=0;i<(e.intent.hits||2);i++){const alive=expedition.party.filter(h=>h.hp>0);if(!alive.length)break;hurtHero(pick(alive),e.intent.value,false,e);}combat.log.push(`${e.name}發動連續追擊。`);continue;}
        if(e.intent.type==='brood'){expedition.party.filter(h=>h.hp>0).forEach(h=>{hurtHero(h,e.intent.value,false,e);h.poison=Math.max(h.poison,3);});combat.log.push(`${e.name}引爆腐卵，全隊受傷並中毒。`);continue;}
        if(e.intent.type==='overload'){expedition.party.filter(h=>h.hp>0).forEach(h=>hurtHero(h,e.intent.value,false,e));e.stagger+=18;combat.log.push(`${e.name}釋放過載震波，但自身累積 18 破勢。`);continue;}
        if(e.intent.type==='doom'){expedition.party.filter(h=>h.hp>0).forEach(h=>{hurtHero(h,e.intent.value,false,e);h.frail=Math.max(h.frail,e.intent.duration||3);});combat.log.push(`${e.name}降下黑冠末日，全隊受傷並陷入長效脆弱。`);continue;}
        if(e.intent.type==='drainall'){let total=0;expedition.party.filter(h=>h.hp>0).forEach(h=>{total+=hurtHero(h,e.intent.value,false,e).damage;});e.hp=Math.min(e.maxHp,e.hp+Math.round(total*.6));combat.log.push(`${e.name}獻祭全隊生命並恢復自身。`);continue;}
        if(e.intent.type==='tempest'){expedition.party.filter(h=>h.hp>0).forEach(h=>{hurtHero(h,e.intent.value,false,e);h.sp=Math.max(0,h.sp-1);});combat.log.push(`${e.name}展開風災領域，全隊受傷且技能點下降。`);continue;}
        const blindScale=e.blind>0 ? .7 : 1;
        if(e.intent.type==='cleave'){expedition.party.filter(h=>h.hp>0).forEach(h=>hurtHero(h,Math.round(e.intent.value*blindScale),false,e));combat.log.push(`${e.name}橫掃全隊。`);continue;}
        const taunter=expedition.party.find(h=>h.hp>0&&h.taunt); const alive=expedition.party.filter(h=>h.hp>0); if(!alive.length)break;
        const target=taunter||pick(alive);if(e.intent.type==='sunder')target.shield=0;if(e.intent.type==='siege')e.shield+=e.intent.shield||24;const hit=hurtHero(target,Math.round(e.intent.value*blindScale),false,e);
        if(e.intent.type==='venom'){target.poison=Math.max(target.poison,hasTrait(target,'antidote')?1:2);}
        if(e.intent.type==='maul')target.frail=Math.max(target.frail,e.intent.duration||3);
        if(e.intent.type==='drain')e.hp=Math.min(e.maxHp,e.hp+hit.damage);
        combat.log.push(`${e.name}攻擊${target.name}，造成 ${hit.damage} 傷害${hit.absorbed?`（護盾吸收 ${hit.absorbed}）`:''}。`);
      }
      expedition.party.filter(h=>h.hp>0&&h.poison>0).forEach(h=>{hurtHero(h,4,true);h.poison--;combat.log.push(`${h.name}受到 4 點毒素傷害。`);});
      expedition.party.forEach(h=>{h.taunt=false;h.shield=0;if(h.frail>0)h.frail--;if(h.powerBuffTurns>0&&--h.powerBuffTurns===0)h.powerBuff=0;if(h.guardBuffTurns>0&&--h.guardBuffTurns===0)h.guardBuff=0;}); combat.enemies.forEach(e=>{if(e.vulnerable>0)e.vulnerable--;if(e.blind>0)e.blind--;});
      if(expedition.party.every(h=>h.hp<=0)) return loseExpedition();
      if(combat.enemies.every(e=>e.hp<=0)) return winCombat();
      combat.round++;combat.heroIndex=0;combat.locked=false;planIntents();beginHeroTurn();
    },550);
  }

  function winCombat() {
    const defeatedBoss=combat?.encounter==='boss',demonBattle=combat?.enemies.some(e=>e.type==='demonking');
    let loot=rand(10,18)+expedition.contract.risk*4;
    if(combat?.encounter==='elite')loot+=14;
    if(expedition.modifier==='bounty') loot=Math.round(loot*1.5);
    if(expedition.modifier==='fortified') loot+=5;
    if(expedition.party.some(h=>h.specialization==='pathfinder')) loot=Math.round(loot*1.2);
    expedition.party.filter(h=>hasTrait(h,'purify')).forEach(h=>h.poison=0);
    const drop=rollEquipmentDrop();if(drop)expedition.lootItems.push(drop.id);
    if(combat?.encounter==='elite')progressDirective('elite');progressDaily('battle');
    if(defeatedBoss){state.campaign.bosses++;if(demonBattle){state.campaign.demonDefeated=true;addChronicle('灰燼公會擊敗魔王，終結了長夜；但殘黨與未知裂隙仍在等待討伐。');}else{const gained=12+expedition.contract.risk*3;state.campaign.intel=clamp(state.campaign.intel+gained,0,100);addChronicle(`擊敗${expedition.contract.zone}首領，取得魔王軍情報 ${gained}%。`);}}
    expedition.earned+=loot; state.stats.wins++; combat=null; expedition.node++; renderRoute();
    toast(`戰鬥勝利，取得 ${loot} 金幣${drop?`與「${drop.name}」`:''}`);
    if(expedition.node < expedition.total) setTimeout(showRelicChoice, 420); else setTimeout(showNode, 420);
  }

  function rollEquipmentDrop(){
    const risk=expedition.contract.risk;const fortune=expedition.party.some(h=>hasTrait(h,'fortune'));const final=expedition.node===expedition.total-1;
    if(Math.random()>.1+risk*.09+(fortune ? .1 : 0)+(final ? .12 : 0)+(expedition.encounter==='elite' ? .16 : 0)+(currentSeason().id==='mire'?.08:0))return null;
    const roll=Math.random();let rarity=risk===3&&roll<.2?'epic':risk>=2&&roll<.62?'rare':'common';
    if(rarity==='epic'&&!hasRenownPerk('epicCraft'))rarity=hasRenownPerk('rareCraft')?'rare':'common';
    if(rarity==='rare'&&!hasRenownPerk('rareCraft'))rarity='common';
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
    if(id==='whetstone') expedition.party.forEach(h=>h.physicalPower+=3);
    if(id==='oak') expedition.party.forEach(h=>{h.maxHp+=12;h.hp+=12;});
    if(id==='quicksilver') expedition.party.forEach(h=>{h.maxSp+=1;h.sp=Math.min(h.maxSp,h.sp+1);});
    if(id==='ember') expedition.party.filter(h=>h.hp>0).forEach(h=>h.hp=Math.min(h.maxHp,h.hp+18));
    tone(690,.12); toast(`獲得遺物：${relic.name}`); setTimeout(showNode,320);
  }
  function finishExpedition() {
    const c=expedition.contract; const total=c.gold+expedition.earned; let earnedRenown=Math.round(c.renown*(expedition.modifier==='cruel'?1.25:1));if(c.crisis&&hasRenownPerk('legacy'))earnedRenown=Math.round(earnedRenown*1.2); state.gold+=total; state.renown+=earnedRenown; state.inventory.push(...expedition.lootItems);expedition.lootItems.forEach(id=>discover('equipment',id));const tradeBonus=currentSeason().id==='trade'?2:0,scrapGain=2+c.risk+tradeBonus,clothGain=1+c.risk+tradeBonus,dustGain=c.risk;state.materials.scrap+=scrapGain;state.materials.cloth+=clothGain;state.materials.skillDust+=dustGain;
    const region=state.regions[c.zone];region.cleared++;region.threat=clamp(region.threat-(c.crisis?38:18+c.risk*3),0,100);progressDirective('contract');progressDaily('contract');if(expedition.lootItems.length)progressDirective('gear',expedition.lootItems.length);
    let trophy='',coreGain=0,markGain=0;if(c.crisis||c.risk===3){state.materials.bossCore++;state.materials.skillCore++;coreGain=1;markGain=1;const first=!state.trophies[c.zone];state.trophies[c.zone]=(state.trophies[c.zone]||0)+1;region.crises+=(c.crisis?1:0);trophy=`獲得「${c.zone}戰證」、鍛造核心與奧義印記`;if(first){const bonus=30+(hasRenownPerk('legacy')?30:0);state.gold+=bonus;trophy+=`，首勝陳列獎勵 ${bonus} 金幣`;}addChronicle(`遠征隊平定「${c.title}」，帶回第 ${state.trophies[c.zone]} 枚${c.zone}戰證。`);}
    if(c.crisis)progressDirective('crisis');else addChronicle(`完成${c.zone}契約「${c.title}」。`);
    advanceDay();const newInjuries=applyInjuries(false); state.stats.completed++;
    const completedParty=state.activeParty.filter(id=>state.heroes.some(h=>h.id===id&&h.owned));for(let i=0;i<completedParty.length;i++)for(let j=i+1;j<completedParty.length;j++){const key=bondKey(completedParty[i],completedParty[j]);state.bonds[key]=(state.bonds[key]||0)+1;}
    let crystalGain=0;state.heroes.filter(h=>state.activeParty.includes(h.id)).forEach(h=>{h.xp+=18+c.risk*8;while(h.xp>=h.level*45&&h.level<breakthroughCap(h)){h.xp-=h.level*45;h.level++;h.abilityCrystals=(h.abilityCrystals||0)+1;crystalGain++;}});syncRenownHeroes();
    state.contracts=[]; state.shopStock=[]; checkAchievements(); save();
    const lootNames=expedition.lootItems.map(id=>equipment.find(i=>i.id===id)?.name).filter(Boolean);
    $('eventStage').innerHTML=`<article class="event-card"><div class="event-symbol">✓</div><span class="eyebrow">CONTRACT COMPLETE</span><h2>${c.crisis?'危機解除':'遠征歸來'}</h2><p>${lootNames.length?`本次帶回裝備：${lootNames.join('、')}。`:'沒有發現可用裝備。'} 裝備素材：鐵屑 ${scrapGain}、韌布 ${clothGain}${coreGain?`、鍛造核心 ${coreGain}`:''}；技能素材：戰技殘頁 ${dustGain}${markGain?`、奧義印記 ${markGain}`:''}${crystalGain?`；能力素材：能力結晶 ${crystalGain}`:''}。${newInjuries.length?` ${newInjuries.join('、')}帶傷歸隊。`:' 隊員均平安歸隊。'}${trophy?` ${trophy}。`:''}</p><div class="event-options"><span><b>${total}</b> 金幣</span><span><b>${earnedRenown}</b> 聲望</span><span><b>${lootNames.length}</b> 件裝備</span><button class="action-btn" id="returnBtn">返回公會</button></div></article>`;
    $('returnBtn').addEventListener('click', returnGuild); tone(740,.18);
  }
  function advanceDay(){state.day++;const season=currentSeason();Object.entries(state.regions).forEach(([zone,r])=>{let growth=rand(3,7);if(season.id==='beast'&&(zone==='狼煙丘陵'||zone==='北風林線'))growth+=4;r.threat=clamp(r.threat+growth,0,100);});state.heroes.forEach(h=>{if(h.injury){h.injury.days--;if(h.injury.days<=0)h.injury=null;}});state.contracts=[];state.shopStock=[];state.marketRefreshes=0;ensureDirective();ensureDaily();}
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
    const enemyNotes={wolf:'成群時會發動夾擊，優先減少數量。',bandit:'會使用破盾斬，護盾隊伍需優先打斷。',shaman:'能為全體敵人施加護盾。',spider:'毒牙會留下持續傷害。',wisp:'會治療生命最低的敵人。',cultist:'儀式會永久提升同伴威力。',golem:'替受傷同伴架設岩盾。',harpy:'尖嘯會削減全隊技能點，適合優先破勢。',hexer:'詛咒會使全隊承受傷害提高 25%。',leech:'受傷後會使用汲血攻擊恢復生命。',sentinel:'頻繁替生命最低的同伴施加高額護盾。',warden:'半血後進入第二階段並橫掃全隊。'};
    const zones=[...new Set(contractSeeds.map(c=>c.zone))];
    $('modal').classList.add('open');$('modal').setAttribute('aria-hidden','false');$('modalTitle').textContent='邊境探索圖鑑';
    $('modalBody').innerHTML=`<div class="codex-progress"><b>${state.discovered.enemies.length}/${Object.keys(enemyTemplates).length}</b> 敵人　<b>${state.discovered.equipment.length}/${equipment.length}</b> 裝備　<b>${state.discovered.zones.length}/${zones.length}</b> 區域</div><span class="eyebrow">REGIONS</span><div class="codex-grid compact-codex">${zones.map(z=>`<article class="codex-entry ${state.discovered.zones.includes(z)?'':'unknown'}"><b>${state.discovered.zones.includes(z)?z:'未知區域'}</b></article>`).join('')}</div><span class="eyebrow">ENEMIES</span><div class="codex-grid">${Object.entries(enemyTemplates).map(([id,e])=>{const seen=state.discovered.enemies.includes(id);return `<article class="codex-entry ${seen?'':'unknown'}"><i>${seen?e.icon:'?'}</i><b>${seen?e.name:'未知敵人'}</b><small>${seen?enemyNotes[id]:'在遠征中遭遇後解鎖'}</small></article>`;}).join('')}</div><span class="eyebrow">EQUIPMENT</span><div class="codex-grid">${equipment.map(i=>{const seen=state.discovered.equipment.includes(i.id);return `<article class="codex-entry ${seen?`rarity-${i.rarity}`:'unknown'}"><b>${seen?i.name:'未知裝備'}</b><small>${seen?`${slotName(i.slot)} · ${i.desc}`:'購買或帶回公會後解鎖'}</small></article>`;}).join('')}</div>`;
  }

  function openSystem(){
    const saved=state.savedAt?new Date(state.savedAt).toLocaleString('zh-TW'):'尚未建立';
    $('modal').classList.add('open');$('modal').setAttribute('aria-hidden','false');$('modalTitle').textContent='系統與測試工具';
    $('modalBody').innerHTML=`<div class="system-status"><div><small>存檔版本</small><b>v${state.saveVersion||SAVE_VERSION}</b></div><div><small>最後儲存</small><b>${saved}</b></div><div><small>儲存位置</small><b>此瀏覽器</b></div></div><span class="eyebrow">SAVE MANAGEMENT</span><p>大型更新後建議先匯出備份。匯入會覆蓋目前進度；重置則會刪除本瀏覽器中的遊戲存檔。</p><div class="system-actions"><button class="action-btn" id="exportSaveBtn">匯出存檔</button><button class="action-btn secondary" id="importSaveBtn">匯入存檔</button><button class="action-btn danger-fill" id="resetSaveBtn">刪除並重開</button></div><input id="importSaveInput" type="file" accept="application/json,.json" hidden><span class="eyebrow guide-title">QUICK GUIDE</span><ul><li>每日任務每天輪替三項，達成後會自動領取素材或金幣。</li><li>角色隨聲望加入；升級取得能力結晶，技能則使用獨立的技能素材。</li><li>鐵匠鋪能製作、強化與分解裝備，背包會將三類素材分區顯示。</li><li>從隊伍介面安排三名成員與出戰順序。</li><li>區域威脅達到 75% 會產生危機契約。</li></ul>`;
    $('exportSaveBtn').addEventListener('click',exportSave);$('importSaveBtn').addEventListener('click',()=>$('importSaveInput').click());$('importSaveInput').addEventListener('change',importSave);$('resetSaveBtn').addEventListener('click',resetSave);
  }

  function exportSave(){
    save();const payload={game:'ashen-guild',version:SAVE_VERSION,exportedAt:new Date().toISOString(),state};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`ashen-guild-day-${state.day}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast('存檔備份已匯出');
  }

  function importSave(event){
    const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(reader.result);const incoming=parsed?.state||parsed;if(parsed?.game&&parsed.game!=='ashen-guild')throw new Error('不是《灰燼公會》存檔');if(!incoming||typeof incoming.day!=='number'||!Array.isArray(incoming.heroes)||!incoming.heroes.length)throw new Error('缺少必要的進度資料');if(!confirm(`匯入第 ${incoming.day} 日的進度並覆蓋目前存檔？`))return;localStorage.setItem(SAVE_KEY,JSON.stringify(incoming));location.reload();}catch(error){toast(`匯入失敗：${error.message}`);}};reader.onerror=()=>toast('匯入失敗：無法讀取檔案');reader.readAsText(file);
  }

  function resetSave(){if(!confirm('確定刪除目前進度？此動作無法復原，建議先匯出備份。'))return;if(!confirm('再次確認：要從第 1 日重新開始嗎？'))return;localStorage.removeItem(SAVE_KEY);location.reload();}

  function openIntro(){ $('modal').classList.add('open');$('modal').setAttribute('aria-hidden','false');$('modalBody').innerHTML='<p>《灰燼公會》沒有固定主線。你決定今天值得冒什麼風險，也決定邊境會變成什麼模樣。</p><ul><li>敵人頭上的標記會預告下一個行動；累積「破勢」可打斷敵人。</li><li>每日任務、季節與公會方針會定期輪替。</li><li>角色會隨聲望主動加入；升級取得能力結晶，可自由培養。</li><li>裝備、技能與能力使用各自獨立的素材。</li><li>從「隊伍」調整三名成員與實際出戰順序。</li><li>遠征失敗不會刪除進度；整備後再次出發。</li></ul><button class="action-btn" id="introOk">查看邊境局勢</button>';$('introOk').addEventListener('click',closeModal); }
  function closeModal(){ document.querySelector('[data-hero-back]')?.remove();$('modal').classList.remove('open','training-modal','hero-panel-modal');$('modal').setAttribute('aria-hidden','true');state.seenIntro=true;save(); }

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
