import { expect } from 'chai'

describe('Response', () => {
  it('can be instantiated', () => {
    expect(new Response('ahoyahoy')).not.to.throw
  })

  describe('cookies', () => {
    it('are parsed correctly', () => {
      const r = new Response('ahoyahoy', {
        headers: {
          'Set-Cookie': 'id=a3fWa; Expires=Wed, 21 Oct 2025 07:28:00 GMT; Secure; HttpOnly'
        }
      })
      const cookies = r.cookies()
      expect(r.length).to.have.lengthOf(1)
    })
  })
})