// The Gryffy Ball (songs/dance-gryffy/TREATMENT.md): one entry per plate, anchored to the aligned
// lyrics and snapped to the beat grid. Plates not built yet play the shared karaoke plate.
import type { TimelineEntry } from '../../engine/engine';
import type { TimelineFactory } from '../../timeline';
import { cuts, scene } from '../../timeline';

/** Plates that have their own scene module in ./scenes/ (the rest fall back to 'lyrics'). */
const BUILT = new Set<string>(['invite', 'arrival', 'crouch', 'floor', 'vip', 'king', 'intermission', 'profile', 'chorusline', 'afterparty', 'encore', 'rosette', 'gala']);

const plate = (name: string, label: string): Pick<TimelineEntry, 'load' | 'module' | 'params'> =>
  BUILT.has(name) ? scene(`dance-gryffy/${name}`) : { ...scene('lyrics'), params: { label } };

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

  const plan: [id: string, name: string, label: string, start: number, params?: Record<string, unknown>][] = [
    ['invite', 'invite', 'Intro', 0],
    ['arrival', 'arrival', 'Verse 1', cut('Gryffy kicks the door')],
    ['crouch1', 'crouch', 'Pre-Chorus', cut('You crouch down low', 0), { n: 1 }],
    ['floor', 'floor', 'Chorus', onWord('tear up the floor', 'tear', 0)],
    ['king', 'king', 'Chorus', cut('My Frenchton king', 0)],
    ['vip1', 'vip', 'Chorus', cut('run wild, run free', 0), { n: 1 }],
    ['intermission', 'intermission', 'Instrumental', section('instrumental1').start],
    ['profile', 'profile', 'Verse 2', cut('Button nose')],
    // verse 2 ends on "…it all" a moment past the beat: cut on the next line's first word
    ['crouch2', 'crouch', 'Pre-Chorus', ly.get('You crouch down low', 1).start - 0.02, { n: 2 }],
    ['chorusline', 'chorusline', 'Chorus', onWord('tear up the floor', 'tear', 1)],
    ['vip2', 'vip', 'Chorus', cut('run wild, run free', 2), { n: 2 }],
    // the second chorus's last VIP runs up to the bridge's first word: cut on that word's beat
    ['afterparty', 'afterparty', 'Bridge', onWord('When the last game', 'when')],
    ['encore', 'encore', 'Final Chorus', cut('tear up the floor', 2)],
    ['rosette', 'rosette', 'Final Chorus', cut('My silly Frenchton')],
    // "best boy in town" is held up to the next line: cut on its first word
    ['gala', 'gala', 'Final Chorus', ly.get('run wild, run free', 4).start - 0.02],
    // the final chorus's last VIP runs up to the outro's first word: cut on that word
    ['goodnight', 'goodnight', 'Outro', ly.get('Good boy, Gryffy').start - 0.02],
  ];

  return plan.map(([id, name, label, start, params], i) => {
    const p = plate(name, label);
    return { id, ...p, start, end: plan[i + 1]?.[3] ?? au.duration, params: { ...p.params, ...params } };
  });
};

export default timeline;
