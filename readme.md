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
Be sure to include the database name for where we will be reading/writing the analytics data.

E.g. `postgres://username:password@host:port/database?ssl=false&application_name=name
&fallback_application_name=name&client_encoding=encoding`. All query params on the string are optional but some managed postgres providers might require `ssl=true`

## License

Copyright ©️ 2018 Todd Heslin, licensed under the MIT license. See [LICENSE](LICENSE) for more information.
