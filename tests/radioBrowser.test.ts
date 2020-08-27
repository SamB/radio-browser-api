import nock from 'nock'
import { RadioBrowser } from '../src/radioBrowser'

import fetch from 'node-fetch'
// @ts-ignore
global.fetch = fetch

describe('Radio Browser', () => {
  afterEach(() => {
    nock.cleanAll()
    jest.clearAllMocks()
  })

  test('Resolve base url', async () => {
    const mockResult = [
      {
        name: 'server name',
        ip: '1.2.2.2.'
      }
    ]

    nock(/radio-browser.info/)
      .get('/json/servers')
      .reply(200, mockResult)

    const api = new RadioBrowser('test')
    const result = await api.resolveBaseUrl()

    expect(result).toEqual(mockResult[0])
    expect(api.getBaseUrl()).toBe(mockResult[0].ip)
  })

  test('Resolve base url but do not set it', async () => {
    const api = new RadioBrowser('test')
    const defaultBaseUrl = api.getBaseUrl()
    const mockResult = [
      {
        name: 'server name',
        ip: '1.2.2.2.'
      }
    ]

    nock(/radio-browser.info/)
      .get('/json/servers')
      .reply(200, mockResult)

    const result = await api.resolveBaseUrl(false)

    expect(result).toEqual(mockResult[0])
    expect(api.getBaseUrl()).toBe(defaultBaseUrl)
  })

  test('Manually set base url', () => {
    const url = '1.2.3.4'

    const api = new RadioBrowser('test')
    api.setBaseUrl(url)

    expect(api.getBaseUrl()).toBe(url)
  })

  test('Throw if response is not OK', async () => {
    const errorText = 'server error'
    nock(/radio-browser.info/)
      .get('/json/servers')
      .reply(500, errorText)

    const api = new RadioBrowser('test')
    expect.assertions(1)
    try {
      await api.resolveBaseUrl()
    } catch (e) {
      const result = await e.text()
      expect(result).toBe(errorText)
    }
  })

  test('When fetching, custom user agent is present', async () => {
    nock(/radio-browser.info/)
      .get('/json/servers')
      .reply(200, [{ name: '', ip: '' }])
    const agent = 'test'
    const api = new RadioBrowser(agent)

    const spy = jest.spyOn(global, 'fetch')
    await api.resolveBaseUrl()

    expect(spy).toBeCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'user-agent': agent })
      })
    )
  })

  test('When fetching, custom headers are present', async () => {
    nock(/radio-browser.info/)
      .get('/json/servers')
      .reply(200, [{ name: '', ip: '' }])

    const agent = 'test'
    const api = new RadioBrowser(agent)
    const spy = jest.spyOn(global, 'fetch')

    const headerName = 'x-jest-test'
    const headerValue = '1'

    await api.resolveBaseUrl(true, {
      headers: {
        [headerName]: headerValue
      }
    })

    expect(spy).toBeCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ [headerName]: headerValue })
      })
    )
  })

  test('get countries', async () => {
    nock(/radio-browser.info/)
      .get(/json\/countries/)
      .reply(200, {})

    const api = new RadioBrowser('test')

    const spy = jest.spyOn(global, 'fetch')
    const headerName = 'x-jest-test'
    const headerValue = '1'

    await api.getCountries(
      'search',
      { order: 'name' },
      {
        headers: {
          [headerName]: headerValue
        }
      }
    )

    expect(spy).toBeCalledWith(
      expect.stringMatching(/countries\/search\?order=name/),
      expect.objectContaining({
        headers: expect.objectContaining({ [headerName]: headerValue })
      })
    )
  })
})
