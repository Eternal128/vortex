import { Arrow, Box, Note, Svg, Zone, accent, ink, line, muted, series, surface } from "./primitives";

/** Scattered videos on the left, the same videos as an ordered course on the right. */
export function VortexBeforeAfter() {
  const id = "vortex-before-after";
  const scattered: [number, number, number][] = [
    [40, 70, -8], [150, 60, 6], [70, 150, 4], [190, 150, -5], [50, 230, 7], [165, 240, -3],
  ];
  const lessons = ["1.1  What a token is", "1.2  Context windows", "1.3  Choosing a model"];
  return (
    <Svg id={id} height={340} title="Before: scattered videos with no order or checkpoints. After: the same videos as an ordered course with progress and a quiz per lesson.">
      <Zone x={10} y={10} w={320} h={320} label="On YouTube" tone="outside" />
      {scattered.map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x + 45} ${y + 28})`}>
          <rect x={x} y={y} width={90} height={56} rx={8} fill={series[i % 3]} opacity={0.85} />
          <circle cx={x + 45} cy={y + 28} r={11} fill={surface} opacity={0.9} />
          <path d={`M${x + 41} ${y + 22} L${x + 51} ${y + 28} L${x + 41} ${y + 34} Z`} fill={ink} />
        </g>
      ))}
      <Note x={30} y={316}>no order · no checkpoints · “did I get it?”</Note>

      <Arrow id={id} points={[[345, 170], [455, 170]]} label="Vortex" labelAt={[400, 160]} />

      <Zone x={470} y={10} w={320} h={320} label="As a course" tone="trusted" />
      <Box x={490} y={48} w={280} h={44} label="Module 1 · LLM fundamentals" align="start" strong />
      {lessons.map((lesson, i) => {
        const y = 106 + i * 58;
        const done = i < 2;
        return (
          <g key={lesson}>
            <rect x={490} y={y} width={280} height={46} rx={10} fill={surface} stroke={line} />
            <rect x={502} y={y + 9} width={46} height={28} rx={6} fill={series[i]} />
            <text x={560} y={y + 28} fontSize={13} fill={ink}>{lesson}</text>
            <circle cx={748} cy={y + 23} r={10} fill={done ? ink : surface} stroke={done ? ink : line} />
            {done ? <path d={`M743 ${y + 23} l4 4 l7 -8`} stroke={surface} strokeWidth={2} fill="none" /> : null}
          </g>
        );
      })}
      <rect x={490} y={282} width={120} height={28} rx={14} fill={accent} />
      <text x={550} y={301} textAnchor="middle" fontSize={12} fontWeight={600} fill="#1f1f1f">Quiz after each</text>
      <Note x={624} y={301}>place saved to the second</Note>
    </Svg>
  );
}

/** The two workspaces and the services the server talks to. */
export function SystemArchitecture() {
  const id = "system-architecture";
  return (
    <Svg id={id} height={470} title="Architecture: the browser talks only to the Next.js server; the server holds every credential and talks to Sanity, Clerk, the LLM, YouTube and PostHog. The Studio and offline ingestion write content to Sanity.">
      <Zone x={10} y={10} w={200} h={450} label="Browser" tone="outside" />
      <Box x={26} y={60} w={168} h={52} label="Pages (HTML)" sub="read-only views" />
      <Box x={26} y={126} w={168} h={52} label="Search UI" sub="client component" />
      <Box x={26} y={192} w={168} h={52} label="Player + quiz" sub="YouTube embed" />
      <Box x={26} y={258} w={168} h={52} label="PostHog JS" sub="public project key" />
      <Box x={26} y={324} w={168} h={52} label="Clerk UI" sub="publishable key" />

      <Zone x={250} y={10} w={260} h={450} label="Server · every token" tone="trusted" />
      <Box x={266} y={60} w={228} h={52} label="Server components" sub="sanityFetch · read token" strong />
      <Box x={266} y={126} w={228} h={52} label="/api/search" sub="MCP + LLM + grounding" />
      <Box x={266} y={192} w={228} h={52} label="/api/progress · /api/enroll" sub="write token · CAS" />
      <Box x={266} y={258} w={228} h={52} label="/api/plans" sub="LLM + YouTube Data API" />
      <Box x={266} y={324} w={228} h={52} label="/api/ideas" sub="guards · moderation" />
      <Box x={266} y={390} w={228} h={52} label="Clerk middleware" sub="session on every route" />

      <Zone x={550} y={10} w={240} h={450} label="Services" tone="outside" />
      <Box x={566} y={60} w={208} h={52} label="Sanity dataset" sub="private" tint={series[0]} />
      <Box x={566} y={126} w={208} h={52} label="Sanity Context MCP" sub="scoped GROQ tool" tint={series[0]} />
      <Box x={566} y={192} w={208} h={52} label="LLM (Groq / OpenAI)" sub="structured output" tint={series[1]} />
      <Box x={566} y={258} w={208} h={52} label="YouTube Data API" sub="safe search, embeddable" tint={series[2]} />
      <Box x={566} y={324} w={208} h={52} label="Clerk" sub="identity" />
      <Box x={566} y={390} w={208} h={52} label="PostHog" sub="analytics" />

      <Arrow id={id} points={[[194, 152], [262, 152]]} />
      <Arrow id={id} points={[[194, 218], [262, 218]]} />
      <Arrow id={id} points={[[194, 86], [262, 86]]} />
      <Arrow id={id} points={[[494, 86], [562, 86]]} />
      <Arrow id={id} points={[[494, 146], [562, 146]]} />
      <Arrow id={id} points={[[494, 160], [530, 160], [530, 212], [562, 212]]} />
      <Arrow id={id} points={[[494, 218], [540, 218], [540, 96], [562, 96]]} dashed />
      <Arrow id={id} points={[[494, 284], [562, 284]]} />
      <Arrow id={id} points={[[494, 416], [562, 350]]} dashed />
      <text x={105} y={430} textAnchor="middle" fontSize={11.5} fill={muted} fontFamily="var(--font-mono)">no secrets</text>
      <text x={105} y={445} textAnchor="middle" fontSize={11.5} fill={muted} fontFamily="var(--font-mono)">in the browser</text>
    </Svg>
  );
}

/** Query → model lane and keyword lane in parallel → merge → ground → rank. */
export function SearchPipeline() {
  const id = "search-pipeline";
  return (
    <Svg id={id} height={330} title="Search pipeline: the query runs through the model over the Context MCP and through a keyword and chapter pass in parallel; hits are merged, then grounded against the dataset before cards are returned.">
      <Box x={10} y={135} w={120} h={60} label="Query" sub="plain English" strong />
      <Arrow id={id} points={[[130, 150], [170, 150], [170, 70], [196, 70]]} />
      <Arrow id={id} points={[[130, 180], [170, 180], [170, 260], [196, 260]]} />

      <Box x={200} y={40} w={200} h={60} label="LLM + Context MCP" sub="writes GROQ, returns ids" tint={series[1]} />
      <Box x={200} y={230} w={200} h={60} label="Keyword + chapter pass" sub="deterministic backup" tint={series[0]} />
      <Note x={300} y={130} anchor="middle">chapters first,</Note>
      <Note x={300} y={146} anchor="middle">then transcript chunks</Note>
      <Note x={300} y={206} anchor="middle">time-boxed: keyword</Note>
      <Note x={300} y={222} anchor="middle">results ship alone if needed</Note>

      <Arrow id={id} points={[[400, 70], [440, 70], [440, 150], [462, 150]]} />
      <Arrow id={id} points={[[400, 260], [440, 260], [440, 180], [462, 180]]} />
      <Box x={466} y={135} w={110} h={60} label="Merge" sub="one per lesson" />
      <Arrow id={id} points={[[576, 165], [612, 165]]} />
      <rect x={616} y={100} width={174} height={130} rx={10} fill={surface} stroke={line} strokeWidth={1.25} />
      <text x={703} y={128} textAnchor="middle" fontSize={14} fontWeight={600} fill={ink} letterSpacing="-0.2">Ground</text>
      <text x={703} y={150} textAnchor="middle" fontSize={11.5} fill={muted} fontFamily="var(--font-mono)">re-read every field</text>
      <text x={703} y={167} textAnchor="middle" fontSize={11.5} fill={muted} fontFamily="var(--font-mono)">from Sanity; drop</text>
      <text x={703} y={184} textAnchor="middle" fontSize={11.5} fill={muted} fontFamily="var(--font-mono)">unknown lesson ids</text>
      <text x={703} y={210} textAnchor="middle" fontSize={11.5} fill={muted} fontFamily="var(--font-mono)">→ ranked cards</text>
      <Note x={703} y={260} anchor="middle">the model never writes</Note>
      <Note x={703} y={276} anchor="middle">a title or a duration</Note>
    </Svg>
  );
}

/** Offline: URL → captions + chapters → chunked video document. */
export function IngestionPipeline() {
  const id = "ingestion-pipeline";
  return (
    <Svg id={id} height={250} title="Ingestion runs offline: a lesson's video URL yields captions and chapters, captions are split into short timestamped chunks, and both are stored on one video document that search reads selectively.">
      <Zone x={10} y={10} w={560} h={230} label="Offline tooling (studio/scripts/ingest)" tone="outside" />
      <Box x={30} y={100} w={130} h={56} label="Video URL" sub="from a lesson" />
      <Arrow id={id} points={[[160, 116], [200, 116], [200, 76], [222, 76]]} />
      <Arrow id={id} points={[[160, 140], [200, 140], [200, 180], [222, 180]]} />
      <Box x={226} y={48} w={150} h={56} label="Captions" sub="timed text" />
      <Box x={226} y={152} w={150} h={56} label="Chapters" sub="table of contents" />
      <Arrow id={id} points={[[376, 76], [412, 76]]} />
      <Box x={416} y={48} w={140} h={56} label="Chunk" sub="short, timestamped" />
      <Arrow id={id} points={[[556, 76], [610, 76], [610, 110], [620, 110]]} />
      <Arrow id={id} points={[[376, 180], [610, 180], [610, 146], [620, 146]]} />
      <Box x={624} y={90} w={166} h={76} label="video document" sub="chapters[] · chunks[]" strong />
      <Note x={707} y={196} anchor="middle">search fetches a few</Note>
      <Note x={707} y={212} anchor="middle">matching chunks, never all</Note>
    </Svg>
  );
}

/** Where each credential lives, and which way requests may cross. */
export function TrustBoundaries() {
  const id = "trust-boundaries";
  const secrets = ["SANITY_API_READ_TOKEN", "SANITY_API_WRITE_TOKEN", "CLERK_SECRET_KEY", "GROQ / OPENAI keys", "YOUTUBE_API_KEY"];
  return (
    <Svg id={id} height={330} title="Trust boundaries: the browser holds only public keys; every secret token stays on the server; the private dataset is reachable only from the server.">
      <Zone x={10} y={10} w={230} h={310} label="Browser · untrusted" tone="outside" />
      <Box x={26} y={60} w={198} h={50} label="Clerk publishable key" sub="public by design" />
      <Box x={26} y={124} w={198} h={50} label="PostHog project key" sub="public by design" />
      <Note x={125} y={214} anchor="middle">sends: session cookie,</Note>
      <Note x={125} y={230} anchor="middle">JSON bodies</Note>
      <Note x={125} y={270} anchor="middle">never: tokens, writes</Note>

      <Zone x={290} y={10} w={250} h={310} label="Server · trusted" tone="trusted" />
      {secrets.map((secret, i) => (
        <g key={secret}>
          <rect x={306} y={52 + i * 50} width={218} height={38} rx={8} fill={surface} stroke={line} />
          <rect x={318} y={65 + i * 50} width={12} height={12} rx={3} fill={accent} />
          <text x={340} y={76 + i * 50} fontSize={12} fill={ink} fontFamily="var(--font-mono)">{secret}</text>
        </g>
      ))}
      <Note x={415} y={310} anchor="middle">server-only modules; build fails if imported client-side</Note>

      <Zone x={590} y={10} w={200} h={310} label="Services" tone="outside" />
      <Box x={606} y={70} w={168} h={50} label="Private dataset" sub="token required" />
      <Box x={606} y={140} w={168} h={50} label="LLM · YouTube" sub="keyed APIs" />
      <Box x={606} y={210} w={168} h={50} label="Clerk" sub="verifies sessions" />

      <Arrow id={id} points={[[240, 165], [286, 165]]} label="HTTPS" labelAt={[263, 155]} />
      <Arrow id={id} points={[[540, 95], [602, 95]]} />
      <Arrow id={id} points={[[540, 165], [602, 165]]} />
      <Arrow id={id} points={[[540, 235], [602, 235]]} />
    </Svg>
  );
}

/** The ordered checks every write passes before it touches the dataset. */
export function WritePathGuards() {
  const id = "write-path-guards";
  const steps: [string, string, string][] = [
    ["Origin", "403 · 415", "same origin, JSON body"],
    ["Session", "401", "Clerk user id"],
    ["Schema", "400", "Zod validation"],
    ["Rate limit", "429", "counted from dataset"],
    ["Server fields", "owner, status", "set by the server"],
    ["CAS write", "ifRevisionID", "compare-and-set"],
  ];
  return (
    <Svg id={id} height={200} title="A write request passes, in order: same-origin and JSON checks, a Clerk session, schema validation, a rate limit counted from the dataset, server-set ownership fields, then a compare-and-set write.">
      <Box x={10} y={70} w={90} h={56} label="Request" strong />
      {steps.map(([label, sub, detail], i) => {
        const x = 118 + i * 113;
        return (
          <g key={label}>
            <Arrow id={id} points={[[x - 18 + (i === 0 ? 0 : 0), 98], [x - 2, 98]]} />
            <Box x={x} y={70} w={100} h={56} label={label} sub={sub} />
            <text x={x + 50} y={150} textAnchor="middle" fontSize={11} fill={muted}>{detail}</text>
          </g>
        );
      })}
      <Note x={400} y={40} anchor="middle">each gate rejects early with its own status code</Note>
    </Svg>
  );
}

/** How a creator's video reaches a learner, and what never happens to it. */
export function CreatorFlow() {
  const id = "creator-flow";
  return (
    <Svg id={id} height={300} title="The creator's video stays on YouTube and plays through YouTube's own embedded player on the lesson page, with the channel credited. Captions feed an internal search index that is never shown whole. Vortex never downloads or re-hosts the video.">
      <Box x={10} y={120} w={150} h={64} label="Creator's video" sub="hosted on YouTube" tint={series[1]} />
      <Arrow id={id} points={[[160, 140], [260, 90]]} label="embed" labelAt={[196, 102]} />
      <Arrow id={id} points={[[160, 164], [260, 214]]} dashed label="captions" labelAt={[196, 206]} />
      <Box x={264} y={56} w={230} h={64} label="YouTube's embedded player" sub="on the lesson page" strong />
      <Box x={264} y={184} w={230} h={64} label="Search index" sub="short chunks, internal" />
      <Arrow id={id} points={[[494, 88], [560, 88]]} />
      <Arrow id={id} points={[[494, 216], [560, 216]]} />
      <Box x={564} y={56} w={226} h={64} label="Learner watches" sub="“by <channel>” on every lesson" />
      <Box x={564} y={184} w={226} h={64} label="Result: a lesson + second" sub="links back into the player" />
      <g>
        <rect x={20} y={250} width={140} height={32} rx={8} fill="none" stroke={line} strokeDasharray="4 4" />
        <path d="M30 258 L150 274" stroke={muted} strokeWidth={1.2} />
        <text x={90} y={271} textAnchor="middle" fontSize={11.5} fill={muted} fontFamily="var(--font-mono)">download / re-host</text>
      </g>
    </Svg>
  );
}
