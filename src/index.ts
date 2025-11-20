import { Readable } from 'node:stream';
import {
  type ApolloServer,
  type BaseContext,
  type ContextFunction,
  HeaderMap,
  type HTTPGraphQLRequest,
} from '@apollo/server';
import bodyParser from '@koa/bodyparser';
import type Koa from 'koa';

export type KoaContextFunctionArgument<StateT = Koa.DefaultState, ContextT = Koa.DefaultContext> = {
  ctx: Koa.ParameterizedContext<StateT, ContextT>;
};

export type KoaContextFn<TContext extends BaseContext, StateT, ContextT> = ContextFunction<
  [KoaContextFunctionArgument<StateT, ContextT>],
  TContext
>;

export type KoaMiddlewareOptions<TContext extends BaseContext, StateT, ContextT> = ([
  TContext,
] extends [BaseContext]
  ? [BaseContext] extends [TContext]
    ? { context?: KoaContextFn<TContext, StateT, ContextT> }
    : { context: KoaContextFn<TContext, StateT, ContextT> }
  : { context: KoaContextFn<TContext, StateT, ContextT> }) & {
  bodyParserOptions?: Parameters<typeof bodyParser>[0];
};

export function koaMiddleware<
  TContext extends BaseContext = BaseContext,
  StateT = Koa.DefaultState,
  ContextT = Koa.DefaultContext,
>(
  server: ApolloServer<TContext>,
  options?: KoaMiddlewareOptions<TContext, StateT, ContextT>,
): Koa.Middleware<StateT, ContextT> {
  server.assertStarted('koaMiddleware()');

  const contextFn = (options?.context ?? (async () => ({}) as TContext)) as KoaContextFn<
    TContext,
    StateT,
    ContextT
  >;

  const parseBody = bodyParser(options?.bodyParserOptions);

  return async (ctx, next) => {
    await parseBody(ctx, async () => {});

    const incomingHeaders = new HeaderMap();
    for (const [key, value] of Object.entries(ctx.headers)) {
      if (value !== undefined) {
        incomingHeaders.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
    }

    const url = new URL(ctx.href);

    const httpGraphQLRequest: HTTPGraphQLRequest = {
      method: ctx.method.toUpperCase(),
      headers: incomingHeaders,
      search: url.search,
      body: ctx.request.body,
    };

    const { body, headers, status } = await server.executeHTTPGraphQLRequest({
      httpGraphQLRequest,
      context: () => contextFn({ ctx }),
    });

    if (body.kind === 'complete') {
      ctx.body = body.string;
    } else if (body.kind === 'chunked') {
      ctx.body = Readable.from(body.asyncIterator);
    } else {
      throw new Error(`Unsupported body kind: ${(body as any).kind}`);
    }

    if (status !== undefined) {
      ctx.status = status;
    }

    for (const [k, v] of headers) {
      ctx.set(k, v);
    }

    return next();
  };
}
