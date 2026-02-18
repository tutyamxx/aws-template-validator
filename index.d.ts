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
export declare const validateWithAWS: (templateFile: string) => Promise<void>
