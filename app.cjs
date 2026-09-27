// cPanel Phusion Passenger CommonJS bootstrap wrapper
// Required because cPanel loads startup files with require(), which fails on "type": "module"
import('./server/index.js').catch((err) => {
  console.error('[cPanel Startup Error]:', err);
  process.exit(1);
});
