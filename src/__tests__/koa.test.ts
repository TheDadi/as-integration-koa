import { ApolloServer } from '@apollo/server';
import { expect, it } from '@jest/globals';
import koa from 'koa';
import request from 'supertest';
import { koaMiddleware } from '../index.js';

it('not calling start causes a clear error', async () => {
  const server = new ApolloServer({ typeDefs: 'type Query {f: ID}' });
  expect(() => koaMiddleware(server)).toThrow('You must `await server.start()`');
});

it('calls middlewares defined after it', async () => {
  const server = new ApolloServer({ typeDefs: 'type Query {f: ID}' });
  const app = new koa();
  const spy = jest.fn();

  await server.start();

  app.use(koaMiddleware(server));
  app.use((_, next) => {
    spy();
    return next();
  });

  await request(app.callback()).post('/').send({ query: '{f}' }).expect(200);
  expect(spy).toHaveBeenCalled()
  await server.stop();
});
