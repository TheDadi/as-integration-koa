import http from 'node:http';
import { ApolloServer, type ApolloServerOptions, type BaseContext } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import type { CreateServerForIntegrationTestsOptions } from '@apollo/server-integration-testsuite';
import { defineIntegrationTestSuite } from '@apollo/server-integration-testsuite';
import cors from '@koa/cors';
import Koa from 'koa';
import { koaMiddleware } from '../index.js';
import { urlForHttpServer } from './utils.js';

defineIntegrationTestSuite(
  async (
    serverOptions: ApolloServerOptions<BaseContext>,
    testOptions?: CreateServerForIntegrationTestsOptions,
  ) => {
    const app = new Koa();
    // disable logs to console.error
    app.silent = true;

    const httpServer = http.createServer(app.callback());
    const server = new ApolloServer({
      ...serverOptions,
      plugins: [
        ...(serverOptions.plugins ?? []),
        ApolloServerPluginDrainHttpServer({
          httpServer,
        }),
      ],
    });

    await server.start();
    app.use(cors());
    app.use(
      koaMiddleware(server, {
        context: testOptions?.context,
      }),
    );
    await new Promise<void>((resolve) => {
      httpServer.listen({ port: 0 }, resolve);
    });
    return { server, url: urlForHttpServer(httpServer) };
  },
);
