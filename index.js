const assert = require('assert')
const pgp = require('pg-promise')()

const db = pgp(process.env.POSTGRES_ANALYTICS)

const options = [
	{
		name: 'table',
		description: 'Name of table prepared to use with micro analytics (default is analytics)',
		defaultValue: 'analytics'
	},
	{
		name: 'schema',
		description: 'Name of postgres schema where your table can be found (default is public)',
		defaultValue: 'public'
	}
]

const init = async ({ table, schema }) => {
	function handleInitErrors(err) {
		console.error(`Postgres Init Error: ${err.message}`)
		process.exit(1)
	}

	// check the connection string
	const initConnection = await db.connect().catch(handleInitErrors)

	// check the table and columns
	const colsInTable = (t, s) =>
		initConnection.manyOrNone(
			`SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2;`,
			[s, t]
		)

	const checkCols = (t, s) =>
		colsInTable(t, s)
			.then(cols => cols.map(c => c.column_name))
			.then(cols => {
				assert(
					cols.includes('pathname'),
					`Column 'pathname' not found in schema '${s}' and table '${t}'. Have you created the table yet?`
				)
				assert(cols.includes('timestamp'), `Column 'timestamp' not found in in schema '${s}' and table '${t}'`)
				assert(cols.includes('meta'), `Column 'meta' not found in in schema '${s}' and table '${t}'`)
			})
			.catch(handleInitErrors)

	await checkCols(table, schema)
	// All is OK, close the init connection
	initConnection.done()
}

init({
	table: 'analytics',
	schema: 'public'
})

const get = pathname => db.oneOrNone('SELECT * FROM {TABLE} WHERE pathname = #{1}', pathname)

// use json postgres function
const getAll = ({ pathname, before, after }) => db.oneOrNone('SELECT * FROM {TABLE} WHERE pathname = #{1}', pathname)

const put = (pathname, value) => db.none('INSERT INTO {TABLE} (pathname, value) VALUES (#{1}, #{2})', pathname, value)

const has = pathname =>
	db.oneOrNone('SELECT pathname FROM {TABLE} WHERE pathname = #{1} LIMIT 1', pathname).then(data => data.length > 0)

module.exports = {
	init,
	options, // see docs
	get,
	put,
	getAll,
	has
	//, subscribe
}
