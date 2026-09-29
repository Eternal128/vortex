import {type SchemaTypeDefinition} from 'sanity'

import {category} from './documents/category'
import {course} from './documents/course'
import {idea} from './documents/idea'
import {ideaVote} from './documents/ideaVote'
import {lesson} from './documents/lesson'
import {plan} from './documents/plan'
import {post} from './documents/post'
import {planQuota} from './documents/planQuota'
import {progress} from './documents/progress'
import {quiz} from './documents/quiz'
import {video} from './documents/video'
import {blockContent} from './objects/blockContent'
import {learningOutcome} from './objects/learningOutcome'
import {courseModule} from './objects/module'
import {resource} from './objects/resource'
import {videoChapter} from './objects/videoChapter'
import {videoChunk} from './objects/videoChunk'

export const schema: {types: SchemaTypeDefinition[]} = {
  types: [
    // Documents
    course,
    lesson,
    category,
    video,
    quiz,
    progress,
    plan,
    planQuota,
    post,
    idea,
    ideaVote,
    // Objects
    courseModule,
    learningOutcome,
    resource,
    blockContent,
    videoChapter,
    videoChunk,
  ],
}
