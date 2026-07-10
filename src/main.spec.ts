import * as main from './main';

describe('main entrypoint', () => {
  it('exports the Nest app factory and Vercel handler', () => {
    expect(typeof main.createApp).toBe('function');
    expect(typeof main.handler).toBe('function');
  });
});
