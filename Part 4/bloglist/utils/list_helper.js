const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
  return blogs.reduce((favorite, blog) => {
    return blog.likes > favorite.likes ? blog : favorite
  })
}

const mostBlogs = (blogs) => {
  const counts = {}

  blogs.forEach(blog => {
    counts[blog.author] = (counts[blog.author] || 0) + 1
  })

  let result = {
    author: '',
    blogs: 0
  }

  Object.entries(counts).forEach(([author, count]) => {
    if (count > result.blogs) {
      result = {
        author: author,
        blogs: count
      }
    }
  })

  return result
}

const mostLikes = (blogs) => {
  const likesByAuthor = {}

  blogs.forEach(blog => {
    likesByAuthor[blog.author] =
      (likesByAuthor[blog.author] || 0) + blog.likes
  })

  let result = {
    author: '',
    likes: 0
  }

  Object.entries(likesByAuthor).forEach(([author, likes]) => {
    if (likes > result.likes) {
      result = {
        author: author,
        likes: likes
      }
    }
  })

  return result
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}