#!/usr/bin/env node

const fs = require('fs');
const { CloudFormationClient, ValidateTemplateCommand } = require('@aws-sdk/client-cloudformation');

const client = new CloudFormationClient({ region: 'us-east-1' });

/**
 *  aws-template-validator - ☁️ AWS CloudFormation Template Validator — Validate JSON/YAML templates directly with AWS
 *  @version: v1.0.1
 *  @link: https://github.com/tutyamxx/aws-template-validator
 *  @license: MIT
 **/


/**
 * Validate a CloudFormation template file with `AWS CloudFormation API (SDK v3)`.
 *
 * Reads the file and sends it to AWS for validation.
 * Logs success or failure to the console. Errors are caught and logged.
 *
 * @param {string} templateFile - Path to the CloudFormation template file (`JSON` or `YAML`).
 * @returns {Promise<void>} Resolves after logging validation result.
 */
const validateWithAWS = async (templateFile) => {
    try {
        const templateBody = fs.readFileSync(templateFile, 'utf-8');
        const command = new ValidateTemplateCommand({ TemplateBody: templateBody });
        await client.send(command);

        console.log('☁️ AWS CloudFormation validation successful!');
    } catch (err) {
        console.log('☁️ AWS CloudFormation validation failed!');
        console.log(err?.message ?? err);
    }
}

// --| CLI logic: run only if executed directly
if (require.main === module) {
    const [,, templateFile] = process.argv;

    if (!templateFile) {
        console.error('Usage: node index.js <template-file>');
        process.exit(1);
    }

    validateWithAWS(templateFile).catch(err => {
        console.error('❌ Template validation failed:', err);
        process.exit(1);
    })
}

// --| CommonJS export
module.exports = { validateWithAWS };

// --| ESM default export for `import` statements
module.exports.default = { validateWithAWS };
