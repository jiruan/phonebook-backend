require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const PersonModel = require('./person');

const app = express();
app.use(express.json());
app.use(express.static('build'));
app.use(cors());

morgan.token('body', (request) => (
  request.body ? JSON.stringify(request.body) : ''
));

app.use(morgan(':method :url :status :res[Content-Length] - :response-time ms :body'));

app.get('/api/persons', (request, response, next) => {
  PersonModel.find({})
    .then((persons) => {
      let filtered = persons.map((one) => (one.toJSON()));

      if (request.query && request.query.name) {
        filtered = persons.filter((one) => (
          one.name.toLowerCase() === request.query.name.toLowerCase()
        ));
      }

      response.send(filtered);
    })
    .catch((error) => {
      next(error);
    });
});

app.get('/api/persons/:id', (request, response, next) => {
  PersonModel.findById(request.params.id)
    .then((match) => {
      if (match) {
        response.json(match.toJSON());
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => {
      next(error);
    });
});

app.delete('/api/persons/:id', (request, response, next) => {
  PersonModel.findByIdAndDelete(request.params.id)
    .then(() => {
      response.status(204).end();
    })
    .catch((error) => {
      next(error);
    });
});

app.put('/api/persons/:id', (request, response, next) => {
  const match = {};

  if (request.body) {
    if (request.body.name) {
      match.name = request.body.name;
    }

    if (request.body.number) {
      match.number = request.body.number;
    }
  }

  PersonModel.findByIdAndUpdate(request.params.id, match, { new: true, runValidators: true, context: 'query' })
    .then((newDoc) => {
      if (newDoc) {
        response.json(newDoc);
      } else {
        response.json({});
      }
    })
    .catch((error) => {
      next(error);
    });
});

app.post('/api/persons', (request, response, next) => {
  const newPerson = new PersonModel({
    name: request.body.name,
    number: request.body.number,
  });

  newPerson.save()
    .then((result) => {
      response.json(result.toJSON());
    })
    .catch((error) => {
      next(error);
    });
});

app.get('/info', (request, response, next) => {
  PersonModel.estimatedDocumentCount({})
    .then((result) => {
      const date = new Date();

      response.send(`
      <p>Phonebook has info for ${result} people</p>
      <p>${date}</p>
      `);
    })
    .catch((error) => {
      next(error);
    });
});

function getAllErrorHandler(error, request, response, next) {
  console.error(error.name, ': ', error.message);

  if (error.name === 'ValidationError') {
    return response.status(400).send({ error: error.message });
  }

  if (error.name === 'ValidationError') {
    return response.status(400).send({ error: error.message });
  }

  next(error);
}

app.use('/api/persons', getAllErrorHandler);

function IDGetErrorHandler(error, request, response, next) {
  console.error(error.name, ': ', error.message);

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted ID' });
  }

  next(error);
}

app.use('/api/persons/:id', IDGetErrorHandler);

// only when any other options fail
function defaultErrorHandler(error, request, response, next) {
  console.error(error.name, ': ', error.message);
  response.sendStatus(500).end();
  next(error);
}

app.use(defaultErrorHandler);

const { PORT } = process.env;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});
