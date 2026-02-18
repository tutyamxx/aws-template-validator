/**
 * Validate a CloudFormation template file with `AWS CloudFormation API (SDK v3)`.
 *
 * Reads the file and sends it to AWS for validation.
 * Logs success or failure to the console. Errors are caught and logged.
 *
 * @param {string} templateFile - Path to the CloudFormation template file (`JSON` or `YAML`).
 * @returns {Promise<void>} Resolves after logging validation result.
 */
export declare const validateWithAWS: (templateFile: string) => Promise<void>
