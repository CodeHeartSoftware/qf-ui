> **Public mirror.** This repository is a read-only copy of a private CodeHeart repo, synced
> automatically on every push to `main`. Issues and pull requests aren't monitored here.
> Licensed under [Apache-2.0](LICENSE). Built by [CodeHeart](https://github.com/CodeHeartSoftware).

# Quant Fusion — UI

The web UI for Quant Fusion, a personal quantitative investment tool for building research
models and managing simulated portfolios. React 19 + Vite + Tailwind v4.

The backend lives in [`qf-api`](https://github.com/CodeHeartSoftware/qf-api);
this app only talks to it over HTTP.

> **Provenance.** Forked from `apps/stock-market-4-ui` in
> `CodeHeartSoftware/thunderdome@17664fb` (private)
> with a fresh history.

## Running it

Requires Node 25 and Yarn 1.22. Start the API first (in the `quant-fusion-api` repo:
`yarn workspace @quant-fusion/api dev`, http://localhost:4410), then:

```bash
yarn install
yarn dev        # http://localhost:5420
```

The API base URL defaults to `http://localhost:4410`; override it with `VITE_API_BASE_URL` (see
`.env.example`). `yarn up` / `yarn down` run the built UI in Docker on the same port — it never
starts the API, only warns if it isn't reachable.

## Checks

```bash
yarn lint && yarn format:check && yarn typecheck && yarn test && yarn build
```

Code layout and conventions: [`.claude/skills/frontend-conventions/SKILL.md`](.claude/skills/frontend-conventions/SKILL.md).
