import {ChartUpwardIcon} from '@sanity/icons/ChartUpward'
import {defineField, defineType} from 'sanity'

/**
 * The diagrams the web app can draw. A diagram is code (a themed SVG component in
 * `components/blog/diagrams/`), picked here by name, so no SVG or HTML is ever stored in the
 * dataset or injected into the page. Adding one means adding it here and in the web registry.
 */
export const DIAGRAMS = [
  {title: 'Vortex: before and after', value: 'vortex-before-after'},
  {title: 'System architecture', value: 'system-architecture'},
  {title: 'Search pipeline', value: 'search-pipeline'},
  {title: 'Video ingestion pipeline', value: 'ingestion-pipeline'},
  {title: 'Trust boundaries', value: 'trust-boundaries'},
  {title: 'Write-path guards', value: 'write-path-guards'},
  {title: 'Creator flow', value: 'creator-flow'},
  {title: 'Chart: spacing, optimal gap', value: 'spacing-ridgeline'},
  {title: 'Chart: forgetting and review (illustrative)', value: 'forgetting-reviews'},
  {title: 'Chart: testing effect', value: 'testing-effect'},
  {title: 'Chart: engagement by video length', value: 'engagement-by-length'},
  {title: 'Interpolated quizzes timeline', value: 'interpolated-quizzes'},
  {title: 'Chart: feeling vs learning', value: 'feeling-vs-learning'},
  {title: 'Blocked vs interleaved practice', value: 'blocked-vs-interleaved'},
  {title: 'Pretest and feedback loop', value: 'pretest-loop'},
]

export const diagram = defineType({
  name: 'diagram',
  title: 'Diagram',
  type: 'object',
  icon: ChartUpwardIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      options: {list: DIAGRAMS},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'caption',
      description: 'One sentence under the figure. Name the source for charts of published data.',
      type: 'string',
      validation: (rule) => rule.max(240),
    }),
  ],
  preview: {
    select: {name: 'name', caption: 'caption'},
    prepare({name, caption}) {
      return {title: DIAGRAMS.find((d) => d.value === name)?.title ?? name, subtitle: caption}
    },
  },
})
