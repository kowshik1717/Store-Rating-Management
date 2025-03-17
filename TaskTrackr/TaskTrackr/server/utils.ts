import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  const hashedPassword = `${buf.toString("hex")}.${salt}`;
  console.log('Generated hash for password:', { 
    salt,
    hashedLength: hashedPassword.length,
    preview: hashedPassword.substring(0, 10) + '...'
  });
  return hashedPassword;
}

export async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    console.log('Password comparison:', {
      supplied: '***',
      salt,
      result,
      storedLength: stored.length,
      suppliedHashLength: suppliedBuf.length,
      storedHashLength: hashedBuf.length
    });
    return result;
  } catch (error) {
    console.error('Password comparison failed:', error);
    return false;
  }
}