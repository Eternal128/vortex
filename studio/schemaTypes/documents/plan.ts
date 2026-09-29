import {SparklesIcon} from '@sanity/icons/Sparkles'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * A learner's own course, built on request by the web app's plan builder: an LLM designs the
 * syllabus and each lesson is matched to a YouTube video. App state, not authored content —
 * private (`plan.<userId>.<key>`), written only by `/api/plans`, and outside the search filter.
 */
export const plan = defineType({
  name: 'plan',
  title: 'Learner plan',
  type: 'document',
  icon: SparklesIcon,
  readOnly: true,
  fields: [
    defineField({name: 'userId', title: 'Clerk user id', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'goal', type: 'string'}),
    defineField({name: 'level', type: 'string'}),
    defineField({name: 'pace', type: 'string'}),
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'summary', type: 'text', rows: 3}),
    defineField({name: 'createdAt', type: 'datetime'}),
    defineField({
      name: 'modules',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'planModule',
          type: 'object',
          fields: [
            defineField({name: 'title', type: 'string'}),
            defineField({
              name: 'lessons',
              type: 'array',
              of: [
                defineArrayMember({
                  name: 'planLesson',
                  type: 'object',
                  fields: [
                    defineField({name: 'title', type: 'string'}),
                    defineField({name: 'objective', type: 'text', rows: 2}),
                    defineField({name: 'videoId', type: 'string'}),
                    defineField({name: 'videoUrl', type: 'url'}),
                    defineField({name: 'videoTitle', type: 'string'}),
                    defineField({name: 'channel', type: 'string'}),
                    defineField({name: 'durationSeconds', type: 'number'}),
                    defineField({name: 'thumbnailUrl', type: 'url'}),
                    defineField({name: 'completedAt', type: 'datetime'}),
                    defineField({name: 'quizScore', type: 'number'}),
                    defineField({name: 'quizTotal', type: 'number'}),
                    defineField({
                      name: 'quiz',
                      type: 'object',
                      fields: [
                        defineField({
                          name: 'questions',
                          type: 'array',
                          of: [
                            defineArrayMember({
                              name: 'planQuestion',
                              type: 'object',
                              fields: [
                                defineField({name: 'prompt', type: 'text', rows: 2}),
                                defineField({
                                  name: 'options',
                                  type: 'array',
                                  of: [
                                    defineArrayMember({
                                      name: 'planOption',
                                      type: 'object',
                                      fields: [
                                        defineField({name: 'text', type: 'string'}),
                                        defineField({name: 'isCorrect', type: 'boolean'}),
                                        defineField({name: 'feedback', type: 'text', rows: 2}),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'title', goal: 'goal', userId: 'userId'},
    prepare: ({title, goal, userId}) => ({title: title ?? goal ?? 'Plan', subtitle: userId}),
  },
})
