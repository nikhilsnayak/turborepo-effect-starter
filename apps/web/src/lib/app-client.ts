import { AppRpcs } from '@workspace/contracts';
import { Layer } from 'effect';
import { FetchHttpClient } from 'effect/unstable/http';
import { AtomRpc } from 'effect/unstable/reactivity';
import { RpcClient, RpcSerialization } from 'effect/unstable/rpc';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8008';

export class AppClient extends AtomRpc.Service<AppClient>()('AppClient', {
  group: AppRpcs,
  protocol: RpcClient.layerProtocolHttp({ url: `${apiUrl}/rpc` }).pipe(
    Layer.provideMerge(RpcSerialization.layerNdjson),
    Layer.provideMerge(FetchHttpClient.layer),
  ),
}) {}
