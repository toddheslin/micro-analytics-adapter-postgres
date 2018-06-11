# `micro-analytics-adapter-postgres`

Use [`postgres`](https://www.postgresql.org) to store your [`micro-analytics`](https://github.com/micro-analytics/micro-analytics-cli) data! Huge thanks to @vitaly-t for the [`pg-promise`](https://github.com/vitaly-t/pg-promise) library, making postgres a pleasure to work with in node.

## Usage

Requires node version 8.x or later. Might consider backwards capability but I assume anyone using `micro-analytics` is likely relying on the latest versions of node available on Zeit's `now`.

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

## A note on the PUT method
This was previously implemented to accept multiple views coming in on the same request i.e. a batch request.

However, it seems that this isn't the case for the current micro-analytics library. Instead, it is sending all of the **old** data from a prior `GET` request along with the new request at the end. Whilst I don't like this implementation as it will scalability issues when we only really need to append data, I'll keep it for compability with the raw code base.

Should performance issues arise, we'll raise such issues in the core `micro-analytics` codebase.

## Testing
1. Create a test database and table. In this example we'll call it 'analytics' see `setup.sql` for an example.
2. Run test using your test database credentials as the `POSTGRES_ANALYTICS` env variable, e.g

`POSTGRES_ANALYTICS='postgres://Todd:@localhost:5432/analytics' npm test`

In this case, my localhost user is `Todd` and I have no password. Use your own `username:password` and update the database from `analytics` if you choose something different to test.

Note that I've not used the tests in the [`micro-analytics-adapter-utils`](https://github.com/toddheslin/micro-analytics-cli/tree/master/packages/adapter-utils) library for a couple of reasons:
- Jest wasn't working nicely and I suspect there could be additional configuration that wasn't documented
- There seems some inconsistencies with the expected return values that don't match the docs
- Along a similar line, it seems these aren't being actively maintained so I've decided on one less dependency
- Because I was only tearing down the table at the end of all tests, I needed to rename unique paths to set absolute return values
- I want to add specific tests for the postgres implementation

If `micro-analytics` continues to be maintained, including the test utils for consistency across adapters (great idea), we'll change the tests to use the common utils and contribute towards that package. As it stands right now, the lack of maintenance makes the scope of delivering this project larger than was needed.

## License

Copyright ©️ 2018 Todd Heslin, licensed under the MIT license. See [LICENSE](LICENSE) for more information.
