// https://github.com/micro-analytics/micro-analytics-cli/blob/master/docs/writing-adapters.md#tests
const path = require('path')
const test = require('micro-analytics-adapter-utils/unit-tests')

test({
	name: 'postgres',
	modulePath: path.resolve(__dirname, './index.js')
})

it(`should throw error if POSTGRES_ANALYTICS env variable is not set`)

it(`should create the tables if they don't exist`)
