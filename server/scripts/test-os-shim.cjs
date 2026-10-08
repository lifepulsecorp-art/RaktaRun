const os = require('node:os');
const systemUserInfo = os.userInfo.bind(os);

// Some restricted Windows runners cannot query the host user through libuv.
Object.defineProperty(os, 'userInfo', { configurable: true, value: () => {
  try { return systemUserInfo(); }
  catch {
    return {
      uid: -1,
      gid: -1,
      username: process.env.USERNAME || 'lifepulse-test',
      homedir: os.homedir(),
      shell: null,
    };
  }
} });
