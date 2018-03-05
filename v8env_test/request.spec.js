import { expect } from 'chai'

describe('Request', () => {
  it('can be instantiated', () => {
    expect(new Request('http://example.com')).not.to.throw
  })

  it('sets body properly from intializing request', () => {
    const r = new Request('https://example.com', { body: 'ahoyhoy', method: 'post'})
    const req = new Request(r)

    expect(req.bodySource).to.eq(r.bodySource)
  })

  describe('cookies', () => {
    it('are parsed correctly', () => {
      const r = new Request('https://example.com', {
        headers: {
          'Cookie': 'id=a3fWa; Expires=Wed, 21 Oct 2025 07:28:00 GMT; Secure; HttpOnly'
        }
      })
      const cookies = r.cookies()
      expect(r.length).to.have.lengthOf(1)
    })
  })
})