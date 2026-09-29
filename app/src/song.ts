// The song being rendered: songs/<slug>/ in the repo, picked with ?song=<slug> (optional when
// there is only one song folder). vite.config.ts serves songs/ and lists the folders.
declare const __SONGS__: string[];

/** songs/<slug>/song.json (written by analysis/pipeline.py new, edited by hand). */
export interface SongMeta {
  title: string;
  artist?: string;
}

export interface Song {
  slug: string;
  meta: SongMeta;
  /** URL of a file in the song folder ('song.mp3', 'data/lyrics.json'). */
  url(path: string): string;
  /** Fetch a JSON file from the song folder; throws with a hint when it is missing. */
  json<T>(path: string): Promise<T>;
}

export function pickSong(query: string | null): string {
  const all = __SONGS__;
  if (query) {
    if (!all.includes(query)) throw new Error(`unknown song '${query}' (songs: ${all.join(', ') || 'none'})`);
    return query;
  }
  if (all.length === 1) return all[0]!;
  throw new Error(`pick a song with ?song=<slug> (songs: ${all.join(', ') || 'none, see analysis/pipeline.py new'})`);
}

export async function loadSong(slug: string): Promise<Song> {
  const url = (path: string) => `songs/${encodeURIComponent(slug)}/${path}`;
  const json = async <T>(path: string): Promise<T> => {
    const r = await fetch(url(path));
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json'))
      throw new Error(`${url(path)} not found (HTTP ${r.status}); run: cd analysis && uv run python pipeline.py run ${slug}`);
    return r.json();
  };
  return { slug, meta: await json<SongMeta>('song.json'), url, json };
}
