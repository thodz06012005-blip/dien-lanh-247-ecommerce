import { appendFileSync, writeFileSync } from 'node:fs';
import net from 'node:net';

const port = Number(process.env.SMTP_CAPTURE_PORT || 2525);
const output = process.env.SMTP_CAPTURE_FILE || 'phase7-emails.log';
writeFileSync(output, '', 'utf8');

const server = net.createServer((socket) => {
  socket.setEncoding('utf8');
  socket.write('220 phase7.local ESMTP\r\n');
  let buffer = '';
  let dataMode = false;
  let message = '';

  const reply = (text) => socket.write(`${text}\r\n`);
  const processLine = (line) => {
    if (dataMode) {
      if (line === '.') {
        appendFileSync(output, `${message}\n---MESSAGE---\n`, 'utf8');
        message = '';
        dataMode = false;
        reply('250 2.0.0 queued');
      } else {
        message += `${line.startsWith('..') ? line.slice(1) : line}\r\n`;
      }
      return;
    }

    const command = line.toUpperCase();
    if (command.startsWith('EHLO') || command.startsWith('HELO')) {
      socket.write('250-phase7.local\r\n250-8BITMIME\r\n250 SIZE 10485760\r\n');
    } else if (command.startsWith('MAIL FROM') || command.startsWith('RCPT TO')) {
      reply('250 2.1.0 ok');
    } else if (command === 'DATA') {
      dataMode = true;
      reply('354 End data with <CR><LF>.<CR><LF>');
    } else if (command === 'RSET' || command === 'NOOP') {
      reply('250 2.0.0 ok');
    } else if (command === 'QUIT') {
      reply('221 2.0.0 bye');
      socket.end();
    } else {
      reply('250 2.0.0 ok');
    }
  };

  socket.on('data', (chunk) => {
    buffer += chunk;
    let boundary = buffer.indexOf('\r\n');
    while (boundary >= 0) {
      const line = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      processLine(line);
      boundary = buffer.indexOf('\r\n');
    }
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Phase 7 SMTP capture listening on 127.0.0.1:${port}`);
});

const close = () => server.close(() => process.exit(0));
process.on('SIGTERM', close);
process.on('SIGINT', close);
