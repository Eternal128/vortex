import {ActivityIcon} from '@sanity/icons/Activity'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * One learner's progress, keyed by their Clerk user id (`progress.<userId>` — the dot keeps it out
 * of public reads). App state, not content: written only by the web app's `/api/progress` route
 * with a server-side token (AGENTS.md §7), never authored here, and outside the search filter.
 */
export const progress = defineType({
  name: 'progress',
  title: 'Learner progress',
  type: 'document',
  icon: ActivityIcon,
  readOnly: true,
  fields: [
    defineField({name: 'userId', title: 'Clerk user id', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'lessons',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'lessonProgress',
          type: 'object',
          fields: [
            defineField({name: 'lesson', type: 'reference', to: [{type: 'lesson'}], weak: true}),
            defineField({name: 'positionSeconds', title: 'Resume position (s)', type: 'number'}),
            defineField({name: 'completedAt', type: 'datetime'}),
            defineField({name: 'quizScore', type: 'number'}),
            defineField({name: 'quizTotal', type: 'number'}),
            defineField({name: 'quizAttempts', title: 'Quiz attempts', type: 'number'}),
            defineField({name: 'updatedAt', type: 'datetime'}),
          ],
        }),
      ],
    }),
    defineField({name: 'lastLesson', title: 'Last lesson', type: 'reference', to: [{type: 'lesson'}], weak: true}),
    defineField({
      name: 'enrollments',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'enrollment',
          type: 'object',
          fields: [
            defineField({name: 'course', type: 'reference', to: [{type: 'course'}], weak: true}),
            defineField({name: 'enrolledAt', type: 'datetime'}),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {userId: 'userId', lessons: 'lessons'},
    prepare: ({userId, lessons}) => ({title: userId, subtitle: `${lessons?.length ?? 0} lessons touched`}),
  },
})
