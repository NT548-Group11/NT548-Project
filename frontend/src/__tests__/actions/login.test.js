import { checkLogin } from '../../actions/login';

describe('checkLogin action creator', () => {
  it('creates CHECK_LOGIN action with a user object', () => {
    const user = { token: 'abc', role: 'user' };
    const action = checkLogin(user);
    expect(action).toEqual({ type: 'CHECK_LOGIN', status: user });
  });

  it('creates CHECK_LOGIN action with false when logged out', () => {
    const action = checkLogin(false);
    expect(action).toEqual({ type: 'CHECK_LOGIN', status: false });
  });

  it('creates CHECK_LOGIN action with null', () => {
    const action = checkLogin(null);
    expect(action).toEqual({ type: 'CHECK_LOGIN', status: null });
  });
});
