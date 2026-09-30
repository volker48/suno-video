// The Gryffy Ball (songs/dance-gryffy/TREATMENT.md): one entry per plate, anchored to the aligned
// lyrics and snapped to the beat grid. Plates not built yet play the shared karaoke plate.
import type { TimelineEntry } from '../../engine/engine';
import type { TimelineFactory } from '../../timeline';
import { cuts, scene } from '../../timeline';

/** Plates that have their own scene module in ./scenes/ (the rest fall back to 'lyrics'). */
const BUILT = new Set<string>(['crouch']);

const plate = (name: string, label: string): Pick<TimelineEntry, 'load' | 'module' | 'params'> =>
  BUILT.has(name) ? scene(`dance-gryffy/${name}`) : { ...scene('lyrics'), params: { label } };

const timeline: TimelineFactory = (ly, au) => {
  const { cut } = cuts(ly, au);
  const section = (name: string) => {
    const s = au.sections.find((x) => x.name === name);
    if (!s) throw new Error(`section not found: ${name}`);
    return s;
  };
  /** The beat nearest a word's onset: the giraffe peels away on "tear" (the nth "tear up the floor"). */
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
    ['vip1', 'vip', 'Chorus', cut('run wild, run free', 0), { n: 1 }],
    ['intermission', 'intermission', 'Instrumental', section('instrumental1').start],
    ['profile', 'profile', 'Verse 2', cut('Button nose')],
    ['crouch2', 'crouch', 'Pre-Chorus', cut('You crouch down low', 1), { n: 2 }],
    ['chorusline', 'chorusline', 'Chorus', onWord('tear up the floor', 'tear', 1)],
    ['vip2', 'vip', 'Chorus', cut('run wild, run free', 2), { n: 2 }],
    ['afterparty', 'afterparty', 'Bridge', cut('When the last game')],
    ['encore', 'encore', 'Final Chorus', cut('tear up the floor', 2)],
    ['goodnight', 'goodnight', 'Outro', cut('Good boy, Gryffy')],
  ];

  return plan.map(([id, name, label, start, params], i) => {
    const p = plate(name, label);
    return { id, ...p, start, end: plan[i + 1]?.[3] ?? au.duration, params: { ...p.params, ...params } };
  });
};

export default timeline;
