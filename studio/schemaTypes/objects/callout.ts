import {BulbOutlineIcon} from '@sanity/icons/BulbOutline'
import {defineField, defineType} from 'sanity'

/** A short boxed aside in a field note: the takeaway, or how Vortex applies an idea. */
export const callout = defineType({
  name: 'callout',
  title: 'Callout',
  type: 'object',
  icon: BulbOutlineIcon,
  fields: [
    defineField({
      name: 'tone',
      type: 'string',
      options: {
        list: [
          {title: 'Takeaway', value: 'takeaway'},
          {title: 'In Vortex', value: 'vortex'},
          {title: 'Caveat', value: 'caveat'},
        ],
        layout: 'radio',
      },
      initialValue: 'takeaway',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'text',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(500),
    }),
  ],
  preview: {
    select: {title: 'text', subtitle: 'tone'},
  },
})
