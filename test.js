const crypto = require('crypto');
const start = Date.now();

function encryptPassword(password, salt) {
  crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
    if (err) throw err;
    console.log(
      `Hash: ${derivedKey.toString('hex')}, Time: ${Date.now() - start}ms`
    );
  });
}

console.log('Starting tasks...');

for (let i = 0; i < 10; i++) {
  encryptPassword('password', 'salt' + i);
}
