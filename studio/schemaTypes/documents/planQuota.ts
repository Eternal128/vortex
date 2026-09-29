import {ClockIcon} from '@sanity/icons/Clock'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * One learner's plan-build reservations (`planQuota.<userId>`; the dot keeps it private). The web
 * app's `/api/plans` route reserves a slot here before any model or YouTube call, so the daily limit
 * bounds real work. App state, written only by the server, never authored here.
 */
export const planQuota = defineType({
  name: 'planQuota',
  title: 'Plan quota',
  type: 'document',
  icon: ClockIcon,
  readOnly: true,
  fields: [
    defineField({name: 'userId', title: 'Clerk user id', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'admitted',
      description: 'When each admitted plan build started, pruned to the last 24 hours.',
      type: 'array',
      of: [defineArrayMember({type: 'datetime'})],
    }),
  ],
  preview: {
    select: {userId: 'userId', admitted: 'admitted'},
    prepare: ({userId, admitted}) => ({title: userId, subtitle: `${admitted?.length ?? 0} builds in the window`}),
  },
})
