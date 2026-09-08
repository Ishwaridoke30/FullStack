require('dotenv').config()

const app = require('./app')
const mongoose = require('mongoose')

const PORT = process.env.PORT || 3003

const mongoUrl = process.env.MONGODB_URI

mongoose
  .connect(mongoUrl)
  .then(() => {
    console.log('connected to MongoDB')

    app.listen(PORT, () => {
      console.log('Server running on port ' + PORT)
    })
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })