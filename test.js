/* eslint-disable no-undef */
// const test = require('micro-analytics-adapter-utils/unit-tests')
const adapter = require('./index')

describe('micro-analytics adapter postgres', () => {
	beforeAll(async () => {
		const schemaTable = {
			table: 'analytics',
			schema: 'public'
		}
		await adapter.reset(schemaTable)
		await adapter.init(schemaTable)
	})

	test('get() should return a promise', () => {
		expect(adapter.get('/a-key').constructor.name).toEqual('Promise')
	})

	test('getAll() should return a promise', () => {
		expect(adapter.getAll({ pathname: '/' }).constructor.name).toEqual('Promise')
	})

	test('has() should return a promise', () => {
		expect(adapter.has('/a-key').constructor.name).toEqual('Promise')
	})

	test('keys() should return a promise', () => {
		expect(adapter.keys().constructor.name).toEqual('Promise')
	})

	test('put() should return a promise', () => {
		expect(adapter.put('/a-key', {}).constructor.name).toEqual('Promise')
	})

	if (typeof adapter.options !== 'undefined') {
		test('options should be an array of args options', () => {
			expect(Array.isArray(adapter.options)).toBe(true)
			if (adapter.options.length >= 0) {
				let counter = 0
				adapter.options.forEach(option => {
					expect(option.name).toBeDefined()
					expect(option.description).toBeDefined()
					counter++
				})

				// if the forEach somehow breaks the test should break
				expect(counter).toBe(adapter.options.length)
			}
		})

		test('init should be a defined when options is defined', () => {
			expect(typeof adapter.init).not.toBe('undefined')
		})
	} else {
		test.skip('options should be an array of args options', () => {})
		test.skip('init should be a defined when options is defined', () => {})
	}

	if (typeof adapter.init !== 'undefined') {
		test('init should be a function', () => {
			expect(typeof adapter.init).toBe('function')
		})

		test('call init should not throw', () => {
			adapter.init({
				table: 'analytics',
				schema: 'public'
			})
		})
	} else {
		test.skip('init should be a function', () => {})
		test.skip('call init should not throw', () => {})
	}

	it('should save and read', async () => {
		await adapter.put('/simple-key', { views: [{ time: 1490623474639 }] })
		const result = await adapter.get('/simple-key')
		expect(result).toMatchObject({
			views: expect.any(Array)
		})
		expect(result.views).toContain(1490623474639)
	})

	it('should return empty list of views when key has no views', async () => {
		expect(await adapter.get('/c-key')).toEqual({ views: [] })
	})

	it('should return all saves on getAll', async () => {
		await adapter.put('/a-key', { views: [{ time: 1490623474639 }] })
		await adapter.put('/a-other-key', { views: [{ time: 1490623474639 }] })

		expect(await adapter.getAll({ pathname: '/' })).toEqual({
			'/a-key': { views: [{ time: 1490623474639 }] },
			'/a-other-key': { views: [{ time: 1490623474639 }] },
			'/simple-key': { views: [{ time: 1490623474639 }] }
		})
	})

	it('should return filtered saves from getAll based on pathname', async () => {
		await adapter.put('/b-key', { views: [{ time: 1490623474639 }] })
		await adapter.put('/b-other-key', { views: [{ time: 1490623474639 }] })
		await adapter.put('/c-key', { views: [{ time: 1490623474639 }] })

		expect(await adapter.getAll({ pathname: '/b' })).toEqual({
			'/b-key': { views: [{ time: 1490623474639 }] },
			'/b-other-key': { views: [{ time: 1490623474639 }] }
		})
	})

	it('should return filtered saves from getAll based on before', async () => {
		await adapter.put('/d-key', { views: [{ time: 1490623474639 }] })
		await adapter.put('/d-other-key', { views: [{ time: 1490623478639 }] })
		await adapter.put('/d-other-other-key', { views: [{ time: 1490623484639 }] })

		expect(await adapter.getAll({ pathname: '/d', before: 1490623478640 })).toEqual({
			'/d-key': { views: [{ time: 1490623474639 }] },
			'/d-other-key': { views: [{ time: 1490623478639 }] },
			'/d-other-other-key': { views: [] }
		})
	})

	it('should return filtered saves from getAll based on after', async () => {
		await adapter.put('/e-key', { views: [{ time: 1490623474639 }] })
		await adapter.put('/e-other-key', { views: [{ time: 1490623478639 }] })
		await adapter.put('/e-other-other-key', { views: [{ time: 1490623484639 }] })

		expect(await adapter.getAll({ pathname: '/e', after: 1490623478638 })).toEqual({
			'/e-key': { views: [] },
			'/e-other-key': { views: [{ time: 1490623478639 }] },
			'/e-other-other-key': { views: [{ time: 1490623484639 }] }
		})
	})

	it('should return filtered saves from get based on before', async () => {
		await adapter.put('/filter-before-key', { views: [{ time: 1490623474639 }] })
		await adapter.put('/filter-before-key', { views: [{ time: 1490623478639 }] })

		expect(await adapter.get('/filter-before-key', { before: 1490623475640 })).toEqual({
			views: [1490623474639]
		})
	})

	it('should return filtered saves from get based on after', async () => {
		await adapter.put('/filter-after-key', { views: [{ time: 1490623474639 }] })
		await adapter.put('/filter-after-key', { views: [{ time: 1490623478639 }] })

		expect(await adapter.get('/filter-after-key', { after: 1490623475640 })).toEqual({
			views: [1490623478639]
		})
	})

	it('should have check whether a key is stored with has', async () => {
		await adapter.put('/a-key', { views: [{ time: 1490623474639 }] })

		expect(await adapter.has('/a-key')).toEqual(true)
		expect(await adapter.has('/non-existing-key')).toEqual(false)
	})

	// Tests for subscription module
	if (typeof adapter.subscribe === 'function') {
		it('should allow subscription with observables', async () => {
			const listener = jest.fn()
			const unsubscribe = adapter.subscribe(listener)

			await adapter.put('/a-key', { views: [{ time: 1490623474639 }] })

			expect(listener).toHaveBeenCalledWith({
				key: '/a-key',
				value: { views: [{ time: 1490623474639 }] }
			})
		})

		it('should allow multiple subscription with observables and handle unsubscribption', async () => {
			const listener1 = jest.fn()
			const listener2 = jest.fn()
			const subscription = adapter.subscribe(listener1)
			adapter.subscribe(listener2)

			await adapter.put('/a-key', { views: [{ time: 1490623474639 }] })
			subscription.unsubscribe()
			await adapter.put('/b-key', { views: [{ time: 1490623474639 }] })

			expect(listener1).toHaveBeenCalledWith({
				key: '/a-key',
				value: { views: [{ time: 1490623474639 }] }
			})
			expect(listener1).not.toHaveBeenCalledWith({
				key: '/b-key',
				value: { views: [{ time: 1490623474639 }] }
			})
			expect(listener2).toHaveBeenCalledWith({
				key: '/a-key',
				value: { views: [{ time: 1490623474639 }] }
			})
			expect(listener2).toHaveBeenCalledWith({
				key: '/b-key',
				value: { views: [{ time: 1490623474639 }] }
			})
		})
	} else {
		it.skip('should allow subscription with observables', () => {})
		it.skip('should allow multiple subscription with observables and handle unsubscribption', () => {})
	}
})

// it(`should throw error if POSTGRES_ANALYTICS env variable is not set`)

// it(`should create the tables if they don't exist`)
