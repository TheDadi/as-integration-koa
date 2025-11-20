import { ApolloServer } from '@apollo/server';
import { expect, it } from '@jest/globals';
import { koaMiddleware } from '../index.js';

it('not calling start causes a clear error', async () => {
  const server = new ApolloServer({ typeDefs: 'type Query {f: ID}' });
  expect(() => koaMiddleware(server)).toThrow('You must `await server.start()`');
});
