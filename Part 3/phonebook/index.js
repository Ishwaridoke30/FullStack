import express from 'express'
import morgan from 'morgan'
import dotenv from 'dotenv'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'

dotenv.config()

const app = express()

app.use(express.json())
app.use(cors())
app.use(morgan('tiny'))

const PORT = process.env.PORT || 3001
const url = process.env.MONGODB_URI

const client = new MongoClient(url)

let personsCollection

// Validation: name
const validateName = name => {
  if (!name || name.length < 3) {
    return 'name must be at least 3 characters long'
  }

  return null
}

// Validation: phone number
const validatePhoneNumber = number => {
  if (!number || number.length < 8) {
    return 'phone number must be at least 8 characters long'
  }

  const parts = number.split('-')

  if (
    parts.length !== 2 ||
    !/^\d{2,3}$/.test(parts[0]) ||
    !/^\d+$/.test(parts[1])
  ) {
    return 'phone number must be in the correct format'
  }

  return null
}

// Start server
async function startServer() {
  try {
    await client.connect()

    const db = client.db('phonebook')
    personsCollection = db.collection('persons')

    console.log('Connected to MongoDB')

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('MongoDB connection error:', error)
  }
}

// GET all persons
app.get('/api/persons', async (request, response, next) => {
  try {
    const persons = await personsCollection.find({}).toArray()

    response.json(persons)
  } catch (error) {
    next(error)
  }
})

// GET one person
app.get('/api/persons/:id', async (request, response, next) => {
  try {
    const id = request.params.id

    if (!ObjectId.isValid(id)) {
      return response.status(400).json({
        error: 'Invalid id'
      })
    }

    const person = await personsCollection.findOne({
      _id: new ObjectId(id)
    })

    if (!person) {
      return response.status(404).end()
    }

    response.json(person)
  } catch (error) {
    next(error)
  }
})

// POST new person
app.post('/api/persons', async (request, response, next) => {
  try {
    const { name, number } = request.body

    // Validate name
    const nameError = validateName(name)

    if (nameError) {
      return response.status(400).json({
        error: nameError
      })
    }

    // Validate phone number
    const phoneError = validatePhoneNumber(number)

    if (phoneError) {
      return response.status(400).json({
        error: phoneError
      })
    }

    // Check duplicate name
    const existingPerson = await personsCollection.findOne({ name })

    if (existingPerson) {
      return response.status(400).json({
        error: 'name must be unique'
      })
    }

    const newPerson = {
      name,
      number
    }

    const result = await personsCollection.insertOne(newPerson)

    response.status(201).json({
      ...newPerson,
      _id: result.insertedId
    })
  } catch (error) {
    next(error)
  }
})

// DELETE person
app.delete('/api/persons/:id', async (request, response, next) => {
  try {
    const id = request.params.id

    if (!ObjectId.isValid(id)) {
      return response.status(400).json({
        error: 'Invalid id'
      })
    }

    const result = await personsCollection.deleteOne({
      _id: new ObjectId(id)
    })

    if (result.deletedCount === 0) {
      return response.status(404).end()
    }

    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

// PUT update person
app.put('/api/persons/:id', async (request, response, next) => {
  try {
    const id = request.params.id
    const { name, number } = request.body

    if (!ObjectId.isValid(id)) {
      return response.status(400).json({
        error: 'Invalid id'
      })
    }

    const nameError = validateName(name)

    if (nameError) {
      return response.status(400).json({
        error: nameError
      })
    }

    const phoneError = validatePhoneNumber(number)

    if (phoneError) {
      return response.status(400).json({
        error: phoneError
      })
    }

    const updatedPerson = {
      name,
      number
    }

    const result = await personsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedPerson },
      { returnDocument: 'after' }
    )

    if (!result) {
      return response.status(404).end()
    }

    response.json(result)
  } catch (error) {
    next(error)
  }
})

// INFO
app.get('/info', async (request, response, next) => {
  try {
    const count = await personsCollection.countDocuments()

    response.send(`
      <p>Phonebook has info for ${count} people</p>
      <p>${new Date()}</p>
    `)
  } catch (error) {
    next(error)
  }
})

// Error handler
const errorHandler = (error, request, response, next) => {
  console.error(error.message)
  next(error)
}

app.use(errorHandler)

// Start
startServer()