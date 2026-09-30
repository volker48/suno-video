// The Gryffy Ball (songs/dance-gryffy/TREATMENT.md): one entry per plate, anchored to the aligned
// lyrics and snapped to the beat grid. Each plate is a scene module in ./scenes/.
import type { TimelineFactory } from '../../timeline';
import { cuts, scene } from '../../timeline';

const timeline: TimelineFactory = (ly, au) => {
  const { cut } = cuts(ly, au);
  const section = (name: string) => {
    const s = au.sections.find((x) => x.name === name);
    if (!s) throw new Error(`section not found: ${name}`);
    return s;
  };
  /** The beat nearest a word's onset (in the nth line containing q). */
  const onWord = (q: string, word: string, nth = 0) => {
    const w = ly.get(q, nth).words.find((x) => x.w.toLowerCase().startsWith(word));
    if (!w) throw new Error(`word '${word}' not in '${q}'`);
    return au.timeOfBeat(Math.round(au.beatAt(w.start)));
  };

  const plan: [id: string, name: string, start: number, params?: Record<string, unknown>][] = [
    ['invite', 'invite', 0],
    ['arrival', 'arrival', cut('Gryffy kicks the door')],
    ['crouch1', 'crouch', cut('You crouch down low', 0), { n: 1 }],
    ['floor', 'floor', onWord('tear up the floor', 'tear', 0)],
    ['king', 'king', cut('My Frenchton king', 0)],
    ['vip1', 'vip', cut('run wild, run free', 0), { n: 1 }],
    ['intermission', 'intermission', section('instrumental1').start],
    ['profile', 'profile', cut('Button nose')],
    // verse 2 ends on "…it all" a moment past the beat: cut on the next line's first word
    ['crouch2', 'crouch', ly.get('You crouch down low', 1).start - 0.02, { n: 2 }],
    ['chorusline', 'chorusline', onWord('tear up the floor', 'tear', 1)],
    ['vip2', 'vip', cut('run wild, run free', 2), { n: 2 }],
    // the second chorus's last VIP runs up to the bridge's first word: cut on that word's beat
    ['afterparty', 'afterparty', onWord('When the last game', 'when')],
    ['encore', 'encore', cut('tear up the floor', 2)],
    ['rosette', 'rosette', cut('My silly Frenchton')],
    // "best boy in town" is held up to the next line: cut on its first word
    ['gala', 'gala', ly.get('run wild, run free', 4).start - 0.02],
    // the final chorus's last VIP runs up to the outro's first word: cut on that word
    ['goodnight', 'goodnight', ly.get('Good boy, Gryffy').start - 0.02],
  ];

  return plan.map(([id, name, start, params], i) => ({
    id, ...scene(`dance-gryffy/${name}`), start, end: plan[i + 1]?.[2] ?? au.duration, params,
  }));
};

export default timeline;
