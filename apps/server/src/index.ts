import { BunHttpServer, BunRuntime } from '@effect/platform-bun';
import { Config, Effect, Layer } from 'effect';
import { HttpRouter, HttpServerResponse } from 'effect/unstable/http';
import { RpcSerialization, RpcServer } from 'effect/unstable/rpc';

import { DbService } from './lib/db';
import { RpcLive } from './Rpc';

const HealthRoute = HttpRouter.add('GET', '/health', HttpServerResponse.text('OK'));

const CorsLive = Layer.unwrap(
  Effect.gen(function* () {
    const origins = yield* Config.string('CORS_ORIGIN').pipe(
      Config.withDefault('http://localhost:5173'),
    );
    return HttpRouter.cors({
      allowedOrigins: origins.split(',').map((origin) => origin.trim()),
    });
  }),
);

const HttpLive = Layer.mergeAll(RpcLive, HealthRoute, CorsLive).pipe(
  Layer.provide(RpcServer.layerProtocolHttp({ path: '/rpc' })),
  Layer.provide(RpcSerialization.layerNdjson),
  Layer.provide(DbService.layer),
  HttpRouter.serve,
  Layer.provide(
    BunHttpServer.layerConfig({ port: Config.number('PORT').pipe(Config.withDefault(8008)) }),
  ),
);

Layer.launch(HttpLive).pipe(BunRuntime.runMain);
