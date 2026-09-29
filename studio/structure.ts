import {BookIcon} from '@sanity/icons/Book'
import {BulbOutlineIcon} from '@sanity/icons/BulbOutline'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {ClockIcon} from '@sanity/icons/Clock'
import {DocumentVideoIcon} from '@sanity/icons/DocumentVideo'
import {PlayIcon} from '@sanity/icons/Play'
import {TagIcon} from '@sanity/icons/Tag'
import {UserIcon} from '@sanity/icons/User'
import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('course').title('Courses').icon(BookIcon),
      S.documentTypeListItem('lesson').title('Lessons').icon(PlayIcon),
      S.divider(),
      S.documentTypeListItem('instructor').title('Instructors').icon(UserIcon),
      S.documentTypeListItem('category').title('Categories').icon(TagIcon),
      S.divider(),
      S.documentTypeListItem('post').title('Field notes').icon(DocumentTextIcon),
      S.listItem()
        .title('Community ideas')
        .icon(BulbOutlineIcon)
        .child(
          S.list()
            .title('Community ideas')
            .items([
              S.listItem()
                .title('Awaiting review')
                .icon(ClockIcon)
                .child(
                  S.documentList()
                    .title('Awaiting review')
                    .schemaType('idea')
                    .filter('_type == "idea" && moderation == "pending"')
                    .defaultOrdering([{field: 'createdAt', direction: 'asc'}]),
                ),
              S.documentTypeListItem('idea').title('All ideas').icon(BulbOutlineIcon),
            ]),
        ),
      S.divider(),
      // Internal lookup data, built by scripts/ingest and read-only here.
      S.documentTypeListItem('video').title('Video intelligence').icon(DocumentVideoIcon),
    ])
