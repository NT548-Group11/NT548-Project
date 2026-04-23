import loginReducer from '../../reducers/login';

describe('loginReducer', () => {
  it('returns the initial state (empty object) for unknown action', () => {
    const state = loginReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({});
  });

  it('returns the action status on CHECK_LOGIN', () => {
    const state = loginReducer({}, {
      type: 'CHECK_LOGIN',
      status: { token: 'abc123', role: 'user' },
    });
    expect(state).toEqual({ token: 'abc123', role: 'user' });
  });

  it('sets status to false on CHECK_LOGIN when not logged in', () => {
    const state = loginReducer({}, {
      type: 'CHECK_LOGIN',
      status: false,
    });
    expect(state).toBe(false);
  });

  it('preserves previous state for unrecognised actions', () => {
    const prev = { token: 'my-token' };
    const state = loginReducer(prev, { type: 'UNKNOWN' });
    expect(state).toEqual(prev);
  });
});
