// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { randomBytes } = require('crypto');
const cors = require('cors');

// Create express server
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Create an object to store the comments
const commentsByPostId = {};

// Create a route to handle the post request
app.post('/posts/:id/comments', async (req, res) => {
  // Generate a random id
  const commentId = randomBytes(4).toString('hex');
  // Get the content of the comment from the request body
  const { content } = req.body;
  // Get the id of the post from the request params
  const postId = req.params.id;
  // Get the comments for the post from the object
  const comments = commentsByPostId[postId] || [];
  // Add the new comment to the comments array
  comments.push({ id: commentId, content, status: 'pending' });
  // Update the comments object with the new comments array
  commentsByPostId[postId] = comments;
  // Make a post request to the event bus to emit the event
  await axios.post('http://event-bus-srv:4005/events', {
    type: 'CommentCreated',
    data: { id: commentId, content, postId, status: 'pending' },
  });
  // Send the comments array as a response
  res.status(201).send(comments);
});

// Create a route to handle the get request
app.get('/posts/:id/comments', (req, res) => {
  // Get the comments for the post from the object
  const comments = commentsByPostId[req.params.id] || [];
  // Send the comments array as a response
  res.send(comments);
});

// Create a route to handle the post request
app.post('/events', async (req, res) => {
  // Get the type and data from the request body
  const { type, data } = req.body;
  // Check if the type is CommentModerated
  if (type === 'CommentModerated') {
    // Get the id, postId, status and content from the data
    const { id, postId, status, content } = data;
    // Get the comments for the post from the object
    const comments = commentsByPostId[postId];
    // Find the comment with the id
    const comment = comments.find((comment) => {
      return comment.id === id;
    });
    // Update the status of the comment
    comment.status = status;
    // Make a post request to the event bus to emit the event
    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentUpdated',
      data: { id, postId, status, content },
    });
    }
    // Send a response
    res.send({});
}
);