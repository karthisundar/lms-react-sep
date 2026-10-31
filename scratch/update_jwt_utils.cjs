const fs = require('fs');

const p = 'D:/Karthi/LMS/src/components/auth/jwt.utils.ts';
let content = fs.readFileSync(p, 'utf8');

const regex = /export const verifyJWT = \(token: string\): \{ payload: any; expired: boolean; token\?: string \} => \{[\s\S]*?\};/;
const newVerifyFn = `export const verifyJWT = (token: string): { payload: any; expired: boolean; token?: string } => {
	try {
		if (!token || typeof token !== 'string') {
			return { payload: null, expired: false };
		}
		const cleanToken = token.replace(/^Bearer\\s+/i, '').trim();
		const decoded = jwt.verify(cleanToken, publicKey);
		return { payload: decoded, expired: false, token: cleanToken };
	} catch (error: any) {
		return {
			payload: null,
			expired: Boolean(error?.message?.includes('Jwt token was expired') || error?.message?.includes('jwt expired')),
		};
	}
};`;

if (regex.test(content)) {
  content = content.replace(regex, newVerifyFn);
  fs.writeFileSync(p, content, 'utf8');
  console.log('jwt.utils.ts verifyJWT replaced successfully!');
} else {
  console.log('Regex did not match.');
}
