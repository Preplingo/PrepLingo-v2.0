import React from 'react';
import { PartOfSpeech } from '../types';

export interface IrregularVerbForm {
  v1: string;
  v2: string;
  v3: string;
}

/**
 * 1. Comprehensive Irregular Verbs Authority Map
 * Exhaustive lookup map of common English irregular verbs with exact V1, V2, and V3 forms.
 */
export const IRREGULAR_VERBS: Record<string, IrregularVerbForm> = {
  arise: { v1: 'arise', v2: 'arose', v3: 'arisen' },
  awake: { v1: 'awake', v2: 'awoke', v3: 'awoken' },
  be: { v1: 'be', v2: 'was/were', v3: 'been' },
  bear: { v1: 'bear', v2: 'bore', v3: 'born/borne' },
  beat: { v1: 'beat', v2: 'beat', v3: 'beaten' },
  become: { v1: 'become', v2: 'became', v3: 'become' },
  befall: { v1: 'befall', v2: 'befell', v3: 'befallen' },
  beget: { v1: 'beget', v2: 'begot', v3: 'begotten' },
  begin: { v1: 'begin', v2: 'began', v3: 'begun' },
  behold: { v1: 'behold', v2: 'beheld', v3: 'beheld' },
  bend: { v1: 'bend', v2: 'bent', v3: 'bent' },
  beseech: { v1: 'beseech', v2: 'besought', v3: 'besought' },
  beset: { v1: 'beset', v2: 'beset', v3: 'beset' },
  bet: { v1: 'bet', v2: 'bet', v3: 'bet' },
  bid: { v1: 'bid', v2: 'bid/bade', v3: 'bid/bidden' },
  bind: { v1: 'bind', v2: 'bound', v3: 'bound' },
  bite: { v1: 'bite', v2: 'bit', v3: 'bitten' },
  bleed: { v1: 'bleed', v2: 'bled', v3: 'bled' },
  blow: { v1: 'blow', v2: 'blew', v3: 'blown' },
  break: { v1: 'break', v2: 'broke', v3: 'broken' },
  breed: { v1: 'breed', v2: 'bred', v3: 'bred' },
  bring: { v1: 'bring', v2: 'brought', v3: 'brought' },
  broadcast: { v1: 'broadcast', v2: 'broadcast', v3: 'broadcast' },
  build: { v1: 'build', v2: 'built', v3: 'built' },
  burn: { v1: 'burn', v2: 'burnt/burned', v3: 'burnt/burned' },
  burst: { v1: 'burst', v2: 'burst', v3: 'burst' },
  buy: { v1: 'buy', v2: 'bought', v3: 'bought' },
  cast: { v1: 'cast', v2: 'cast', v3: 'cast' },
  catch: { v1: 'catch', v2: 'caught', v3: 'caught' },
  choose: { v1: 'choose', v2: 'chose', v3: 'chosen' },
  cleave: { v1: 'cleave', v2: 'clove/cleft', v3: 'cloven/cleft' },
  cling: { v1: 'cling', v2: 'clung', v3: 'clung' },
  come: { v1: 'come', v2: 'came', v3: 'come' },
  cost: { v1: 'cost', v2: 'cost', v3: 'cost' },
  creep: { v1: 'creep', v2: 'crept', v3: 'crept' },
  cut: { v1: 'cut', v2: 'cut', v3: 'cut' },
  deal: { v1: 'deal', v2: 'dealt', v3: 'dealt' },
  dig: { v1: 'dig', v2: 'dug', v3: 'dug' },
  do: { v1: 'do', v2: 'did', v3: 'done' },
  draw: { v1: 'draw', v2: 'drew', v3: 'drawn' },
  dream: { v1: 'dream', v2: 'dreamt/dreamed', v3: 'dreamt/dreamed' },
  drink: { v1: 'drink', v2: 'drank', v3: 'drunk' },
  drive: { v1: 'drive', v2: 'drove', v3: 'driven' },
  dwell: { v1: 'dwell', v2: 'dwelt/dwelled', v3: 'dwelt/dwelled' },
  eat: { v1: 'eat', v2: 'ate', v3: 'eaten' },
  fall: { v1: 'fall', v2: 'fell', v3: 'fallen' },
  feed: { v1: 'feed', v2: 'fed', v3: 'fed' },
  feel: { v1: 'feel', v2: 'felt', v3: 'felt' },
  fight: { v1: 'fight', v2: 'fought', v3: 'fought' },
  find: { v1: 'find', v2: 'found', v3: 'found' },
  flee: { v1: 'flee', v2: 'fled', v3: 'fled' },
  fling: { v1: 'fling', v2: 'flung', v3: 'flung' },
  fly: { v1: 'fly', v2: 'flew', v3: 'flown' },
  forbear: { v1: 'forbear', v2: 'forbore', v3: 'forborne' },
  forbid: { v1: 'forbid', v2: 'forbade', v3: 'forbidden' },
  forecast: { v1: 'forecast', v2: 'forecast', v3: 'forecast' },
  foresee: { v1: 'foresee', v2: 'foresaw', v3: 'foreseen' },
  foretell: { v1: 'foretell', v2: 'foretold', v3: 'foretold' },
  forget: { v1: 'forget', v2: 'forgot', v3: 'forgotten' },
  forgive: { v1: 'forgive', v2: 'forgave', v3: 'forgiven' },
  forsake: { v1: 'forsake', v2: 'forsook', v3: 'forsaken' },
  freeze: { v1: 'freeze', v2: 'froze', v3: 'frozen' },
  get: { v1: 'get', v2: 'got', v3: 'got/gotten' },
  give: { v1: 'give', v2: 'gave', v3: 'given' },
  go: { v1: 'go', v2: 'went', v3: 'gone' },
  grind: { v1: 'grind', v2: 'ground', v3: 'ground' },
  grow: { v1: 'grow', v2: 'grew', v3: 'grown' },
  hang: { v1: 'hang', v2: 'hung', v3: 'hung' },
  have: { v1: 'have', v2: 'had', v3: 'had' },
  hear: { v1: 'hear', v2: 'heard', v3: 'heard' },
  hide: { v1: 'hide', v2: 'hid', v3: 'hidden' },
  hit: { v1: 'hit', v2: 'hit', v3: 'hit' },
  hold: { v1: 'hold', v2: 'held', v3: 'held' },
  hurt: { v1: 'hurt', v2: 'hurt', v3: 'hurt' },
  inlay: { v1: 'inlay', v2: 'inlaid', v3: 'inlaid' },
  input: { v1: 'input', v2: 'input', v3: 'input' },
  inset: { v1: 'inset', v2: 'inset', v3: 'inset' },
  interweave: { v1: 'interweave', v2: 'interwove', v3: 'interwoven' },
  keep: { v1: 'keep', v2: 'kept', v3: 'kept' },
  kneel: { v1: 'kneel', v2: 'knelt/kneeled', v3: 'knelt/kneeled' },
  knit: { v1: 'knit', v2: 'knit/knitted', v3: 'knit/knitted' },
  know: { v1: 'know', v2: 'knew', v3: 'known' },
  lay: { v1: 'lay', v2: 'laid', v3: 'laid' },
  lead: { v1: 'lead', v2: 'led', v3: 'led' },
  lean: { v1: 'lean', v2: 'leant/leaned', v3: 'leant/leaned' },
  leap: { v1: 'leap', v2: 'leapt/leaped', v3: 'leapt/leaped' },
  learn: { v1: 'learn', v2: 'learnt/learned', v3: 'learnt/learned' },
  leave: { v1: 'leave', v2: 'left', v3: 'left' },
  lend: { v1: 'lend', v2: 'lent', v3: 'lent' },
  let: { v1: 'let', v2: 'let', v3: 'let' },
  lie: { v1: 'lie', v2: 'lay', v3: 'lain' },
  light: { v1: 'light', v2: 'lit/lighted', v3: 'lit/lighted' },
  lose: { v1: 'lose', v2: 'lost', v3: 'lost' },
  make: { v1: 'make', v2: 'made', v3: 'made' },
  mean: { v1: 'mean', v2: 'meant', v3: 'meant' },
  meet: { v1: 'meet', v2: 'met', v3: 'met' },
  mislead: { v1: 'mislead', v2: 'misled', v3: 'misled' },
  mistake: { v1: 'mistake', v2: 'mistook', v3: 'mistaken' },
  misunderstand: { v1: 'misunderstand', v2: 'misunderstood', v3: 'misunderstood' },
  mow: { v1: 'mow', v2: 'mowed', v3: 'mown/mowed' },
  offset: { v1: 'offset', v2: 'offset', v3: 'offset' },
  outdo: { v1: 'outdo', v2: 'outdid', v3: 'outdone' },
  outgrow: { v1: 'outgrow', v2: 'outgrew', v3: 'outgrown' },
  output: { v1: 'output', v2: 'output', v3: 'output' },
  outrun: { v1: 'outrun', v2: 'outran', v3: 'outrun' },
  outsell: { v1: 'outsell', v2: 'outsold', v3: 'outsold' },
  overcome: { v1: 'overcome', v2: 'overcame', v3: 'overcome' },
  overdo: { v1: 'overdo', v2: 'overdid', v3: 'overdone' },
  overdraw: { v1: 'overdraw', v2: 'overdrew', v3: 'overdrawn' },
  overhear: { v1: 'overhear', v2: 'overheard', v3: 'overheard' },
  overlay: { v1: 'overlay', v2: 'overlaid', v3: 'overlaid' },
  overpay: { v1: 'overpay', v2: 'overpaid', v3: 'overpaid' },
  override: { v1: 'override', v2: 'overrode', v3: 'overridden' },
  overrun: { v1: 'overrun', v2: 'overran', v3: 'overrun' },
  oversee: { v1: 'oversee', v2: 'oversaw', v3: 'overseen' },
  overshoot: { v1: 'overshoot', v2: 'overshot', v3: 'overshot' },
  oversleep: { v1: 'oversleep', v2: 'overslept', v3: 'overslept' },
  overtake: { v1: 'overtake', v2: 'overtook', v3: 'overtaken' },
  overthrow: { v1: 'overthrow', v2: 'overthrew', v3: 'overthrown' },
  partake: { v1: 'partake', v2: 'partook', v3: 'partaken' },
  pay: { v1: 'pay', v2: 'paid', v3: 'paid' },
  plead: { v1: 'plead', v2: 'pled/pleaded', v3: 'pled/pleaded' },
  prove: { v1: 'prove', v2: 'proved', v3: 'proven/proved' },
  put: { v1: 'put', v2: 'put', v3: 'put' },
  quit: { v1: 'quit', v2: 'quit', v3: 'quit' },
  read: { v1: 'read', v2: 'read', v3: 'read' },
  rebind: { v1: 'rebind', v2: 'rebound', v3: 'rebound' },
  rebuild: { v1: 'rebuild', v2: 'rebuilt', v3: 'rebuilt' },
  recast: { v1: 'recast', v2: 'recast', v3: 'recast' },
  redo: { v1: 'redo', v2: 'redid', v3: 'redone' },
  rehear: { v1: 'rehear', v2: 'reheard', v3: 'reheard' },
  remake: { v1: 'remake', v2: 'remade', v3: 'remade' },
  repay: { v1: 'repay', v2: 'repaid', v3: 'repaid' },
  reread: { v1: 'reread', v2: 'reread', v3: 'reread' },
  rerun: { v1: 'rerun', v2: 'reran', v3: 'rerun' },
  resell: { v1: 'resell', v2: 'resold', v3: 'resold' },
  reset: { v1: 'reset', v2: 'reset', v3: 'reset' },
  retake: { v1: 'retake', v2: 'retook', v3: 'retaken' },
  retell: { v1: 'retell', v2: 'retold', v3: 'retold' },
  rethink: { v1: 'rethink', v2: 'rethought', v3: 'rethought' },
  rewind: { v1: 'rewind', v2: 'rewound', v3: 'rewound' },
  rewrite: { v1: 'rewrite', v2: 'rewrote', v3: 'rewritten' },
  rid: { v1: 'rid', v2: 'rid', v3: 'rid' },
  ride: { v1: 'ride', v2: 'rode', v3: 'ridden' },
  ring: { v1: 'ring', v2: 'rang', v3: 'rung' },
  rise: { v1: 'rise', v2: 'rose', v3: 'risen' },
  run: { v1: 'run', v2: 'ran', v3: 'run' },
  saw: { v1: 'saw', v2: 'sawed', v3: 'sawn/sawed' },
  say: { v1: 'say', v2: 'said', v3: 'said' },
  see: { v1: 'see', v2: 'saw', v3: 'seen' },
  seek: { v1: 'seek', v2: 'sought', v3: 'sought' },
  sell: { v1: 'sell', v2: 'sold', v3: 'sold' },
  send: { v1: 'send', v2: 'sent', v3: 'sent' },
  set: { v1: 'set', v2: 'set', v3: 'set' },
  sew: { v1: 'sew', v2: 'sewed', v3: 'sewn/sewed' },
  shake: { v1: 'shake', v2: 'shook', v3: 'shaken' },
  shear: { v1: 'shear', v2: 'sheared', v3: 'shorn/sheared' },
  shed: { v1: 'shed', v2: 'shed', v3: 'shed' },
  shine: { v1: 'shine', v2: 'shone', v3: 'shone' },
  shoe: { v1: 'shoe', v2: 'shod', v3: 'shod' },
  shoot: { v1: 'shoot', v2: 'shot', v3: 'shot' },
  show: { v1: 'show', v2: 'showed', v3: 'shown/showed' },
  shrink: { v1: 'shrink', v2: 'shrank/shrunk', v3: 'shrunk' },
  shut: { v1: 'shut', v2: 'shut', v3: 'shut' },
  sing: { v1: 'sing', v2: 'sang', v3: 'sung' },
  sink: { v1: 'sink', v2: 'sank', v3: 'sunk' },
  sit: { v1: 'sit', v2: 'sat', v3: 'sat' },
  slay: { v1: 'slay', v2: 'slew', v3: 'slain' },
  sleep: { v1: 'sleep', v2: 'slept', v3: 'slept' },
  slide: { v1: 'slide', v2: 'slid', v3: 'slid' },
  sling: { v1: 'sling', v2: 'slung', v3: 'slung' },
  slink: { v1: 'slink', v2: 'slunk', v3: 'slunk' },
  slit: { v1: 'slit', v2: 'slit', v3: 'slit' },
  smell: { v1: 'smell', v2: 'smelt/smelled', v3: 'smelt/smelled' },
  sow: { v1: 'sow', v2: 'sowed', v3: 'sown/sowed' },
  speak: { v1: 'speak', v2: 'spoke', v3: 'spoken' },
  speed: { v1: 'speed', v2: 'sped/speeded', v3: 'sped/speeded' },
  spell: { v1: 'spell', v2: 'spelt/spelled', v3: 'spelt/spelled' },
  spend: { v1: 'spend', v2: 'spent', v3: 'spent' },
  spill: { v1: 'spill', v2: 'spilt/spilled', v3: 'spilt/spilled' },
  spin: { v1: 'spin', v2: 'spun', v3: 'spun' },
  spit: { v1: 'spit', v2: 'spat', v3: 'spat' },
  split: { v1: 'split', v2: 'split', v3: 'split' },
  spoil: { v1: 'spoil', v2: 'spoilt/spoiled', v3: 'spoilt/spoiled' },
  spread: { v1: 'spread', v2: 'spread', v3: 'spread' },
  spring: { v1: 'spring', v2: 'sprang', v3: 'sprung' },
  stand: { v1: 'stand', v2: 'stood', v3: 'stood' },
  steal: { v1: 'steal', v2: 'stole', v3: 'stolen' },
  stick: { v1: 'stick', v2: 'stuck', v3: 'stuck' },
  sting: { v1: 'sting', v2: 'stung', v3: 'stung' },
  stink: { v1: 'stink', v2: 'stank/stunk', v3: 'stunk' },
  stride: { v1: 'stride', v2: 'strode', v3: 'stridden' },
  strike: { v1: 'strike', v2: 'struck', v3: 'struck' },
  string: { v1: 'string', v2: 'strung', v3: 'strung' },
  strive: { v1: 'strive', v2: 'strove', v3: 'striven' },
  swear: { v1: 'swear', v2: 'swore', v3: 'sworn' },
  sweep: { v1: 'sweep', v2: 'swept', v3: 'swept' },
  swell: { v1: 'swell', v2: 'swelled', v3: 'swollen/swelled' },
  swim: { v1: 'swim', v2: 'swam', v3: 'swum' },
  swing: { v1: 'swing', v2: 'swung', v3: 'swung' },
  take: { v1: 'take', v2: 'took', v3: 'taken' },
  teach: { v1: 'teach', v2: 'taught', v3: 'taught' },
  tear: { v1: 'tear', v2: 'tore', v3: 'torn' },
  tell: { v1: 'tell', v2: 'told', v3: 'told' },
  think: { v1: 'think', v2: 'thought', v3: 'thought' },
  thrive: { v1: 'thrive', v2: 'throve/thrived', v3: 'thriven/thrived' },
  throw: { v1: 'throw', v2: 'threw', v3: 'thrown' },
  thrust: { v1: 'thrust', v2: 'thrust', v3: 'thrust' },
  tread: { v1: 'tread', v2: 'trod', v3: 'trodden/trod' },
  unbend: { v1: 'unbend', v2: 'unbent', v3: 'unbent' },
  underbid: { v1: 'underbid', v2: 'underbid', v3: 'underbid' },
  undercut: { v1: 'undercut', v2: 'undercut', v3: 'undercut' },
  undergo: { v1: 'undergo', v2: 'underwent', v3: 'undergone' },
  underlie: { v1: 'underlie', v2: 'underlay', v3: 'underlain' },
  undermine: { v1: 'undermine', v2: 'undermined', v3: 'undermined' },
  understand: { v1: 'understand', v2: 'understood', v3: 'understood' },
  undertake: { v1: 'undertake', v2: 'undertook', v3: 'undertaken' },
  underwrite: { v1: 'underwrite', v2: 'underwrote', v3: 'underwritten' },
  undo: { v1: 'undo', v2: 'undid', v3: 'undone' },
  unwind: { v1: 'unwind', v2: 'unwound', v3: 'unwound' },
  uphold: { v1: 'uphold', v2: 'upheld', v3: 'upheld' },
  upset: { v1: 'upset', v2: 'upset', v3: 'upset' },
  wake: { v1: 'wake', v2: 'woke', v3: 'woken' },
  wear: { v1: 'wear', v2: 'wore', v3: 'worn' },
  weave: { v1: 'weave', v2: 'wove', v3: 'woven' },
  weep: { v1: 'weep', v2: 'wept', v3: 'wept' },
  win: { v1: 'win', v2: 'won', v3: 'won' },
  wind: { v1: 'wind', v2: 'wound', v3: 'wound' },
  withdraw: { v1: 'withdraw', v2: 'withdrew', v3: 'withdrawn' },
  withhold: { v1: 'withhold', v2: 'withheld', v3: 'withheld' },
  withstand: { v1: 'withstand', v2: 'withstood', v3: 'withstood' },
  wring: { v1: 'wring', v2: 'wrung', v3: 'wrung' },
  write: { v1: 'write', v2: 'wrote', v3: 'written' },
};

/**
 * 2. Accurate Regular Verb Past Forms (Spelling Rules Engine)
 * Computes exact past form (V2/V3) according to English phonetic & spelling rules:
 * - Silent 'e' or 'ee' (agree, like, live) -> append "d" (agreed, liked, lived)
 * - Consonant + 'y' (study, carry, rely) -> change 'y' to "ied" (studied, carried, relied)
 * - Vowel + 'y' (play, enjoy, stay) -> append "ed" (played, enjoyed, stayed)
 * - Words ending in -c (panic, picnic) -> append "ked" (panicked, picnicked)
 * - CVC consonant doubling (stop, plan, admit, prefer, refer, occur, drop, etc.) -> double consonant + "ed"
 * - General default -> append "ed" (walk -> walked)
 */
export function computeRegularPastForm(rawWord: string): string {
  const parts = rawWord.trim().split(/\s+/);
  const base = parts[0].toLowerCase();
  const particle = parts.slice(1).join(' ');

  let past = '';

  // Rule 1: Ends in 'e' -> append 'd' (e.g. agree -> agreed, like -> liked, live -> lived)
  if (base.endsWith('e')) {
    past = `${base}d`;
  }
  // Rule 2: Ends in consonant + 'y' -> change 'y' to 'ied' (e.g. study -> studied, rely -> relied, carry -> carried)
  else if (base.endsWith('y') && base.length > 1 && !'aeiou'.includes(base[base.length - 2])) {
    past = `${base.slice(0, -1)}ied`;
  }
  // Rule 3: Ends in 'c' -> append 'ked' (e.g. panic -> panicked, picnic -> picnicked)
  else if (base.endsWith('c')) {
    past = `${base}ked`;
  }
  // Rule 4: Consonant doubling rules
  else {
    // High-frequency CVC doubling verbs in academic and general English
    const doublingVerbs = new Set([
      'stop', 'plan', 'drop', 'rob', 'fit', 'nod', 'beg', 'rub', 'clap', 'slip', 'trip',
      'grab', 'wrap', 'ban', 'fan', 'pin', 'tap', 'tip', 'step', 'skip', 'hug', 'log',
      'dim', 'hum', 'jam', 'ram', 'slam', 'snap', 'spot', 'stir', 'trap', 'whip', 'zip',
      'admit', 'prefer', 'refer', 'occur', 'recur', 'confer', 'defer', 'infer', 'deter',
      'compel', 'propel', 'rebel', 'equip', 'commit', 'submit', 'permit', 'transmit',
      'emit', 'omit', 'allot', 'control', 'patrol', 'fulfil', 'fulfill', 'regret',
      'cancel', 'travel', 'dial', 'signal', 'label', 'shrug', 'chat', 'drag', 'knot'
    ]);

    // Verbs that end in CVC where the stress is on the first syllable (do NOT double)
    const noDoublingVerbs = new Set([
      'open', 'happen', 'listen', 'enter', 'offer', 'suffer', 'order', 'gather',
      'answer', 'visit', 'limit', 'credit', 'profit', 'target', 'market', 'focus',
      'benefit', 'differ', 'render', 'alter', 'foster', 'shudder', 'whisper', 'discover',
      'cover', 'bother', 'master', 'hammer', 'matter', 'prosper', 'flatter', 'falter'
    ]);

    const len = base.length;
    const lastChar = base[len - 1];
    const prevChar = base[len - 2];
    const prevPrevChar = len >= 3 ? base[len - 3] : '';

    const isVowel = (c: string) => 'aeiou'.includes(c);
    const isConsonant = (c: string) => /[a-z]/.test(c) && !isVowel(c);

    if (doublingVerbs.has(base)) {
      past = `${base}${lastChar}ed`;
    } else if (noDoublingVerbs.has(base)) {
      past = `${base}ed`;
    } else if (
      len >= 3 &&
      isConsonant(lastChar) &&
      !['w', 'x', 'y'].includes(lastChar) &&
      isVowel(prevChar) &&
      (prevPrevChar === '' || isConsonant(prevPrevChar)) &&
      len <= 4 // Monosyllabic CVC words like hop -> hopped, pat -> patted
    ) {
      past = `${base}${lastChar}ed`;
    } else {
      past = `${base}ed`;
    }
  }

  return particle ? `${past} ${particle}` : past;
}

export type VerbConjugationResult =
  | {
      isVerb: true;
      isIrregular: true;
      v1: string;
      v2: string;
      v3: string;
    }
  | {
      isVerb: true;
      isIrregular: false;
      v1: string;
      regularPast: string;
    }
  | null;

/**
 * Main Conjugation Lookup Engine
 * Prioritizes the comprehensive irregular verbs map over any static flags.
 * Also handles phrasal verbs (e.g. "keep up with" -> V2: "kept up with", V3: "kept up with").
 */
export function getVerbConjugation(
  word: string,
  type?: PartOfSpeech | string,
  partOfSpeech?: PartOfSpeech | string
): VerbConjugationResult {
  const isVerb = type === 'verb' || partOfSpeech === 'verb';
  if (!isVerb) return null;

  const cleanWord = (word || '').toLowerCase().trim();
  if (!cleanWord) return null;

  // 1. Check exact word in irregular map
  if (IRREGULAR_VERBS[cleanWord]) {
    const irr = IRREGULAR_VERBS[cleanWord];
    return {
      isVerb: true,
      isIrregular: true,
      v1: irr.v1,
      v2: irr.v2,
      v3: irr.v3,
    };
  }

  // 2. Check if it is an irregular phrasal verb (e.g., "keep on", "bring about", "carry out")
  const words = cleanWord.split(/\s+/);
  if (words.length > 1) {
    const baseVerb = words[0];
    const particle = words.slice(1).join(' ');

    if (IRREGULAR_VERBS[baseVerb]) {
      const irr = IRREGULAR_VERBS[baseVerb];
      return {
        isVerb: true,
        isIrregular: true,
        v1: `${irr.v1} ${particle}`,
        v2: `${irr.v2} ${particle}`,
        v3: `${irr.v3} ${particle}`,
      };
    }
  }

  // 3. Regular Verb: Compute exact past form using spelling rules
  const regularPast = computeRegularPastForm(cleanWord);
  return {
    isVerb: true,
    isIrregular: false,
    v1: cleanWord,
    regularPast,
  };
}

interface VerbConjugationBadgeProps {
  word: string;
  type?: PartOfSpeech | string;
  partOfSpeech?: PartOfSpeech | string;
  className?: string;
}

/**
 * Universal Verb Conjugation Badge Component
 * - For Irregular: [ V1: base ] → [ V2: past ] → [ V3: past participle ]
 * - For Regular: Düzenli Fiil • (V2/V3: [computedForm])
 * - For Non-verbs: null (zero layout shift)
 */
export const VerbConjugationBadge: React.FC<VerbConjugationBadgeProps> = ({
  word,
  type,
  partOfSpeech,
  className = '',
}) => {
  const conjugation = getVerbConjugation(word, type, partOfSpeech);

  // If not a verb, return null (zero layout shift)
  if (!conjugation || !conjugation.isVerb) {
    return null;
  }

  // If irregular verb, render [ V1: base ] → [ V2: past ] → [ V3: past participle ]
  if (conjugation.isIrregular) {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 pt-1.5 text-xs font-mono select-none ${className}`}>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#eef2ff] dark:bg-[#1e1b4b] border border-[#c7d2fe] dark:border-[#3730a3] text-[#3730a3] dark:text-[#c7d2fe] font-semibold shadow-2xs">
          <span className="text-[10px] font-bold text-[#6366f1] uppercase tracking-wider">V1</span>
          <span>{conjugation.v1}</span>
        </span>
        <span className="text-[#94a3b8] dark:text-[#64748b] text-xs font-sans">→</span>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#fffbeb] dark:bg-[#451a03] border border-[#fde68a] dark:border-[#92400e] text-[#92400e] dark:text-[#fde68a] font-semibold shadow-2xs">
          <span className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-wider">V2</span>
          <span>{conjugation.v2}</span>
        </span>
        <span className="text-[#94a3b8] dark:text-[#64748b] text-xs font-sans">→</span>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#ecfdf5] dark:bg-[#022c22] border border-[#a7f3d0] dark:border-[#065f46] text-[#065f46] dark:text-[#a7f3d0] font-semibold shadow-2xs">
          <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider">V3</span>
          <span>{conjugation.v3}</span>
        </span>
      </div>
    );
  }

  // If regular verb, render accurate computed past form: "Düzenli Fiil • (V2/V3: [computedForm])"
  return (
    <div className={`pt-1.5 select-none ${className}`}>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#f1f5f9] dark:bg-[#1e293b] text-[#334155] dark:text-[#cbd5e1] text-[11px] font-medium border border-[#e2e8f0] dark:border-[#334155] shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shrink-0" />
        <span className="font-semibold text-[#1e293b] dark:text-[#e2e8f0]">Düzenli Fiil</span>
        <span className="text-[#94a3b8] dark:text-[#64748b]">•</span>
        <span className="font-mono text-[#047857] dark:text-[#34d399]">
          (V2/V3: {conjugation.regularPast})
        </span>
      </span>
    </div>
  );
};
