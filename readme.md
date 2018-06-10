# `micro-analytics-adapter-postgres`

Use [`postgres`](https://www.postgresql.org) to store your [`micro-analytics`](https://github.com/micro-analytics/micro-analytics-cli) data! Huge thanks to @vitaly-t for the [`pg-promise`](https://github.com/vitaly-t/pg-promise) library, making postgres a pleasure to work with in node.

## Usage

```sh
npm install micro-analytics-adapter-postgres
DB_ADAPTER=postgres micro-analytics
```

## Options

Options are set via environment variables. These are the possible options for this adapter:

```sh
POSTGRES_ANALYTICS    # fully formed postgres connection string URI starting with postgres://
```
Similar to `psql` Defaults to `postgres://{OS User}:localhost:5432/{OS User}` when environment variable is not set

## License

Copyright ©️ 2018 Todd Heslin, licensed under the MIT license. See [LICENSE](LICENSE) for more information.
