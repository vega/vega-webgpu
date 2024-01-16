// release.js

const fs = require('fs-extra');
const { execSync } = require('child_process');
const prettier = require('prettier');
const readlineSync = require('readline-sync'); // Add this require for user input

async function createRelease(version, changes) {
  const releaseFolder = `./releases/${version.replace(/\./g, '_')}`;
  const indexPath = `./releases/index.html`;
  const versionPath = `./releases/versions.js`;

  var exisitingVersions = getVersions(versionPath);
  let override = false;
  console.log(exisitingVersions);
  if (exisitingVersions.includes(version)) {
    // Print readable versions variable
    console.log('\nExisting Versions:');
    console.log("");
    const overrideYN = readlineSync.keyInYNStrict(
      `Version ${version} already exists. Do you want to override it?`
    );

    if (!overrideYN) {
      console.log(`Release creation aborted for version ${version}.`);
      process.exit(0);
    }
    override = true;
  }

  // Step 1: Run build script
  console.log('Running build script...');
  execSync('npm run build');

  // Step 2: Copy files to the release folder
  console.log(`Creating release folder: ${releaseFolder}`);
  fs.ensureDirSync(releaseFolder);
  fs.copySync('./build', releaseFolder);

  // Step 3: Generate or update index.html with version and changes
  console.log(`Generating/updating index.html for version ${version}...`);
  await writeIndexFile(indexPath, versionPath, version, changes, override);

  console.log(`Release ${version} created successfully.`);
}

function getVersions(versionPath) {
  try {
    versionContent = fs.readFileSync(versionPath, 'utf-8');
    currentVersions = extractVersions(versionContent);
  } catch (error) {
    currentVersions = [];
  }
  return currentVersions;
}

async function writeIndexFile(indexPath, versionPath, version, changes, override) {
  let indexContent;
  let currentVersions = [];
  let exisitingVersionContent = [];

  try {
    // Try reading the existing index.html file
    indexContent = fs.readFileSync(indexPath, 'utf-8');
    exisitingVersionContent = extractExistingVersions(indexContent);
  } catch (error) {
    // If the file doesn't exist, create a new one
  }
  const existingIndex = exisitingVersionContent.findIndex((v) => v.version === version);
  if (existingIndex !== -1) {
    exisitingVersionContent[existingIndex] = {
      versionRef: `./${version.replace(/\./g, '_')}/vega-webgpu-renderer.js`,
      version: version,
      changes: changes
    };
  } else {
    exisitingVersionContent.push({
      versionRef: `./${version.replace(/\./g, '_')}/vega-webgpu-renderer.js`,
      version: version,
      changes: changes
    });
  }
  exisitingVersionContent.sort((a, b) => compareVersions(a.version, b.version));

  indexContent = generateInitialIndexContent();
  // Append the new version and changes to the table
  for (let i = 0; i < exisitingVersionContent.length; i++) {
    currentVersions.push(exisitingVersionContent[i].version);
    const newRow = `\n<tr><td><a href="${exisitingVersionContent[i].versionRef}">${exisitingVersionContent[i].version}</a></td><td>${exisitingVersionContent[i].changes}</td></tr>`
    indexContent = insertAfterTableBody(indexContent, newRow);
  }
  indexContent = await prettier.format(indexContent, {
    parser: 'html',
    singleQuote: true,
    tabWidth: 2,
    printWidth: 140,
  });

  // Write the updated content back to the file
  fs.writeFileSync(indexPath, indexContent, 'utf-8');
  const sortedVersions = currentVersions.reverse().map(v => `'${v}'`).join(', ');
  if (!override)
    fs.writeFileSync(versionPath, `const vegaWevGPURendererVersions = [${sortedVersions}];`, 'utf-8');
  return sortedVersions;
}

function extractVersions(content) {
  const match = content.match(/const\s*vegaWevGPURendererVersions\s*=\s*\[(.*?)\]\s*;/);
  if (match) {
    const versionsString = match[1].replace(/\s+/g, '').replaceAll("'", "").replaceAll("\"", "");
    return versionsString.split(',');
  }
  return [];
}

function extractExistingVersions(content) {
  const versions = [];
  const versionRegex = /<tr>\s*<td><a href="(.*?\/vega-webgpu-renderer.js)">(.*?)<\/a><\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g;

  let match;
  while ((match = versionRegex.exec(content)) !== null) {
    const versionRef = match[1];
    const version = match[2];
    const changes = match[3];

    versions.push({ versionRef, version, changes });
  }

  return versions;
}

function compareVersions(versionA, versionB) {
  const partsA = versionA.split('.').map(Number);
  const partsB = versionB.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const partA = partsA[i] || 0;
    const partB = partsB[i] || 0;

    if (partA < partB) {
      return -1;
    } else if (partA > partB) {
      return 1;
    }
  }

  return 0; // Both versions are equal
}



function generateInitialIndexContent() {
  return `
	  <!DOCTYPE html>
	  <html lang="en">
	  <head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" href="./index.css" />
		<title>Release Notes</title>
	  </head>
	  <body>
		<table>
		  <thead>
			<tr>
			  <th>Version</th>
			  <th>Changes</th>
			</tr>
		  </thead>
		  <tbody></tbody>
		</table>
	  </body>
	  </html>
	`;
}

function insertAfterTableBody(content, newContent) {
  const tableBodyIndex = content.indexOf('<tbody>');
  if (tableBodyIndex !== -1) {
    return content.slice(0, tableBodyIndex + '<tbody>'.length) +
      newContent +
      content.slice(tableBodyIndex + '<tbody>'.length);
  }
  return content;
}

// Get the version and changes from the command line arguments
const versionArg = process.argv[2];
const changesArg = process.argv[3] || '';

if (!versionArg) {
  console.error('Please provide a version number (e.g., "1.0.0") as a command-line argument.');
  process.exit(1);
}

// Run the release script
createRelease(versionArg, changesArg);