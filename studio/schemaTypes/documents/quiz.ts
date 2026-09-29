import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * The end-of-lesson quiz: one document per lesson, generated from the lesson's transcript and notes
 * by `scripts/quiz` and imported from the committed cache. Each question has exactly one correct
 * option, and every option explains why it is right or wrong.
 *
 * Kept out of the search agent's content filter — it is learner-facing practice, not a result.
 */
export const quiz = defineType({
  name: 'quiz',
  title: 'Quiz',
  type: 'document',
  icon: HelpCircleIcon,
  fields: [
    defineField({
      name: 'lesson',
      type: 'reference',
      to: [{type: 'lesson'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'questions',
      type: 'array',
      validation: (rule) => rule.required().min(1).max(10),
      of: [
        defineArrayMember({
          name: 'question',
          type: 'object',
          fields: [
            defineField({name: 'prompt', type: 'text', rows: 2, validation: (rule) => rule.required()}),
            defineField({
              name: 'options',
              type: 'array',
              validation: (rule) =>
                rule
                  .required()
                  .min(2)
                  .max(5)
                  .custom((options?: {isCorrect?: boolean}[]) => {
                    const correct = options?.filter((option) => option.isCorrect).length ?? 0
                    return correct === 1 || 'Exactly one option must be correct'
                  }),
              of: [
                defineArrayMember({
                  name: 'option',
                  type: 'object',
                  fields: [
                    defineField({name: 'text', type: 'string', validation: (rule) => rule.required()}),
                    defineField({name: 'isCorrect', title: 'Correct answer', type: 'boolean', initialValue: false}),
                    defineField({
                      name: 'feedback',
                      description: 'Shown after answering: why this option is right or wrong.',
                      type: 'text',
                      rows: 2,
                      validation: (rule) => rule.required(),
                    }),
                  ],
                  preview: {
                    select: {title: 'text', isCorrect: 'isCorrect'},
                    prepare: ({title, isCorrect}) => ({title: `${isCorrect ? '✓ ' : ''}${title}`}),
                  },
                }),
              ],
            }),
          ],
          preview: {select: {title: 'prompt'}},
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'lesson.title', questions: 'questions'},
    prepare: ({title, questions}) => ({
      title: title ?? 'Quiz',
      subtitle: `${questions?.length ?? 0} questions`,
    }),
  },
})
