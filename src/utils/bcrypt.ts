import * as bcryptjs from 'bcryptjs';

export const hash = (data: string, rounds: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    bcryptjs.hash(data, rounds, (err, hashed) => {
      if (err) reject(err);
      else resolve(hashed);
    });
  });
};

export const compare = (data: string, hashed: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    bcryptjs.compare(data, hashed, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

export default { hash, compare };
