import { defineQuery } from "next-sanity";

/**
 * Every query the site reads content through. Names are unique across the codebase because
 * TypeGen keys generated result types off the variable name.
 *
 * Conventions:
 * - project `"slug": slug.current` so callers never unwrap a slug object
 * - project `_key` on every array item, for React keys and Visual Editing
 * - list queries never return Portable Text bodies
 * - module and lesson numbering is derived from array order by the caller, never stored
 */

const COURSE_CARD_FIELDS = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  summary,
  level,
  price,
  popular,
  coverImage,
  accent,
  artLabel,
  "outcomes": learningOutcomes[0...3].title,
  "creators": *[_type == "video" && url in ^.modules[].lessons[]->videoUrl]{channel, channelId, channelAvatar},
  "category": category->{title, "slug": slug.current},
  "moduleCount": count(modules),
  "lessonIds": modules[].lessons[]._ref,
  "lessonMeta": modules[].lessons[]->{_id, duration},
  "lessonCount": count(modules[].lessons[]),
  "freeLessonCount": count((modules[].lessons[]->)[freePreview == true]),
  "durationSeconds": math::sum(modules[].lessons[]->duration)
`;

/** Catalog listing. Popular courses first, then alphabetical. */
export const COURSES_LIST_QUERY = defineQuery(`
  *[_type == "course" && defined(slug.current)]
  | order(popular desc, title asc) {
    ${COURSE_CARD_FIELDS}
  }
`);

/** The most recently added course, announced by the home hero's "New" pill. */
export const NEWEST_COURSE_QUERY = defineQuery(`
  *[_type == "course" && defined(slug.current)] | order(_createdAt desc)[0]{
    title,
    "slug": slug.current
  }
`);

/** One real lesson and its first key point, drawn as the home hero's floating "note" card. */
export const HOME_NOTE_LESSON_QUERY = defineQuery(`
  *[_type == "lesson" && defined(slug.current) && count(keyPoints) > 0]
  | order(_createdAt asc)[0]{
    title,
    "slug": slug.current,
    "keyPoint": keyPoints[0],
    "course": *[_type == "course" && references(^._id)][0]{title}
  }
`);

/** Slugs for generateStaticParams. */
export const COURSE_SLUGS_QUERY = defineQuery(`
  *[_type == "course" && defined(slug.current)]{"slug": slug.current}
`);

/** Full course detail, including the curriculum. */
export const COURSE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "course" && slug.current == $slug][0]{
    ${COURSE_CARD_FIELDS},
    "relatedPosts": *[_type == "post" && references(^._id) && defined(slug.current) && publishedAt <= now()]
      | order(publishedAt desc)[0...3]{_id, title, "slug": slug.current, excerpt},
    learningOutcomes[]{_key, icon, title, description},
    modules[]{
      _key,
      title,
      summary,
      "durationSeconds": math::sum(lessons[]->duration),
      lessons[]->{
        _id,
        title,
        "slug": slug.current,
        duration,
        freePreview
      }
    }
  }
`);

/** Slugs for generateStaticParams. */
export const LESSON_SLUGS_QUERY = defineQuery(`
  *[_type == "lesson" && defined(slug.current)]{"slug": slug.current}
`);

/**
 * Lesson detail. A lesson does not store its parent course, so the course is derived with a
 * reverse reference, and the full curriculum comes back so the page can compute the
 * "Lesson 5.1" label and render the sidebar.
 */
export const LESSON_BY_SLUG_QUERY = defineQuery(`
  *[_type == "lesson" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    videoUrl,
    thumbnail,
    duration,
    freePreview,
    notes,
    keyPoints,
    proTip,
    resources[]{_key, type, title, description, url},
    "creator": *[_type == "video" && url == ^.videoUrl][0]{channel, channelId, channelAvatar},
    "quiz": *[_type == "quiz" && lesson._ref == ^._id][0]{
      questions[]{_key, prompt, options[]{_key, text, isCorrect, feedback}}
    },
    "course": *[_type == "course" && references(^._id)][0]{
      _id,
      title,
      "slug": slug.current,
      level,
      coverImage,
      modules[]{
        _key,
        title,
        "durationSeconds": math::sum(lessons[]->duration),
        lessons[]->{
          _id,
          title,
          "slug": slug.current,
          duration,
          freePreview
        }
      }
    }
  }
`);

/**
 * Grounding read for search. The LLM only names lesson `_id`s (AGENTS.md §7, §11) — every field a
 * result card shows is read back from the dataset here, so nothing the model wrote reaches the UI.
 *
 * The parent course comes from a reverse reference, and its modules come back whole so the caller
 * can derive the module title and the positional "5.1" label from array order.
 */
export const LESSONS_BY_IDS_QUERY = defineQuery(`
  *[_type == "lesson" && _id in $ids]{
    _id,
    _createdAt,
    title,
    "slug": slug.current,
    duration,
    freePreview,
    keyPoints,
    "thumbnailRef": thumbnail.asset._ref,
    "course": *[_type == "course" && references(^._id)][0]{
      title,
      "slug": slug.current,
      "iconRef": coverImage.asset._ref,
      modules[]{
        _key,
        title,
        "lessonIds": lessons[]._ref
      }
    }
  }
`);

/** My Learning: every course with its lessons in order, so progress can pick the resume point. */
export const MY_LEARNING_COURSES_QUERY = defineQuery(`
  *[_type == "course" && defined(slug.current)] | order(title asc) {
    ${COURSE_CARD_FIELDS},
    "lessons": modules[].lessons[]->{_id, title, "slug": slug.current, duration}
  }
`);

/** Catalog filters. */
export const CATEGORIES_LIST_QUERY = defineQuery(`
  *[_type == "category" && defined(slug.current)] | order(title asc) {
    _id,
    title,
    "slug": slug.current,
    description,
    "courseCount": count(*[_type == "course" && category._ref == ^._id])
  }
`);

/**
 * Live learner counts. Progress records carry each learner's enrollments and lessons; the catalog
 * maps lessons to courses. Counted on the server, so no progress record or user id leaves it.
 */
export const LEARNER_COUNTS_QUERY = defineQuery(`{
  "progress": *[_type == "progress"]{
    "courses": enrollments[].course._ref,
    "lessons": lessons[].lesson._ref
  },
  "courses": *[_type == "course"]{_id, "lessonIds": modules[].lessons[]._ref}
}`);

const POST_CARD_FIELDS = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  "topic": topic->{title, "slug": slug.current},
  authorName,
  "wordCount": count(string::split(pt::text(body), " "))
`;

/** Field notes index. Only notes whose publish date has passed. */
export const POSTS_LIST_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current) && publishedAt <= now()]
  | order(publishedAt desc) {
    ${POST_CARD_FIELDS}
  }
`);

/** Slugs for generateStaticParams. */
export const POST_SLUGS_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current) && publishedAt <= now()]{"slug": slug.current}
`);

/** One field note, its related notes (same topic) and the course it points to. */
export const POST_BY_SLUG_QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug && publishedAt <= now()][0]{
    ${POST_CARD_FIELDS},
    body,
    "related": *[
      _type == "post" && defined(slug.current) && publishedAt <= now()
      && topic._ref == ^.topic._ref && _id != ^._id
    ] | order(publishedAt desc)[0...3]{
      _id,
      title,
      "slug": slug.current,
      "topic": topic->{title}
    },
    "relatedCourse": relatedCourse->{
      title,
      "slug": slug.current,
      summary,
      "category": category->{title}
    }
  }
`);

/**
 * The ideas board. Approved ideas for everyone, plus the viewer's own ideas still in review.
 * `$userId` is "" when signed out. Neither author nor voter ids are projected: the server computes
 * `hasVoted` here, so no Clerk id ever reaches the browser.
 */
export const IDEAS_BOARD_QUERY = defineQuery(`
  *[
    _type == "idea" && status != "declined"
    && (moderation == "approved" || ($userId != "" && moderation == "pending" && authorId == $userId))
  ]{
    _id,
    title,
    description,
    kind,
    status,
    origin,
    moderation,
    authorName,
    createdAt,
    "votes": count(*[_type == "ideaVote" && idea._ref == ^._id]),
    "hasVoted": $userId != "" && count(*[_type == "ideaVote" && idea._ref == ^._id && voterId == $userId]) > 0
  }
`);

/**
 * The roadmap: every category that has courses, each with its courses and their modules in order.
 * Lesson counts are derived; module numbers come from array order, as everywhere else.
 */
export const ROADMAP_QUERY = defineQuery(`
  *[_type == "category" && defined(slug.current) && count(*[_type == "course" && references(^._id)]) > 0]
  | order(title asc) {
    _id,
    title,
    "slug": slug.current,
    description,
    "courses": *[_type == "course" && category._ref == ^._id && defined(slug.current)] | order(title asc) {
      _id,
      title,
      "slug": slug.current,
      accent,
      level,
      "lessonCount": count(modules[].lessons[]),
      "modules": modules[]{
        _key,
        title,
        "lessonCount": count(lessons),
        "firstLessonSlug": lessons[0]->slug.current
      }
    }
  }
`);
