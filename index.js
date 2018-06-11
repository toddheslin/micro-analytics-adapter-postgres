const assert = require('assert')
const pgp = require('pg-promise')({
	// Turns on query logging
	// query(e) {
	// 	console.log('QUERY:', e.query)
	// }
})
const db = pgp(process.env.POSTGRES_ANALYTICS)

// will be set during init if everything is OK
let schemaTable

const options = [
	{
		name: 'table',
		description: 'Name of table prepared to use with micro analytics (default is analytics)',
		defaultValue: process.env.table || 'analytics'
	},
	{
		name: 'schema',
		description: 'Name of postgres schema where your table can be found (default is public)',
		defaultValue: process.env.schema || 'public'
	}
]

const init = async ({ table, schema }) => {
	function handleInitErrors(err) {
		console.error(`Postgres Init Error: ${err.message}`)
		if (process.env.NODE_ENV !== 'test') process.exit(1)
	}

	// check the connection string
	const initConnection = await db.connect().catch(handleInitErrors)

	// check the table and columns
	const colsInTable = (t, s) =>
		initConnection.manyOrNone(
			'SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2;',
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
				assert(cols.includes('sent_at'), `Column 'sent_at' not found in in schema '${s}' and table '${t}'`)
				assert(cols.includes('meta'), `Column 'meta' not found in in schema '${s}' and table '${t}'`)
			})
			.catch(handleInitErrors)

	await checkCols(table, schema)

	// Set the table and schema for the application
	schemaTable = new pgp.helpers.TableName(table, schema)

	// All is OK, close the init connection
	initConnection.done()
}

const has = pathname =>
	db.oneOrNone('SELECT pathname FROM $1 WHERE pathname = $2 LIMIT 1', [schemaTable, pathname]).then(data => !!data)

const keys = pathname => db.oneOrNone('SELECT DISTINCT pathname FROM $1', [schemaTable, pathname])

const get = (pathname, { before, after } = {}) => {
	const baseQuery = 'SELECT ROUND(EXTRACT(epoch from sent_at)* 1000) as time FROM $1 WHERE pathname = $2 '

	const mapper = row => row.time
	const responder = result => {
		const views = result || []
		return {
			views
		}
	}

	if (before || after) {
		const b = before && new Date(before)
		const a = after && new Date(after)

		if (b && a) {
			return db
				.map(
					baseQuery + 'AND sent_at > $3 AND sent_at < $4',
					[schemaTable, pathname, a.toISOString(), b.toISOString()],
					mapper
				)
				.then(responder)
		} else if (b) {
			return db.map(baseQuery + 'AND sent_at < $3', [schemaTable, pathname, b.toISOString()], mapper).then(responder)
		} else if (a) {
			return db.map(baseQuery + 'AND sent_at > $3', [schemaTable, pathname, a.toISOString()], mapper).then(responder)
		}
	} else {
		return db.map(baseQuery, [schemaTable, pathname], mapper).then(responder)
	}
}

const getAll = ({ pathname, before, after }) => {
	const pathLookup = pathname + '%'

	const mapper = row => ({
		pathname: row.pathname,
		views: row.views.map(v => ({ time: v.time }))
	})
	const responder = result =>
		result.reduce((results, path) => {
			const views = path.views.filter(view => view.time)
			results[path.pathname] = { views }
			return results
		}, {})

	if (before || after) {
		const b = before && new Date(before)
		const a = after && new Date(after)

		if (b && a) {
			return db
				.map(
					'SELECT pathname, array_to_json(array_agg(row_to_json(t))) as views FROM ( SELECT pathname, CASE WHEN sent_at > $3 AND sent_at < $4  THEN ROUND(EXTRACT(epoch from sent_at)* 1000) ELSE null END as time FROM $1 ) t WHERE pathname like $2 GROUP BY pathname',
					[schemaTable, pathLookup, a.toISOString(), b.toISOString()],
					mapper
				)
				.then(responder)
		} else if (b) {
			return db
				.map(
					'SELECT pathname, array_to_json(array_agg(row_to_json(t))) as views FROM ( SELECT pathname, CASE WHEN sent_at < $3 THEN ROUND(EXTRACT(epoch from sent_at)* 1000) ELSE null END as time FROM $1 ) t WHERE pathname like $2 GROUP BY pathname',
					[schemaTable, pathLookup, b.toISOString()],
					mapper
				)
				.then(responder)
		} else if (a) {
			return db
				.map(
					'SELECT pathname, array_to_json(array_agg(row_to_json(t))) as views FROM ( SELECT pathname, CASE WHEN sent_at > $3 THEN ROUND(EXTRACT(epoch from sent_at)* 1000) ELSE null END as time FROM $1 ) t WHERE pathname like $2 GROUP BY pathname',
					[schemaTable, pathLookup, a.toISOString()],
					mapper
				)
				.then(responder)
		}
	} else {
		return db
			.map(
				'SELECT pathname, array_to_json(array_agg(row_to_json(t))) as views FROM (SELECT pathname, ROUND(EXTRACT(epoch from sent_at)* 1000) as time FROM $1) t WHERE pathname like $2 GROUP BY pathname',
				[schemaTable, pathLookup],
				mapper
			)
			.then(responder)
	}
}

const put = (pathname, { views = [{}] }) => {
	// In what cases would we have more than one element in the array?

	const inserts = views.map(view => {
		const { time = 0, meta = {} } = view
		const sentAt = new Date(time)
		return { sent_at: sentAt.toISOString(), pathname, meta }
	})
	const queries = pgp.helpers.insert(inserts, ['sent_at', 'pathname', 'meta'], schemaTable)
	return db.none(queries)
}

module.exports = {
	init,
	options,
	get,
	put,
	getAll,
	has,
	keys
	//, subscribe
}

if (process.env.NODE_ENV === 'test') {
	module.exports = Object.assign(module.exports, {
		reset: async ({ table, schema }) => {
			schemaTable = new pgp.helpers.TableName(table, schema)
			function handleResetErrors(err) {
				console.error(`Postgres Reset Error: ${err.message}`)
			}
			await db.none('DROP TABLE IF EXISTS $1', schemaTable).catch(handleResetErrors)
			return db
				.none(
					'CREATE TABLE IF NOT EXISTS $1 (timestamp timestamp DEFAULT CURRENT_TIMESTAMP,sent_at timestamp,pathname text NOT NULL,meta json);',
					schemaTable
				)
				.catch(handleResetErrors)
		}
	})
}
