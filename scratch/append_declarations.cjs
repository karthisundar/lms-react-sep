const fs = require('fs');
const filePath = 'D:/Karthi/LMS/src/types/declarations.d.ts';

const extraDeclarations = `
declare module 'cors' {
  import { RequestHandler } from 'express';
  function cors(options?: any): RequestHandler;
  export = cors;
}

declare module 'jsonwebtoken' {
  export function sign(payload: string | Buffer | object, secretOrPrivateKey: any, options?: any, callback?: any): any;
  export function verify(token: string, secretOrPublicKey: any, options?: any, callback?: any): any;
  export function decode(token: string, options?: any): any;
}

declare module 'bcrypt' {
  export function hash(data: any, saltOrRounds: string | number): Promise<string>;
  export function hashSync(data: any, saltOrRounds: string | number): string;
  export function compare(data: any, encrypted: string): Promise<boolean>;
  export function compareSync(data: any, encrypted: string): boolean;
  export function genSaltSync(rounds?: number): string;
  export function genSalt(rounds?: number): Promise<string>;
}
`;

fs.appendFileSync(filePath, extraDeclarations, 'utf8');
console.log('Appended cors, jsonwebtoken, and bcrypt declarations');
