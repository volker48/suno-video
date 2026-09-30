# Dance, Gryffy — treatment & style bible

## The idea in one paragraph

The video is **The Gryffy Ball**: a black-tie gala held in Gryffy's honour, told through the stationery and rituals of a formal evening (the invitation, the house rules, the dance manual, the guest list at the velvet rope, the society portrait, the programme) and through the ballroom itself (spotlights, a parquet floor seen from above, a chandelier, a mirror ball). The song's pun holds it together: **the ball** is his bright green ball, the dance, and the mirror ball. His coat is already a tuxedo, so the video is in **his colours**: tux black, shirt-front white, ball green. The comedy comes from one collision played completely straight: **the gala is very formal, and Gryffy is a dog.** Every plate sets up something correct and elegant, and Gryffy wrecks it with his real habits: zoomies, snorts, squeaky toys, smooshing a toy into you to make you play, ears that can't take a breeze, and snoring like a lawnmower. The paper never breaks character. It just keeps revising its rules in his favour, because he's a sweet good boy and the night is his. He always wins.

## Tone

- **Funny the way a butler is funny next to an excited dog.** Deadpan etiquette, fine print, stamps, charts and measurements, all applied with total seriousness to a small black dog. The joke is in the contrast and in real details (his real habits, his real face), never in mugging.
- **Dynamic.** Big changes land on the beat: cuts on downbeats, hits on kicks and snares, camera moves that ease into downbeats. Zoomies are genuinely fast: strong eases (`outExpo`, springs), speed streaks, holds, then snaps. The bridge is the one slow passage, and it should feel like the lights actually going down.
- **Elegant, not cute.** Precise hairlines, engraved line, high-contrast type, lots of black. Glow only on the ball.
- **Affectionate, never mean.** Gryffy is never the butt of the joke. The event is. When he wrecks something, the paperwork concedes, and the next rule is rewritten for him.
- **Not slop:** no emoji, no speech or thought bubbles, no cartoon eyes or sweat drops, no clip-art paw prints, no generic confetti explosions, no rainbow disco lights, no stock "party" imagery, nothing that looks AI-generated. The reference images in `ref/` are for likeness only; the video does not reproduce their painted or anime styles.
- **Cast:** only Gryffy. No other dogs and no people: "the whole room" is spotlights and portraits, "by my feet" is a pair of empty dress shoes. Many Gryffys at once are allowed (the chorus line in chorus 2).

## Gryffy (the character)

Modelled on `ref/tuxedo.jpg`, which is the primary likeness reference. The other images in `ref/` confirm his features but are painted or stylised.

- **Features that must read at every size:** very big upright bat ears with pink insides; a glossy black coat; a white bib down the chest; a small white fleck on the forehead between the eyes; big round brown eyes; a pink lower lip that shows under a short black muzzle, grey-flecked at the chin; a tail that is just a nub; a tongue that is out whenever he's happy.
- **Two registers:**
  1. **The portrait**: an engraving (line hatching, like a banknote or a society-page plate) made from the tuxedo photo. Used for still, formal moments: the herald's card, the society portrait, the coronation, the rosette.
  2. **The figure**: a drawn, rigged puppet (ink fill, bone contour and hatching, pink only on the tongue, lip and inner ears) animated procedurally on the beat: trot, zoomies gallop (the body stretches with speed), spin, crouch, pounce, skid, flop, sleep-breathing, ear flaps, head tilt, tongue out. One rig serves every plate.
- He wears the tux (black jacket, white shirt front with three studs, black bow tie) or just his coat, which reads as a tux anyway. The bow tie is a running prop: loose in verse 1, sideways in verse 2, undone in the bridge.

## Palette

The engine palette is retuned for this song (keys stay the same, values change; per-song palettes are an engine change to make when the build starts, so the default lyrics plate keeps its look for other songs):

| key | role | hex |
|---|---|---|
| `ink` | tux black: background | `#0B0B0C` |
| `ink2` | satin: lapels, panels, the dark side of the coat | `#17171A` |
| `graphite` | dim lines, secondary text | `#5C5B58` |
| `ash` | mid grey, the grey on his chin | `#9C978F` |
| `bone` | shirt front: paper, type, his white bib | `#F1EEE7` |
| `signal` | **ball green**: the ball, the sung word, highlights | `#D8FF3C` |
| `ember` | the ball's hot core, the mirror ball's glints | `#F2FFB0` |
| `blood` | deep green: the ball's shadow side, green on paper | `#6F8A00` |
| `accent` | **gilt**: the crown, gilt frames, the bridge lamp, rarely | `#E8B25A` |

- **Tongue pink** `#EE8F98` is Gryffy's own colour: tongue, lower lip and inner ears only, never type or graphics.
- **Giraffe blue** `#9CCBEA` belongs to his favourite squeaky toy, a baby-blue giraffe, and to nothing else.
- Some plates are **bone paper with ink** (the invitation, the house rules, the dance manual, the deed), which gives the edit a light/dark rhythm. On paper the sung word is ink with a ball-green highlighter swipe behind it (green type on white can't be read).
- Only the ball (signal/ember) glows. Bone type stays crisp.

## Typography

- **Archivo**: the singer. Big, bold, confident. Width and weight animate for character: the type stretches wide with zoomies speed, squashes on a skid, and condenses when he crouches.
- **Cormorant Garamond** (italic especially): the gala. The invitation, portrait captions, place cards, the name on the rosette, and the bridge, where the whole lyric voice turns to serif italic.
- **IBM Plex Mono**: the staff and the fine print. House rules, measurements, chart labels, readouts (`SNORE 94 dB`, `LAP 7`, `FORCE 4`).
- **Single-stroke script** (`stroke.ts`): handwriting. Notes in the dance manual's margin, and the "Good boy" at the end.
- Layout: invitation symmetry for the stationery (centred, double rules, small caps); asymmetric Swiss grid for everything else. Every proportional line is kerned; typographic punctuation (’ “ ” – — ×) except in the mono voice.

## Karaoke rules (all plates)

- Every lyric line is **readable** and **synced per word**: a word appears or highlights exactly at its `start` and completes by its `end` (`Lyrics.wordProgress`). Unsung words may show dim up to ~0.4 s early; highlighting never runs ahead of the voice.
- Each plate integrates the lyric **as part of the image**: printed on the invitation, set on the tailor's ticket, riding the dance-step arc, stamped on the guest list, typeset on the rosette.
- Default emphasis: the sung word in ball green on dark (or ink with a green swipe on paper), sung words in bone, unsung words at ~30% bone.
- Keep lyric text inside title-safe (≥ 96 px from the edges).

## Motifs

1. **The ball (VIP).** The only green thing in the world, and the video's light source. It is the invitation's wax seal, the dance floor's centre mark, the VIP with a lanyard (`VIP · ALL ACCESS`), the mirror ball, and the thing he sleeps next to. It is never out of the video for long.
2. **The House Rules.** A small mono notice in each plate's fine print. The rules give in to Gryffy one by one: *Guests are kindly asked not to zoom.* → *Please close the doors: draughts upset the guest of honour's ears.* → *Zooming is discouraged on the parquet.* → *Squeaking is permitted during the intermission.* → *Zooming is now mandatory.* → *Quiet please. The guest of honour is snoring.* → *The ball stays with Gryffy.*
3. **The dance chart.** A ballroom step diagram with paw prints for footprints, numbered counts and slow/quick marks. Each chorus it gets worse: chorus 1 is a proper figure, chorus 2 is the zoomies (hundreds of prints in a tangle), the final chorus is the whole floor covered in prints with one word, ENCORE.
4. **The smoosh.** Three times, Gryffy pushes a toy into the lens to make you play. The toy squashes flat against the glass, fills the frame and squeaks, and leaves a **nose print** on the lens that stays for a few beats until a cloth-wipe transition wipes it off. His favourite toy is a **baby-blue squeaky giraffe**. Each smoosh is bigger than the last: the giraffe, side-on; the giraffe again, head first, its neck folding against the glass; then the ball.
5. **The ears.** His bat ears are a wind gauge. A draught from the doors flips them in verse 1; the Beaufort Scale for Bat Ears measures them in verse 2; in the outro the doors are shut and they finally relax.
6. **The snore.** In the bridge the snore is loud and on the beat: the chandelier tinkles, the lamp flickers, the lyric type puffs up with each breath, and a readout says `SNORE 94 dB`. The last snore of the video flutters the invitation card.

## Plates (scene modules)

Times are approximate; exact windows come from `app/src/songs/dance-gryffy/timeline.ts`, which is derived from the aligned lyrics. Scenes look lines up by content through the `Lyrics` API, never by hard-coded times. Line numbers are 0-based, as in `data/lyrics.json`.

| id | window | lyric |
|---|---|---|
| `invite` | 0:00 → verse 1 | (intro) |
| `arrival` | verse 1 (0:02–0:16) | Gryffy kicks the door… / Tiny tux… / One snort… / Then that green ball rolls… |
| `crouch` ×2 | pre-choruses (0:16–0:24, 1:14–1:22) | You crouch down low… / Tail up, paws set… |
| `floor` | chorus 1, first half (0:23–0:40) | Dance, Gryffy, tear up the floor… / …you own this town |
| `vip` ×2 | chorus 1 and chorus 2, second halves (0:40–0:54, 1:37–1:51) | Dance, Gryffy, run wild, run free / That bright green ball’s your VIP (×2) |
| `intermission` | instrumental (0:55–0:59) | (the unlisted "…green… VIP" tag) |
| `profile` | verse 2 (0:59–1:14) | Button nose… / Skids past the sofa… / Bow tie sideways… / He claims the rug… |
| `chorusline` | chorus 2, first half (1:22–1:37) | Dance, Gryffy, tear up the floor… / …you own this town |
| `afterparty` | bridge (1:51–2:06) | When the last game’s over… / …stealing the show |
| `encore` | final chorus (2:05–2:35) | Dance, Gryffy… / Little tuxedo king, give us one more… / …best boy in town / VIP ×3 |
| `goodnight` | outro (2:34–2:42) | Good boy, Gryffy… / Tuxedo tucked in… |

### `invite` — "You are cordially invited"
On the first downbeat an engraved invitation card slides into a black frame: double hairline border, `ADMIT ONE · BLACK TIE` in spaced mono small caps, *The Gryffy Ball* in Cormorant italic, "requests the pleasure of your company", and the green ball pressed into the bottom edge as a wax seal. The first House Rule sits at the foot: *Guests are kindly asked not to zoom.* The seal glints on the second downbeat and the card folds open down the middle into verse 1.

### `arrival` — "The entrance"
"Gryffy kicks the door with a bow tie loose": the invitation's two halves become the ballroom doors, and they burst open on "kicks". A gust comes through: his ears flip back, he stops dead mid-step for a beat (deadpan), the bow tie flaps loose, then he marches in anyway. The House Rule updates: *Please close the doors: draughts upset the guest of honour's ears.* "Tiny tux, big attitude, nothing to lose": a **tailor's ticket** pinned to the lapel, the lyric typed into its fields as sung: `TUX: tiny · ATTITUDE: big · TO LOSE: nothing`, with his measurements in the margin (`CHEST 18 in · EARS 4.5 in, UPRIGHT`). "One snort and the whole room’s looking his way": the snort is a visible puff on the beat, and every spotlight in the ballroom swings onto him at once. Along the walls, a gallery of engraved Gryffy ancestor portraits (all him, in ruffs and crowns, a nod to the royal portraits in `ref/`) turn their heads to look. "Then that green ball rolls—he’s gone, no delay": the ball rolls in from off-frame on a long tracking shot. On "gone" he is a black-and-white speed streak, and the spot where he stood is empty except for the bow tie, still floating down.

### `crouch` ×2 — "The dance manual" — params `{n: 1|2}`
A page from a ballroom dance manual (bone paper, ink), the lyric set as the manual's instructions. "You crouch down low": **Position 1: The Crouch**, an engraved diagram of Gryffy in a play bow, with dimension lines (`FRONT: LOW · REAR: HIGH`). "I know that grin": a callout circles the grin, and his tongue comes out. "Tail up": a magnifier callout finds his tail, which is just a nub, labelled `TAIL (UP)` in deadpan mono, with a scale bar. "paws set": the forepaws land on two marked X's on the floor. "let the trouble begin": a count-in (5, 6, 7, 8) in the margin, then he pounces straight at camera with the giraffe in his mouth on the chorus pickup ("Dance,"): **the smoosh**. The giraffe hits the glass on the downbeat and squashes flat, "Dance, Gryffy" is printed across the squashed giraffe as it's sung, `squeak` is typeset beside it in small italic, and on "tear up the floor" the giraffe peels away to reveal `floor`, leaving a nose print on the glass for the first bar of the chorus.
- `n: 1`: a clean page; the giraffe is smooshed side-on.
- `n: 2`: the same page, now with pencilled margin notes in single-stroke script ("see: trouble, p. 12", "he knows"), and the giraffe smooshed harder, head first, its neck folding against the glass.

### `floor` — "The Gryffy, a basic figure"
"Dance, Gryffy, tear up the floor": top-down on the dark parquet (herringbone hairlines), a proper ballroom step chart. On "tear up" he hits the zoomies and the parquet planks literally peel up in a line behind him. House Rule: *Zooming is discouraged on the parquet.* "Little black-and-white blur going back for more": he's pure speed streak now, black and white smeared into a blur that laps the floor and comes back for another pass; the lyric stretches wide with his speed (Archivo width 62 → 125). "Snort, spin, bring it right back around": **the dance chart**, paw prints stepping round a circle on the counts (1 SNORT, slow · 2 SPIN, quick · 3–4 BRING IT · 5–8 BACK AROUND), the lyric riding the arc, the ball at the centre. "My Frenchton king, you own this town": a gilt frame drops in on the downbeat around his engraved portrait, and on "king" a crown is lowered onto his head, slightly too big, slipping over one ear. "you own this town": pull back to an engraved town map with the deed stamped `OWNER: GRYFFY`.

### `vip` ×2 — "The velvet rope" — params `{n: 1|2}`
"Dance, Gryffy, run wild, run free": zoomies laps round the ballroom seen from above, the lyric racing the lap, with a mono counter (`LAP 3 … LAP 7`) and a speed readout. "That bright green ball’s your VIP": the velvet rope and the guest list on a clipboard; the ball arrives down a red-carpet strip under a barrage of camera flashes (flashes only, no photographers), wearing a lanyard, `VIP · ALL ACCESS`, and "VIP" is stamped onto the list in green. The couplet repeats: the second time, the ball's name is already stamped and the flashes double.
- `n: 1` (chorus 1): the guest list has one name. The giraffe is listed as the ball's `+1`.
- `n: 2` (chorus 2): the list has grown to three pages, every entry is the ball, and the rope has been chewed through.

### `intermission` — "A short intermission"
Two bars. A formal card: *There will now be a short intermission.* The ball bounces across the frame, one hit per beat, and on each hit a squeak is typeset in Cormorant italic. House Rule: *Squeaking is permitted during the intermission.* The unlisted vocal tag ("…green… VIP") gets a small green VIP stamp and nothing more.

### `profile` — "The society pages" (four movements)
1. "Button nose and a crooked little smile": the engraved society portrait (from the tuxedo photo), annotated like a naturalist's plate. Leader lines label `NOSE: BUTTON` and `SMILE: CROOKED (L)` as each is sung; the pink lip shows.
2. "Skids past the sofa like a champion mile": a **photo-finish** strip (slit-scan look), with the sofa as the finish line and Gryffy stretched across it mid-skid. A slow-motion replay follows with a telestrator arc drawn over the skid (borrowed from the broadcast concept), and a readout: `1 MILE · 3.2 s · NEW RECORD`.
3. "Bow tie sideways, ears standing tall": **the Beaufort Scale for Bat Ears**, a formal chart with engraved ear diagrams per row. `FORCE 0 · ears up, fully operational` / `FORCE 2 · ears twitch, Gryffy suspicious` / `FORCE 4 · ears standing tall, bow tie sideways` / `FORCE 6 · ears inside out, Gryffy reconsiders` / `FORCE 8 · Gryffy has gone back inside`. The wind picks up across the frame, the bow tie spins sideways, and the lyric lights FORCE 4.
4. "He claims the rug like he owns it all": the rug seen from above becomes a surveyor's plan. He turns three circles and lies down on it, a boundary is drawn around him, and the deed is stamped `HIS` on "all".

### `chorusline` — "The Busby Berkeley number"
The big production number of chorus 2. Overhead, a kaleidoscope of a dozen Gryffys (a nod to the fishing-game photo) in tuxes on a black floor, forming patterns that change every bar. "Dance, Gryffy, tear up the floor": the ring rotates and blooms. "Little black-and-white blur": the pattern spins into a black-and-white pinwheel blur. "Snort, spin, bring it right back around": all twelve snort and spin in unison on the beat. "My Frenchton king, you own this town": the kaleidoscope resolves into the shape of a crown, then the camera cuts to the throne: one Gryffy on a gilt chair, the crown now fitting. House Rule: *Zooming is now mandatory.*

### `afterparty` — "After the ball"
The one slow plate. The ballroom after the party: chairs up on the tables, streamers on the floor, one lamp (gilt, the only warm light), everything else black. The lyric turns to Cormorant italic and slows down. "When the last game’s over, you flop by my feet": he flops (a proper full-body flop) beside a pair of empty dress shoes. "Still in your suit, with a dream to repeat": he's asleep in the tux with the bow tie undone; his paws paddle as he dreams, and on the wall the lamp throws a slow shadow of the ball bouncing, on a loop. "One sleepy snuffle, your eyelids get slow": **the snore**. Each snore lands on the beat: the chandelier tinkles, the lamp flickers, the lyric puffs up and settles, and `SNORE 94 dB` reads out in the corner. House Rule: *Quiet please. The guest of honour is snoring.* On "eyelids get slow" the frame closes like an iris to his face. "My little gentleman, stealing the show": the spotlight finds him asleep, and he has pulled the evening's programme under his chin as a pillow. It reads *Tonight's show*, and he's stolen it.

### `encore` — "Give us one more"
"Dance, Gryffy, tear up the floor": he's awake instantly and the lights slam on (full zoomies). "Little tuxedo king, give us one more": the **final smoosh**. He pushes the ball itself into the lens on "one more": green fills the frame, the biggest nose print yet, and we play (the ball is thrown, the camera whips after it). "Snort, spin, bring it right back around": the dance chart, now covered edge to edge in paw prints, with one word left on it: ENCORE. "My silly Frenchton, best boy in town": a **dog-show rosette** is pinned to his lapel, ribbons in black, white and green, the lyric typeset on it: *Best Boy in Town*. "run wild, run free / That bright green ball’s your VIP" ×2: the whole gala at full tilt, the mirror ball descends and turns out to be the green ball, scattering green light spots across the room, and confetti in the three colours. The extra last line, "Bright green ball’s your VIP", holds on the ball filling the frame.

### `goodnight` — "Good boy"
"Good boy, Gryffy, the party winds down": the invitation card from `invite`, back in its black frame. The doors are shut, and his ears relax at last. "Good boy" is handwritten across the card by a pen in single-stroke script. "Tuxedo tucked in, ball close at your paws": the engraved portrait on the card is now of him asleep in the tux with the ball tucked by his paws. Last House Rule: *The ball stays with Gryffy.* One last snore flutters the card, and it settles back exactly into the video's first frame, so the video loops.

## Technical conventions

See `docs/ENGINE.md`. Deterministic, per-word sync, beat-synced motion, hard cuts on downbeats, < 25 ms/frame. The Gryffy rig is one shared module (`app/src/songs/dance-gryffy/gryffy.ts`) used by every plate that shows the figure. The portrait engraving is prepared once from `ref/tuxedo.jpg` (a cut-out mask plus a luminance map for the hatching). Build order: the rig and the portrait first, then the plates the viewer sees most (`floor`, `vip`, `crouch`), then the rest in song order.
