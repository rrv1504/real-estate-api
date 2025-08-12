import { randomBytes, pbkdf2 } from 'crypto';

export const hashPassword = (password) => {
    return new Promise((resolve, reject) => {
        const salt = randomBytes(16).toString('hex');
        pbkdf2(password, salt, 1000, 64, 'sha512', (err, derivedKey) => {
            if (err) {
                return reject(err);
            }
            resolve(`${salt}:${derivedKey.toString('hex')}`);
        });
    });
};

export const comparePassword = (password, hash) => {
    return new Promise((resolve, reject) => {
        const [salt, key] = hash.split(":");
        pbkdf2(password, salt, 1000, 64, 'sha512', (err, derivedKey) => {
            if (err) {
                return reject(err);
            }
            resolve(key === derivedKey.toString('hex'));
        });
    });
};
