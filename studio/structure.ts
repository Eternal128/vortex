import {ActivityIcon} from '@sanity/icons/Activity'
import {BookIcon} from '@sanity/icons/Book'
import {ClockIcon} from '@sanity/icons/Clock'
import {DocumentVideoIcon} from '@sanity/icons/DocumentVideo'
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {PlayIcon} from '@sanity/icons/Play'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {TagIcon} from '@sanity/icons/Tag'
import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('course').title('Courses').icon(BookIcon),
      S.documentTypeListItem('lesson').title('Lessons').icon(PlayIcon),
      S.divider(),
      S.documentTypeListItem('category').title('Categories').icon(TagIcon),
      S.divider(),
      // Internal lookup data, built by scripts/ingest and read-only here.
      S.documentTypeListItem('video').title('Video intelligence').icon(DocumentVideoIcon),
      S.documentTypeListItem('quiz').title('Quizzes').icon(HelpCircleIcon),
      S.documentTypeListItem('progress').title('Learner progress').icon(ActivityIcon),
      S.documentTypeListItem('plan').title('Learner plans').icon(SparklesIcon),
      S.documentTypeListItem('planQuota').title('Plan quota').icon(ClockIcon),
    ])
