import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {defineField, defineType} from 'sanity'

/**
 * A field note: a short, team-authored article. Read-only on the site, like every other piece of
 * content; the search agent does not see it (the Context filter is a type whitelist).
 */
export const post = defineType({
  name: 'post',
  title: 'Field note',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required().max(110),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'excerpt',
      description: 'One or two sentences. Shown under the title and on cards.',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(220),
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'author',
      type: 'reference',
      to: [{type: 'instructor'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'topic',
      description: 'Groups the note with its related notes and powers the topic filter.',
      type: 'reference',
      to: [{type: 'category'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'relatedCourse',
      description: 'Optional. Shown as "Continue learning" at the end of the note.',
      type: 'reference',
      to: [{type: 'course'}],
    }),
    defineField({
      name: 'body',
      description: 'Use Heading 2 for sections: they build the "On this page" outline.',
      type: 'blockContent',
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {title: 'title', topic: 'topic.title', author: 'author.name'},
    prepare({title, topic, author}) {
      return {title, subtitle: [topic, author].filter(Boolean).join(' · ')}
    },
  },
})
