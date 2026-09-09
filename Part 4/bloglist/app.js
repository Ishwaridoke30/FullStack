require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const User = require('./models/user')

const app = express()

app.use(express.json())

// ================= BLOG SCHEMA =================

const blogSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  author: String,
  url: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})

blogSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Blog = mongoose.model('Blog', blogSchema)


// ================= TOKEN EXTRACTOR =================

const tokenExtractor = (request, response, next) => {
  const authorization = request.get('authorization')

  if (
    authorization &&
    authorization.toLowerCase().startsWith('bearer ')
  ) {
    request.token = authorization.substring(7)
  }

  next()
}


// ================= USER EXTRACTOR =================

const userExtractor = async (request, response, next) => {
  try {
    const decodedToken = jwt.verify(
      request.token,
      process.env.SECRET
    )

    if (!decodedToken.id) {
      return response.status(401).json({
        error: 'token invalid'
      })
    }

    const user = await User.findById(decodedToken.id)

    if (!user) {
      return response.status(401).json({
        error: 'user not found'
      })
    }

    request.user = user

    next()

  } catch (error) {
    return response.status(401).json({
      error: 'token invalid'
    })
  }
}


// ================= GET ALL BLOGS =================

app.get('/api/blogs', async (request, response) => {
  try {
    const blogs = await Blog
      .find({})
      .populate('user', {
        username: 1,
        name: 1
      })

    response.json(blogs)

  } catch (error) {
    response.status(500).json({
      error: error.message
    })
  }
})


// ================= GET ONE BLOG =================

app.get('/api/blogs/:id', async (request, response) => {
  try {
    const blog = await Blog
      .findById(request.params.id)
      .populate('user', {
        username: 1,
        name: 1
      })

    if (!blog) {
      return response.status(404).end()
    }

    response.json(blog)

  } catch (error) {
    response.status(400).json({
      error: error.message
    })
  }
})


// ================= CREATE BLOG =================

app.post(
  '/api/blogs',
  tokenExtractor,
  userExtractor,
  async (request, response) => {

    const body = request.body

    if (!body.title || !body.url) {
      return response.status(400).json({
        error: 'title or url missing'
      })
    }

    try {

      const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes,
        user: request.user._id
      })

      const savedBlog = await blog.save()

      // Add blog ID to user's blogs array
      const updatedUser = await User.findByIdAndUpdate(
        request.user._id,
        {
          $push: {
            blogs: savedBlog._id
          }
        },
        {
          new: true
        }
      )

      console.log('BLOG CREATED:', savedBlog._id)
      console.log('BLOG USER:', savedBlog.user)
      console.log('USER ID:', request.user._id)
      console.log('UPDATED USER BLOGS:', updatedUser.blogs)

      response.status(201).json(savedBlog)

    } catch (error) {

      console.error('CREATE BLOG ERROR:', error)

      response.status(400).json({
        error: error.message
      })
    }
  }
)


// ================= DELETE BLOG =================

app.delete(
  '/api/blogs/:id',
  tokenExtractor,
  userExtractor,
  async (request, response) => {

    try {

      const blog = await Blog.findById(request.params.id)

      if (!blog) {
        return response.status(404).end()
      }

      // Only blog creator can delete
      if (
        !blog.user ||
        blog.user.toString() !== request.user._id.toString()
      ) {
        return response.status(401).json({
          error: 'only the creator can delete the blog'
        })
      }

      await Blog.findByIdAndDelete(request.params.id)

      // Remove blog ID from user's blogs array
      await User.findByIdAndUpdate(
        request.user._id,
        {
          $pull: {
            blogs: blog._id
          }
        }
      )

      response.status(204).end()

    } catch (error) {

      console.error('DELETE ERROR:', error)

      response.status(400).json({
        error: error.message
      })
    }
  }
)


// ================= UPDATE BLOG =================

app.put('/api/blogs/:id', async (request, response) => {

  try {

    const body = request.body

    const updatedBlog = await Blog.findByIdAndUpdate(
      request.params.id,
      {
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes
      },
      {
        new: true,
        runValidators: true
      }
    )

    if (!updatedBlog) {
      return response.status(404).end()
    }

    response.json(updatedBlog)

  } catch (error) {

    console.error('UPDATE ERROR:', error)

    response.status(400).json({
      error: error.message
    })
  }
})


// ================= GET USERS =================

app.get('/api/users', async (request, response) => {

  try {

    const users = await User
      .find({})
      .populate('blogs', {
        title: 1,
        author: 1,
        url: 1,
        likes: 1
      })

    response.json(users)

  } catch (error) {

    response.status(500).json({
      error: error.message
    })
  }
})


// ================= CREATE USER =================

app.post('/api/users', async (request, response) => {

  try {

    const {
      username,
      name,
      password
    } = request.body

    if (!username || !password) {
      return response.status(400).json({
        error: 'username and password are required'
      })
    }

    if (username.length < 3) {
      return response.status(400).json({
        error: 'username must be at least 3 characters long'
      })
    }

    if (password.length < 3) {
      return response.status(400).json({
        error: 'password must be at least 3 characters long'
      })
    }

    const saltRounds = 10

    const passwordHash = await bcrypt.hash(
      password,
      saltRounds
    )

    const user = new User({
      username,
      name,
      passwordHash
    })

    const savedUser = await user.save()

    response.status(201).json(savedUser)

  } catch (error) {

    console.error('CREATE USER ERROR:', error)

    response.status(400).json({
      error: error.message
    })
  }
})


// ================= LOGIN =================

app.post('/api/login', async (request, response) => {

  try {

    const {
      username,
      password
    } = request.body

    const user = await User.findOne({
      username
    })

    const passwordCorrect =
      user === null
        ? false
        : await bcrypt.compare(
            password,
            user.passwordHash
          )

    if (!user || !passwordCorrect) {
      return response.status(401).json({
        error: 'invalid username or password'
      })
    }

    const userForToken = {
      username: user.username,
      id: user._id
    }

    const token = jwt.sign(
      userForToken,
      process.env.SECRET,
      {
        expiresIn: '1h'
      }
    )

    response.status(200).json({
      token,
      username: user.username,
      name: user.name
    })

  } catch (error) {

    console.error('LOGIN ERROR:', error)

    response.status(500).json({
      error: error.message
    })
  }
})


// ================= EXPORT =================

module.exports = app