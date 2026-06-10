const cliProgress = require('cli-progress');

function makeBar(label) {
  return new cliProgress.SingleBar(
    {
      format: `${label} |{bar}| {percentage}% | {value}/{total} | ETA: {eta}s`,
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );
}

const log = {
  info: (m) => console.log(`\x1b[36m[INFO]\x1b[0m  ${m}`),
  ok:   (m) => console.log(`\x1b[32m[OK]\x1b[0m    ${m}`),
  warn: (m) => console.log(`\x1b[33m[WARN]\x1b[0m  ${m}`),
  err:  (m) => console.log(`\x1b[31m[ERROR]\x1b[0m ${m}`),
};

module.exports = { makeBar, log };
