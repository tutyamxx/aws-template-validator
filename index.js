#!/usr/bin/env node

const fs = require('fs');
const { CloudFormationClient, ValidateTemplateCommand } = require('@aws-sdk/client-cloudformation');

/**
 * aws-template-validator - ☁️ AWS CloudFormation Template Validator — Validate JSON/YAML templates directly with AWS
 * @version: v1.0.3
 * @link: https://github.com/tutyamxx/aws-template-validator
 * @license: MIT
 **/


/**
 * Validate a CloudFormation template file with `AWS CloudFormation API (SDK v3)`.
 *
 * Reads the file and attempts to validate it against a list of AWS regions.
 * If a region is unreachable, it fails over to the next configured region.
 * Syntax errors stop the process immediately. All results are logged to the console.
 *
 * @param {string} templateFile - Path to the CloudFormation template file (`JSON` or `YAML`).
 * @returns {Promise<void>} Resolves if validation passes, or exits the process on failure.
 */
const validateWithAWS = async (templateFile) => {
    const AwsRegions = ['us-east-1', 'us-west-2', 'eu-central-1'];
    const templateBody = fs.readFileSync(templateFile, 'utf-8');

    for (const region of AwsRegions) {
        try {
            const client = new CloudFormationClient({ region });
            const command = new ValidateTemplateCommand({ TemplateBody: templateBody });
            await client.send(command);

            console.log(`☁️ AWS Validation successful (via ${region})`);

            return;
        } catch (err) {
            // --| If it's a validation error (400), don't retry in another region. A bad template is bad everywhere.
            if (err.name === 'ValidationError' || err.$metadata?.httpStatusCode === 400) {
                console.error('☁️ AWS Validation Template Syntax Error:');
                console.error(err.message);

                process.exit(1);
            }

            console.warn(`☁️ AWS region ${region} failed or unreachable. Trying next...`);
        }
    }

    console.error('☁️ AWS CloudFormation validation failed: All configured AWS regions failed to respond.');
    process.exit(1);
};

// --| CLI logic: run only if executed directly
if (require.main === module) {
    const [,, templateFile] = process.argv;

    if (!templateFile) {
        console.error('Usage: node index.js <template-file>');
        process.exit(1);
    }

    validateWithAWS(templateFile).catch(err => {
        console.error('☁️ An unexpected error occurred:', err?.message ?? err);
        process.exit(1);
    })
}

// --| CommonJS export
module.exports = { validateWithAWS };

// --| ESM default export for `import` statements
module.exports.default = { validateWithAWS };
