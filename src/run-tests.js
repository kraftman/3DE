const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const util = require('util');

const execAsync = util.promisify(exec);

const runTest = async (code, test) => {
  const dirPath = path.join(__dirname, 'tmp');

  try {
    await fs.mkdir(dirPath, { recursive: true });
    console.log('Directory created or already exists:', dirPath);
  } catch (err) {
    console.error('Error creating directory:', err);
  }
  const codeFile = path.join(dirPath, 'code.js');
  const testFile = path.join(dirPath, 'test.spec.js');
  console.log('= made dirs');
  try {
    // Save the code string to a temp file
    await fs.writeFile(codeFile, code, 'utf8');

    // Save the test string to a temp file
    await fs.writeFile(testFile, test, 'utf8');

    // Run Vitest with the temp files
    console.log(`Running test: ${testFile}`);
    const { stdout, stderr } = await execAsync(`vitest run`);

    if (stderr) {
      throw new Error(stderr);
    }
    console.log('==== result', stdout);

    return stdout;
  } catch (error) {
    throw error;
  } finally {
    // Clean up temp files
    // await fs.unlink(codeFile);
    // await fs.unlink(testFile);
    // await fs.rmdir(tempDir);
  }
};

module.exports = runTest;
