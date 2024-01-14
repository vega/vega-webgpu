// release.js

const fs = require('fs-extra');
const { execSync } = require('child_process');

function createRelease(version, changes) {
	const releaseFolder = `./releases/${version.replace(/\./g, '_')}`;
	const indexPath = `./releases/index.html`;
	const versionPath = `./releases/versions.js`;

	// Step 1: Run build script
	console.log('Running build script...');
	execSync('npm run build');

	// Step 2: Copy files to the release folder
	console.log(`Creating release folder: ${releaseFolder}`);
	fs.ensureDirSync(releaseFolder);
	fs.copySync('./build', releaseFolder);

	// Step 3: Generate or update index.html with version and changes
	console.log(`Generating/updating index.html for version ${version}...`);
	const currentVersions = appendToIndexFile(indexPath, versionPath, version, changes);

	// Print readable versions variable
	console.log('\nReadable versions variable:');
	console.log(`const readableVersions = ${JSON.stringify(currentVersions, null, 2)};\n`);

	console.log(`Release ${version} created successfully.`);
}

function appendToIndexFile(indexPath, versionPath, version, changes) {
	let indexContent;
	let currentVersions = [];

	try {
		// Try reading the existing index.html file
		indexContent = fs.readFileSync(indexPath, 'utf-8');
		currentVersions = extractVersions(indexContent);
	} catch (error) {
		// If the file doesn't exist, create a new one
		indexContent = generateInitialIndexContent();
	}
	currentVersions = currentVersions.concat("\"" + version + "\"");

	const versionFilePath = `./${version.replace(/\./g, '_')}/vega-webgpu-renderer.js`;

	// Append the new version and changes to the table
	const newRow = `\n<tr><td><a href="${versionFilePath}">${version}</a></td><td>${changes}</td></tr>`
	indexContent = insertAfterTableBody(indexContent, newRow);
	indexContent = indexContent.replace(/const\s*readableVersions\s*=\s*\[(.*?)\]\s*;/, `const readableVersions = [${currentVersions.join(', ')}];`)

	// Write the updated content back to the file
	fs.writeFileSync(indexPath, indexContent, 'utf-8');
	fs.writeFileSync(versionPath, `const vegaWevGPURendererVersions = [${currentVersions.join(', ')}];`, 'utf-8');
	return currentVersions;
}

function extractVersions(content) {
	const match = content.match(/const\s*readableVersions\s*=\s*\[(.*?)\]\s*;/);
	if (match) {
		const versionsString = match[1].replace(/\s+/g, '');
		return versionsString.split(',');
	}
	return [];
}



function generateInitialIndexContent() {
	return `
	  <!DOCTYPE html>
	  <html lang="en">
	  <head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
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
		<script>
		  const readableVersions = [];
		</script>
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