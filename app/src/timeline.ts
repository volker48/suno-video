// The edit: which scene plays when. A song can bring its own edit in src/songs/<slug>/timeline.ts
// (default export: a TimelineFactory) with bespoke scenes in src/songs/<slug>/scenes/; without one,
// defaultTimeline plays the shared karaoke scene once per section of data/audio.json.
// Boundaries are anchored to lyric lines and snapped to the beat grid, so they follow the aligned data.
import type { TimelineEntry } from './engine/engine';
import type { SceneClass } from './engine/scene';
import type { Line, Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';
import type { Song } from './song';

export type TimelineFactory = (ly: Lyrics, au: AudioData, song: Song) => TimelineEntry[];

// Scene modules are discovered lazily so a missing/broken scene never breaks the build.
const modules = import.meta.glob<{ default: SceneClass }>(['./scenes/*.ts', './songs/*/scenes/*.ts']);
const timelines = import.meta.glob<{ default: TimelineFactory }>('./songs/*/timeline.ts');

/** Entry fields for a scene module: 'lyrics' (shared, src/scenes/) or '<slug>/<name>' (src/songs/<slug>/scenes/). */
export function scene(name: string): Pick<TimelineEntry, 'load' | 'module'> {
  const key = name.includes('/') ? `./songs/${name.replace('/', '/scenes/')}.ts` : `./scenes/${name}.ts`;
  return {
    module: name.split('/').pop()!,
    load: () => modules[key]?.() ?? Promise.reject(new Error(`scene module not found: src/${key.slice(2)}`)),
  };
}

/** Beat-grid cut points for anchoring entries to lyrics. */
export function cuts(ly: Lyrics, au: AudioData) {
  /** The last beat at/before the first word of a line (never after the word). */
  const lineCut = (l: Line, tol = 0.02) => au.timeOfBeat(Math.floor(au.beatAt(l.words[0]!.start + tol)));
  return {
    lineCut,
    /** Cut before the nth line containing `q`. */
    cut: (q: string, nth = 0, tol = 0.02) => lineCut(ly.get(q, nth), tol),
    /** Nearest downbeat to the end of the nth line containing `q`. */
    after: (q: string, nth = 0) => {
      const e = ly.get(q, nth).end;
      return au.downbeats.reduce((b, d) => (Math.abs(d - e) < Math.abs(b - e) ? d : b), au.downbeats[0] ?? e);
    },
  };
}

/**
 * One karaoke entry per section. A section's entry starts at its downbeat, or earlier at the cut
 * before its first line when that line starts with a pickup, so a line is never split across a cut.
 */
export const defaultTimeline: TimelineFactory = (ly, au) => {
  const { lineCut } = cuts(ly, au);
  const secs = au.sections;
  const starts = secs.map((s, i) => {
    const first = ly.lines.find((l) => l.part === s.name);
    return i === 0 ? 0 : first ? Math.min(s.start, lineCut(first)) : s.start;
  });
  return secs.map((s, i) => ({
    id: s.name,
    ...scene('lyrics'),
    start: starts[i]!,
    end: starts[i + 1] ?? au.duration,
    params: { label: s.label },
  }));
};

/** The song's own timeline if it has one, else the default. */
export async function timelineFor(slug: string): Promise<TimelineFactory> {
  const m = timelines[`./songs/${slug}/timeline.ts`];
  return m ? (await m()).default : defaultTimeline;
}
