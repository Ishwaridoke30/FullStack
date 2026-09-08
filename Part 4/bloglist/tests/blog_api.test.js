require('dotenv').config()

const { test, before, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')

const api = supertest(app)

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI)
})

test('blogs are returned as json', async () => {
  const response = await api
    .get('/api/blogs')
    .expect(200)

  assert.ok(response.body)
})

test('there are blogs', async () => {
  const response = await api.get('/api/blogs')

  assert.ok(response.body.length >= 2)
})

test('a valid blog can be added', async () => {
  const newBlog = {
    title: 'Testing blog',
    author: 'Ishwari',
    url: 'http://example.com/testing',
    likes: 15
  }

  const response = await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)

  assert.strictEqual(response.body.title, 'Testing blog')
  assert.strictEqual(response.body.author, 'Ishwari')
  assert.strictEqual(response.body.likes, 15)
})

test('likes defaults to 0 if missing', async () => {
  const newBlog = {
    title: 'Blog without likes',
    author: 'Ishwari',
    url: 'http://example.com/no-likes'
  }

  const response = await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)

  assert.strictEqual(response.body.likes, 0)
})

test('blog without title is not added', async () => {
  const newBlog = {
    author: 'Ishwari',
    url: 'http://example.com/no-title',
    likes: 10
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)
})

test('blog without url is not added', async () => {
  const newBlog = {
    title: 'Blog without URL',
    author: 'Ishwari',
    likes: 10
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)
})

test('a blog can be deleted', async () => {
  const newBlog = {
    title: 'Blog to be deleted',
    author: 'Ishwari',
    url: 'http://example.com/delete',
    likes: 5
  }

  const createdBlog = await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)

  const blogId = createdBlog.body._id

  await api
    .delete('/api/blogs/' + blogId)
    .expect(204)

  const response = await api.get('/api/blogs')

  const deletedBlog = response.body.find(
    blog => blog._id === blogId
  )

  assert.strictEqual(deletedBlog, undefined)
})

test('a blog can be updated', async () => {
  const newBlog = {
    title: 'Blog before update',
    author: 'Ishwari',
    url: 'http://example.com/update',
    likes: 5
  }

  const createdBlog = await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)

  const updatedBlog = {
    title: 'Blog after update',
    author: 'Ishwari',
    url: 'http://example.com/update',
    likes: 20
  }

  const response = await api
    .put('/api/blogs/' + createdBlog.body._id)
    .send(updatedBlog)
    .expect(200)

  assert.strictEqual(response.body.title, 'Blog after update')
  assert.strictEqual(response.body.author, 'Ishwari')
  assert.strictEqual(response.body.likes, 20)
})

after(async () => {
  await mongoose.connection.close()
})