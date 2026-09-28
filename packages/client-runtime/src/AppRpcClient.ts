import { AppRpcs } from '@repo/contracts/AppRpcs';
import { Layer } from 'effect';
import { FetchHttpClient } from 'effect/http';
import { AtomRpc } from 'effect/reactivity';
import { RpcClient, RpcSerialization } from 'effect/rpc';

import { serverUrlAtom } from './Config.ts';

export class AppRpcClient extends AtomRpc.Service<AppRpcClient>()(
  '@repo/client-runtime/AppRpcClient',
  {
    group: AppRpcs,
    protocol: (get) =>
      RpcClient.layerProtocolHttp({ url: `${get(serverUrlAtom)}/rpc` }).pipe(
        Layer.provideMerge(RpcSerialization.layerNdjson),
        Layer.provideMerge(FetchHttpClient.layer),
      ),
  },
) {}
