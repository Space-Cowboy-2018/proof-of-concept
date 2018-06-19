const express = require('@feathersjs/express');
const feathers = require('@feathersjs/feathers');
const socketio = require('@feathersjs/socketio');
const app = express(feathers());
const PORT = process.env.PORT || 8080;

// Parse HTTP JSON bodies
app.use(express.json());
// Parse URL-encoded params
app.use(express.urlencoded({ extended: true }));
// Add REST API support
app.configure(express.rest());
// Configure Socket.io real-time APIs
app.configure(socketio());

app.use(express.errorHandler());

// Add any new real-time connection to the `game` channel
app.on('connection', connection => app.channel('game').join(connection));
// Publish all events to the `everybody` channel
// app.publish(data => app.channel('game'));

// Start the server
app.listen(3030).on('listening', () =>
  console.log('Feathers server listening on localhost:3030')
);
