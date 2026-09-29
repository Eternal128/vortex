import {BulbOutlineIcon} from '@sanity/icons/BulbOutline'
import {defineField, defineType} from 'sanity'

/**
 * A feature idea on the community board.
 *
 * Community ideas are written only by the web app's server route (`POST /api/ideas`), which sets
 * every field except title, description and kind itself. They arrive `pending` and stay invisible
 * to other learners until someone on the team approves them here. Team ideas are authored here.
 */
export const idea = defineType({
  name: 'idea',
  title: 'Idea',
  type: 'document',
  icon: BulbOutlineIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required().min(8).max(90),
    }),
    defineField({
      name: 'description',
      description: 'Plain text. Rendered as text on the site, never as HTML or markdown.',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required().min(20).max(600),
    }),
    defineField({
      name: 'kind',
      type: 'string',
      options: {
        list: [
          {title: 'Feature', value: 'feature'},
          {title: 'Content', value: 'content'},
          {title: 'Improvement', value: 'improvement'},
        ],
        layout: 'radio',
      },
      initialValue: 'feature',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      type: 'string',
      options: {
        list: [
          {title: 'Open', value: 'open'},
          {title: 'Planned', value: 'planned'},
          {title: 'Shipped', value: 'shipped'},
          {title: 'Declined', value: 'declined'},
        ],
        layout: 'radio',
      },
      initialValue: 'open',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'moderation',
      description: 'Only approved ideas are shown to other learners and can be voted on.',
      type: 'string',
      options: {
        list: [
          {title: 'Pending review', value: 'pending'},
          {title: 'Approved', value: 'approved'},
          {title: 'Rejected', value: 'rejected'},
        ],
        layout: 'radio',
      },
      initialValue: 'approved',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'origin',
      type: 'string',
      options: {
        list: [
          {title: 'Team', value: 'team'},
          {title: 'Community', value: 'community'},
        ],
        layout: 'radio',
      },
      initialValue: 'team',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'authorName',
      description: 'Display name only (first name and last initial). Never an email.',
      type: 'string',
      initialValue: 'Vortex team',
    }),
    defineField({
      name: 'authorId',
      description: 'Clerk user id of a community author. Set by the server; never shown on the site.',
      type: 'string',
      readOnly: true,
      hidden: ({value}) => !value,
    }),
    defineField({
      name: 'createdAt',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    {title: 'Newest first', name: 'createdAtDesc', by: [{field: 'createdAt', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'title', status: 'status', moderation: 'moderation', origin: 'origin'},
    prepare({title, status, moderation, origin}) {
      return {title, subtitle: [origin, status, moderation].filter(Boolean).join(' · ')}
    },
  },
})
