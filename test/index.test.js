const { CloudFormationClient, ValidateTemplateCommand } = require('@aws-sdk/client-cloudformation');
const { mockClient } = require('aws-sdk-client-mock');
const fs = require('fs');
const { validateWithAWS } = require('../index');

// --| Initialize the AWS Mock
const cloudFormationMock = mockClient(CloudFormationClient);

// --| Mock Templates: Large Valid YAML
const validYaml = `
    AWSTemplateFormatVersion: '2010-09-09'
    Description: A robust production-ready S3 bucket with encryption.
    Parameters:
    BucketName:
        Type: String
        Default: my-unique-app-bucket
    Resources:
    S3Bucket:
        Type: 'AWS::S3::Bucket'
        Properties:
        BucketName: !Ref BucketName
        BucketEncryption:
            ServerSideEncryptionConfiguration:
            - ServerSideEncryptionByDefault:
                SSEAlgorithm: AES256
    Outputs:
    BucketArn:
        Value: !GetAtt S3Bucket.Arn
`;

// --| Mock Templates: Large Invalid YAML (Malformed Syntax)
const invalidYaml = `
    AWSTemplateFormatVersion: '2010-09-09'
    Resources:
    MyInstance:
        Type: 'AWS::EC2::Instance'
        Properties:
        ImageId: ami-0c55b159cbfafe1f0
        InstanceType: t2.micro
        KeyName: [This bracket is never closed so the YAML is broken
        SecurityGroups:
            - "default"
`;

// --| Mock Templates: Large Valid JSON
const validJson = JSON.stringify({
    AWSTemplateFormatVersion: "2010-09-09",
    Description: "VPC Infrastructure",
    Resources: {
        MyVPC: {
            Type: "AWS::EC2::VPC",
            Properties: {
                CidrBlock: "10.0.0.0/16",
                EnableDnsSupport: true,
                EnableDnsHostnames: true
            }
        }
    }
}, null, 2);

// --| Mock Templates: Malformed JSON (Syntax Error)
const invalidJson = `{
    "AWSTemplateFormatVersion": "2010-09-09",
    "Resources": {
        "MyBucket": {
            "Type": "AWS::S3::Bucket",
            "Properties": {
                "BucketName": "missing-closing-braces"
        }
    }
`;

describe('CloudFormation Validator Tests', () => {
    beforeEach(() => {
        cloudFormationMock.reset();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});

        // --| Mock process.exit to throw an error to halt the async loop during tests
        jest.spyOn(process, 'exit').mockImplementation((code) => {
            throw new Error(`Process.exit called with ${code}`);
        });
    });

    afterEach(() => jest.restoreAllMocks());

    it('Should succeed when provided a large valid YAML template', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(validYaml);
        cloudFormationMock.on(ValidateTemplateCommand).resolves({});

        await validateWithAWS('valid.yaml');

        expect(cloudFormationMock.calls()).toHaveLength(1);
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('AWS Validation successful (via us-east-1)'));
    });

    it('Should fail immediately and exit on a 400 Validation Error', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(invalidYaml);

        const awsError = new Error('Template format error: YAML not well-formed');
        awsError.name = 'ValidationError';

        cloudFormationMock.on(ValidateTemplateCommand).rejects(awsError);

        // --| Wrap in try/catch because our mocked process.exit now throws to stop the loop
        try {
            await validateWithAWS('invalid.yaml');
        } catch (e) {
            // --| Expected halt
        }

        expect(cloudFormationMock.calls()).toHaveLength(1);
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('AWS Validation Template Syntax Error:'));
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('Should succeed when provided a valid JSON template', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(validJson);
        cloudFormationMock.on(ValidateTemplateCommand).resolves({});

        await validateWithAWS('valid.json');

        expect(cloudFormationMock.calls()).toHaveLength(1);
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('AWS Validation successful (via us-east-1)'));
    });

    it('Should fail immediately and exit on a malformed JSON template', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(invalidJson);
        const awsError = new Error('Template format error: JSON not well-formed');
        awsError.$metadata = { httpStatusCode: 400 };

        cloudFormationMock.on(ValidateTemplateCommand).rejects(awsError);

        try {
            await validateWithAWS('invalid.json');
        } catch (e) {
            // --| Expected halt
        }

        expect(cloudFormationMock.calls()).toHaveLength(1);
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('AWS Validation Template Syntax Error:'));
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('Should fail-over to the next region on network/timeout errors', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(validYaml);

        // --| Fail us-east-1 once, succeed on us-west-2
        cloudFormationMock.on(ValidateTemplateCommand).rejectsOnce(new Error('Network Error')).resolves({});

        await validateWithAWS('valid.yaml');

        expect(cloudFormationMock.calls()).toHaveLength(2);
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('AWS region us-east-1 failed or unreachable'));
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('AWS Validation successful (via us-west-2)'));
    });

    it('Should log error and exit if all regions fail', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(validYaml);

        // --| All regions return a non-400 error
        cloudFormationMock.on(ValidateTemplateCommand).rejects(new Error('Service Unavailable'));

        try {
            await validateWithAWS('valid.yaml');
        } catch (e) {
            // --| Expected halt after 3 retries
        }

        expect(cloudFormationMock.calls()).toHaveLength(3);
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('AWS CloudFormation validation failed: All configured AWS regions failed to respond.'));
        expect(process.exit).toHaveBeenCalledWith(1);
    });
});
