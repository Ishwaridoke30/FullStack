const { test, describe } = require('node:test')
const assert = require('node:assert')

const listHelper = require('../utils/list_helper')

const blogs = [
  {
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7
  },
  {
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'https://www.cs.utexas.edu/users/EWD/transcriptions/EWD02xx/EWD215.html',
    likes: 5
  },
  {
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'https://www.cs.utexas.edu/users/EWD/transcriptions/EWD04xx/EWD408.html',
    likes: 12
  },
  {
    title: 'The Once and Future King',
    author: 'Robert Martin',
    url: 'https://blog.cleancoder.com/',
    likes: 10
  },
  {
    title: 'Type wars',
    author: 'Robert Martin',
    url: 'https://blog.cleancoder.com/',
    likes: 2
  }
]

describe('dummy', () => {
  test('dummy returns one', () => {
    const result = listHelper.dummy(blogs)

    assert.strictEqual(result, 1)
  })
})

describe('total likes', () => {
  test('total likes are calculated correctly', () => {
    const result = listHelper.totalLikes(blogs)

    assert.strictEqual(result, 36)
  })
})

describe('favorite blog', () => {
  test('returns the blog with the most likes', () => {
    const result = listHelper.favoriteBlog(blogs)

    assert.deepStrictEqual(result, {
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      url: 'https://www.cs.utexas.edu/users/EWD/transcriptions/EWD04xx/EWD408.html',
      likes: 12
    })
  })
})

describe('most blogs', () => {
  test('returns the author with the most blogs', () => {
    const result = listHelper.mostBlogs(blogs)

    assert.deepStrictEqual(result, {
      author: 'Edsger W. Dijkstra',
      blogs: 2
    })
  })
})

describe('most likes', () => {
  test('returns the author with the most total likes', () => {
    const result = listHelper.mostLikes(blogs)

    assert.deepStrictEqual(result, {
      author: 'Edsger W. Dijkstra',
      likes: 17
    })
  })
})