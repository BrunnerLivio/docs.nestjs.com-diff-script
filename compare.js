const glob = require('glob');
const diff = require('diff');
const fs = require('fs');
const childProcess = require('child_process');
const { promisify } = require('util');
const exec = promisify(childProcess.exec);
const promiseSeries = require('promise.series');
const pretty = require('pretty');
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

async function getFile(path){
  let content = await readFile(path, 'utf8');
  const matches = content.match(/app(.*?)[\.,>]/gm);
  if(matches) {
    matches.forEach(match => {
      match = match.replace('>', '');
      content = content.replace(match, '');
    });
  }
  return pretty(content.replace(/target=\'_blank\'/g, 'target="_blank"'));
}

async function diffMatch(match) {
  const dgeniPath = match;
  const masterPath = match.replace('dgeni', 'master');
  const dgeniContent = await getFile(dgeniPath);
  const masterContent = await getFile(masterPath);
  const pathSegments = match.split('/');
  const fileName = pathSegments[pathSegments.length - 1];

  await writeFile('dgeni-output', dgeniContent);
  await writeFile('master-output', masterContent);
  let difference;
  console.log('=== DIFF ' + fileName);
  try {
    difference = await exec('git diff --color-words ./dgeni-output ./master-output');
  } catch(err) {
    console.log(err.stdout);
  }
  await new Promise(resolve => setTimeout(() => resolve(), 500));
}

glob(__dirname + '/dgeni/**/*.html', async (err, matches) => {
  for await(let match of matches) {
    await diffMatch(match);
  }
});
