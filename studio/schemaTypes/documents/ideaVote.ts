import {ArrowUpIcon} from '@sanity/icons/ArrowUp'
import {defineField, defineType} from 'sanity'

/**
 * One learner's upvote on one idea. Written only by `POST /api/ideas/[id]/vote`, with a document id
 * derived from the idea and a hash of the voter, so a learner can hold at most one vote per idea.
 * Hidden from the Studio's desk: it is app state, not content.
 */
export const ideaVote = defineType({
  name: 'ideaVote',
  title: 'Idea vote',
  type: 'document',
  icon: ArrowUpIcon,
  readOnly: true,
  fields: [
    defineField({
      name: 'idea',
      type: 'reference',
      to: [{type: 'idea'}],
      weak: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'voterId',
      description: 'Clerk user id. Never shown on the site.',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
})
