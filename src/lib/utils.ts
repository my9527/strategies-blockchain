import CryptoJS from 'crypto';
import path from 'path';
import fs, { ReadStream, WriteStream } from 'fs';
import uuid from 'uuid';

// import { ApiKey } from '../config';

export function sign(text: string, secret: string, outputType:any = 'base64') {
  return CryptoJS
    .createHmac('sha256', secret)
    .update(text)
    .digest(outputType);
}

// kucoin auth
export function auth(ApiKey: any, method: string, url: string, data: any) {
  const timestamp = Date.now();
  const signature = sign(timestamp + method.toUpperCase() + url + data, ApiKey.secret);


  return {
    'KC-API-KEY': ApiKey.key,
    'KC-API-SIGN': signature,
    'KC-API-TIMESTAMP': timestamp.toString(),
    'KC-API-PASSPHRASE': ApiKey.passphrase || '',
    'Content-Type': 'application/json',
  };
}


export async function readFile(filePath: string): Promise<string> {
  const fileAbsolutePath: string = path.join(__dirname, filePath);
  console.log(fileAbsolutePath);
  const readStream: ReadStream = fs.createReadStream(fileAbsolutePath);
  let chunk: string = "";
  return new Promise((resolve) => {
    readStream.on('data', data => {
      chunk += data;
    });
    readStream.on('end', () => {
      resolve(chunk);
    });
    readStream.on('error', (err: Error) => {
      resolve(err.message);
    })
  })
}

export async function writeFile(filePath: string, content: string): Promise<string> {
  const fileAbsolutePath: string = path.join(__dirname, filePath);
  const writeStream: WriteStream = fs.createWriteStream(fileAbsolutePath);


  return new Promise(resolve => {
    writeStream.write(content);
    writeStream.on('end', () => {
      resolve("");
    });
    writeStream.on('error', (err: Error) => {
      resolve(err.message);
    });
  })

}


export function genClientOid() {
  return uuid.v4();
}

export function strTo2String(str: string): string {
  var result = [];
  var list = str.split("");
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var binaryStr: string = item.charCodeAt(0).toString(8);
    result.push(binaryStr);
  }
  return result.join("");
}

export const getPrecision = (num: number) => {
    return (num.toString().split('.')[1] || '').length
}