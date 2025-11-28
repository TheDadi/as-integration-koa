# `@thedadi/as-integration-koa`

A lightweight Koa integration for `@apollo/server`, providing:

-   Simple, modern Koa middleware
-   Strong TypeScript context typing
-   Compatible with Apollo Server v5

------------------------------------------------------------------------

## Installation

### npm

``` bash
npm install @thedadi/as-integration-koa @apollo/server graphql koa
```

### pnpm

``` bash
pnpm add @thedadi/as-integration-koa @apollo/server graphql koa
```

### yarn

``` bash
yarn add @thedadi/as-integration-koa @apollo/server graphql koa
```

------------------------------------------------------------------------

## Usage (TypeScript)

``` ts
import http from "node:http";
import Koa from "koa";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { koaMiddleware, type KoaContextFn } from "@thedadi/as-integration-koa";

type MyContext = {
  token?: string;
};

const typeDefs = `#graphql
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => "world",
  },
};

(async () => {
  const app = new Koa();
  const httpServer = http.createServer(app.callback());

  const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });
  await server.start();

  const context: KoaContextFn<MyContext> = async ({ ctx }) => ({
    token: ctx.headers.token as string | undefined,
  });

  app.use(koaMiddleware(server, { context }));

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 4000 }, resolve)
  );

  console.log(`🚀 Server ready at http://localhost:4000`);
})();
```

------------------------------------------------------------------------

## License

MIT
