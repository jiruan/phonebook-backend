const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(express.static('build'));
app.use(cors());

morgan.token('body', (request) => (
  request.body ? JSON.stringify(request.body) : ''
));

app.use(morgan(':method :url :status :res[Content-Length] - :response-time ms :body'));

const phonebook = {
  persons: [
    {
      name: 'Arto Hellas',
      number: '040-123456',
      id: 1,
    },
    {
      name: 'Ada Lovelace',
      number: '39-44-5323523',
      id: 2,
    },
    {
      name: 'Dan Abramov',
      number: '12-43-234345',
      id: 3,
    },
    {
      name: 'Mary Poppendieck',
      number: '39-23-6423122',
      id: 4,
    },
  ],
};

function genID() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

app.get('/api/persons', (request, response) => {
  let { persons } = phonebook;


  if (request.query && request.query.name) {
    persons = persons.filter((one) => {
      const oneName = one.name.toLowerCase().replace('/s/g', '');
      const queryName = request.query.name.toLowerCase().replace('/s/g', '');

      return oneName === queryName;
    });
  }

  response.send(persons);
});

app.get('/info', (request, response) => {
  const date = new Date();

  response.send(`
    <p>Phonebook has info for ${phonebook.persons.length} people</p>
    <p>${date}</p>
  `);
});

app.get('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id);

  const match = phonebook.persons.find((one) => (id === one.id));

  if (match) {
    response.json(match);
  } else {
    response.status(404).end();
  }
});

app.delete('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id);
  phonebook.persons = phonebook.persons.filter((one) => (one.id !== id));

  response.status(204).end();
});

app.put('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id);
  const match = phonebook.persons.find((one) => (id === one.id));

  if (!match) {
    return response.json([]);
  }

  phonebook.persons = phonebook.persons.filter((one) => (one.id !== id));

  if (request.body) {
    if (request.body.name) {
      match.name = request.body.name;
    }

    if (request.body.number) {
      match.number = request.body.number;
    }
  }

  phonebook.persons = phonebook.persons.concat(match);

  return response.json(match);
});

app.post('/api/persons', (request, response) => {
  if (!request.body || !request.body.name || !request.body.number) {
    let errorMsg;

    if (!request.body) {
      errorMsg = 'no content specified';
    } else if (!request.body.name) {
      errorMsg = 'name must be specified';
    } else if (!request.body.number) {
      errorMsg = 'number must be specified';
    }

    return response.status(400).json({
      error: errorMsg,
    });
  }

  const match = phonebook.persons.find((one) => (
    request.body.name === one.name
  ));

  if (typeof (match) !== 'undefined') {
    return response.status(400).json({
      error: 'name must be unique',
    });
  }

  const newPerson = {
    name: request.body.name,
    number: request.body.number || '',
    id: genID(),
  };

  phonebook.persons.push(newPerson);

  return response.json(newPerson);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});
