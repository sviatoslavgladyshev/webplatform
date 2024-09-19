const { CONNECTION_STRING, SSL_CERTIFICATE, DB_NAME, COLLECTION_NAME } = require('./config');
const MongoClient = require('mongodb').MongoClient;

let client = null;

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  let logData = {};

  if (event && event.body) {
      try {
          logData = JSON.parse(event.body);
      } catch (e) {
          return {
              statusCode: 400,
              body: JSON.stringify({ message: 'Invalid JSON in request body' })
          };
      }
  }

  // Validate input
  if (!logData.userId || !logData.questTitle || !logData.quantityAdded) {
      return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Missing required fields' })
      };
  }

  try {
      // Initialize Mongo Client if necessary
      if ((client && !client.isConnected()) || (client === null)) {
          client = await MongoClient.connect(
              CONNECTION_STRING,
              {
                  useNewUrlParser: true,
                  ssl: true,
                  sslCA: SSL_CERTIFICATE
              }
          );
      }

      // Config Mongo Client
      const db = client.db('lblupDB');
      const collection = db.collection('users');

      // Prepare data for insertion
      const performanceLog = {
          userId: logData.userId,
          questTitle: logData.questTitle,
          quantityAdded: logData.quantityAdded,
          timestamp: new Date().toISOString()
      };

      // Write to DB
      const dbWrite = await collection.insertOne(performanceLog);

      // Return structure
      const response = {
          statusCode: 200,
          body: JSON.stringify({ message: 'Performance log recorded successfully', data: performanceLog, dbWrite })
      };

      return response;
  } catch (e) {
      console.error('Error:', e);
      return {
          statusCode: 500,
          body: JSON.stringify({ message: 'There was an error logging the performance data', error: e.message })
      };
  }
};