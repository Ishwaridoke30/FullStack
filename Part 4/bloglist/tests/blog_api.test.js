require('dotenv').config()

const { test, before, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')

const app = require('../app')
const User = require('../models/user')

const api = supertest(app)

let token

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI)

  // Test user create/update
  await User.deleteMany({ username: 'testuser' })

  const passwordHash = await bcrypt.hash('testpassword', 10)

  const user = new User({
    username: 'testuser',
    name: 'Test User',
    passwordHash
  })

  await user.save()

  // Login and get JWT token
  const loginResponse = await api
    .post('/api/login')
    .send({
      username: 'testuser',
      password: 'testpassword'
    })
    .expect(200)

  token = loginResponse.body.token

  assert.ok(token)
})

// Exercise 4.8

test('blogs are returned as json', async () => {
  const response = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)

  assert.ok(response.body)
  assert.ok(Array.isArray(response.body))
  assert.ok(response.body.length >= 2)
})

// Exercise 4.9

test('unique identifier property is id', async () => {
  const response = await api
    .get('/api/blogs')
    .expect(200)

  assert.ok(response.body.length > 0)

  response.body.forEach(blog => {
    assert.ok(blog.id)
    assert.strictEqual(blog._id, undefined)
  })
})

// Exercise 4.10

test('a valid blog can be added', async () => {
  const newBlog = {
    title: 'Testing blog',
    author: 'Ishwari',
    url: 'http://example.com/testing',
    likes: 15
  }

  const before = await api.get('/api/blogs')

  const response = await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(201)

  const after = await api.get('/api/blogs')

  assert.strictEqual(after.body.length, before.body.length + 1)
  assert.strictEqual(response.body.title, newBlog.title)
  assert.strictEqual(response.body.author, newBlog.author)
  assert.strictEqual(response.body.url, newBlog.url)
  assert.strictEqual(response.body.likes, newBlog.likes)
})

// Exercise 4.11

test('likes defaults to 0 if missing', async () => {
  const newBlog = {
    title: 'Blog without likes',
    author: 'Ishwari',
    url: 'http://example.com/no-likes'
  }

  const response = await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(201)

  assert.strictEqual(response.body.likes, 0)
})

// Exercise 4.12

test('blog without title is not added', async () => {
  const newBlog = {
    author: 'Ishwari',
    url: 'http://example.com/no-title',
    likes: 10
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(400)
})

// Exercise 4.12

test('blog without url is not added', async () => {
  const newBlog = {
    title: 'Blog without URL',
    author: 'Ishwari',
    likes: 10
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(400)
})

// Exercise 4.13

test('a blog can be deleted', async () => {
  const newBlog = {
    title: 'Blog to be deleted',
    author: 'Ishwari',
    url: 'http://example.com/delete',
    likes: 5
  }

  const createdBlog = await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(201)

  const blogId = createdBlog.body.id

  await api
    .delete('/api/blogs/' + blogId)
    .set('Authorization', `Bearer ${token}`)
    .expect(204)

  const response = await api.get('/api/blogs')

  const deletedBlog = response.body.find(
    blog => blog.id === blogId
  )

  assert.strictEqual(deletedBlog, undefined)
})

// Exercise 4.14

test('a blog can be updated', async () => {
  const newBlog = {
    title: 'Blog before update',
    author: 'Ishwari',
    url: 'http://example.com/update',
    likes: 5
  }

  const createdBlog = await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(201)

  const updatedBlog = {
    title: 'Blog after update',
    author: 'Ishwari',
    url: 'http://example.com/update',
    likes: 20
  }

  const response = await api
    .put('/api/blogs/' + createdBlog.body.id)
    .send(updatedBlog)
    .expect(200)

  assert.strictEqual(response.body.title, 'Blog after update')
  assert.strictEqual(response.body.author, 'Ishwari')
  assert.strictEqual(response.body.url, 'http://example.com/update')
  assert.strictEqual(response.body.likes, 20)
})

// Exercise 4.23
// Blog cannot be added without token

test('a blog cannot be added without a token', async () => {
  const newBlog = {
    title: 'Blog without token',
    author: 'Ishwari',
    url: 'http://example.com/no-token',
    likes: 5
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(401)
})

after(async () => {
  await mongoose.connection.close()
})