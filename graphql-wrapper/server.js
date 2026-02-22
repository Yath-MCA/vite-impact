require('dotenv').config();
const { ApolloServer, gql } = require('apollo-server');
const fetch = require('node-fetch');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const API_PATH = process.env.API_PATH || '/api/';
const APP_KEY = process.env.APP_KEY || '';
const API_KEY = process.env.API_KEY || '';
const PORT = process.env.PORT || 4000;

function buildShareInviteUrl() {
  const base = BACKEND_URL.replace(/\/+$/, '');
  const apiPath = API_PATH.startsWith('/') ? API_PATH : '/' + API_PATH;
  const normalizedApi = apiPath.replace(/\/+$/, '');
  return `${base}${normalizedApi}/shareandinvite`;
}

async function callShareInvite(payload = {}) {
  const url = buildShareInviteUrl();
  const body = 'jsondata=' + encodeURIComponent(JSON.stringify(payload));

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'appkey': APP_KEY,
      'apikey': API_KEY
    },
    body
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ShareInvite call failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data;
}

const typeDefs = gql`
  type ShareInvite {
    id: ID
    identifier: String
    inviter: String
    invitee: String
    createdAt: String
    status: String
  }

  type Query {
    shareinvite(identifier: String, regex: String): [ShareInvite]
  }
`;

const resolvers = {
  Query: {
    shareinvite: async (_, args) => {
      const { identifier, regex } = args;
      const payload = {};
      if (identifier) payload.identifier = identifier;
      if (regex) payload.regex = regex;

      const result = await callShareInvite(payload);

      // Try to normalize the response into an array of objects
      if (Array.isArray(result)) return result;
      if (result && Array.isArray(result.items)) return result.items;
      // some backends return object with data or rows
      if (result && (result.data || result.rows)) return result.data || result.rows;

      // Fallback: wrap object
      return result ? [result] : [];
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen({ port: PORT }).then(({ url }) => {
  console.log(`GraphQL wrapper running at ${url}`);
  console.log(`Proxying shareandinvite -> ${buildShareInviteUrl()}`);
});
