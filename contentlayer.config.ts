import { defineDocumentType, makeSource } from 'contentlayer/source-files'

export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: `blog/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: true },
    summary: { type: 'string', required: true },
    tags: { type: 'list', of: { type: 'string' } },
    image: { type: 'string' },
  },
  computedFields: {
    url: { type: 'string', resolve: (post) => `/${post._raw.flattenedPath}` },
    slug: { type: 'string', resolve: (post) => post._raw.flattenedPath.split('/').slice(1).join('/') },
  },
}))

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [Post],
})
