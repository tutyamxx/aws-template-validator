const { CloudFormationClient, ValidateTemplateCommand } = require('@aws-sdk/client-cloudformation');
const { mockClient } = require('aws-sdk-client-mock');
const fs = require('fs');
const { validateWithAWS } = require('../index');

// --| Initialize the AWS Mock
const cfMock = mockClient(CloudFormationClient);

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
        cfMock.reset();
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => jest.restoreAllMocks());

    it('Should succeed when provided a large valid YAML template', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(validYaml);
        cfMock.on(ValidateTemplateCommand).resolves({});

        await validateWithAWS('valid.yaml');

        expect(cfMock.calls()).toHaveLength(1);
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('AWS CloudFormation validation successful!'));
    });

    it('Should fail when provided a malformed YAML template', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(invalidYaml);

        const awsError = new Error('Template format error: YAML not well-formed');
        cfMock.on(ValidateTemplateCommand).rejects(awsError);

        await validateWithAWS('invalid.yaml');

        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('AWS CloudFormation validation failed!'));
        expect(console.log).toHaveBeenCalledWith(awsError.message);
    });

    it('Should succeed when provided a valid JSON template', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(validJson);
        cfMock.on(ValidateTemplateCommand).resolves({});

        await validateWithAWS('valid.json');

        expect(cfMock.calls()).toHaveLength(1);
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('AWS CloudFormation validation successful!'));
    });

    it('Should fail when provided a malformed JSON template', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(invalidJson);
        const awsError = new Error('Template format error: JSON not well-formed');

        cfMock.on(ValidateTemplateCommand).rejects(awsError);
        await validateWithAWS('invalid.json');

        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('AWS CloudFormation validation failed!'));
        expect(console.log).toHaveBeenCalledWith(awsError.message);
    });
});
