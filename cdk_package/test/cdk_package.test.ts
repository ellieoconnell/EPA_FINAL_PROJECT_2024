import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as CdkPackage from '../lib/cdk_package-stack';
import { test } from '@jest/globals';

test('DynamoDB table created', () => {
  const app = new cdk.App();
  const stack = new CdkPackage.CdkPackageStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TableName: 'undefinedqwizGurusInterviewTable_euWest2'
  });
  template.resourceCountIs('AWS::DynamoDB::Table', 1);
});

test('Lambda functions created',  ()=> {
  const app = new cdk.App();
  const stack = new CdkPackage.CdkPackageStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::Lambda::Function', {
    Handler: 'index.handler'
  });
  template.hasResourceProperties('AWS::Lambda::Function', {
    Handler: 'get_index.handler'
  });
  template.resourceCountIs('AWS::Lambda::Function', 5);
})

test('S3 bucket created', () => {
  const app = new cdk.App();
  const stack = new CdkPackage.CdkPackageStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);
  template.resourceCountIs('AWS::S3::Bucket', 2);
});

test('API Gateway created', () => {
  const app = new cdk.App();
  const stack = new CdkPackage.CdkPackageStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::ApiGateway::RestApi', {
    Name: 'undefinedepaApi_euWest2'
  });
  template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
});

test('CloudFront Distribution created', () => {
  const app = new cdk.App();
  const stack = new CdkPackage.CdkPackageStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);
  template.resourceCountIs('AWS::CloudFront::Distribution', 1);
});

test('KMS key created', () => {
  const app = new cdk.App();
  const stack = new CdkPackage.CdkPackageStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::KMS::Key', {
    EnableKeyRotation: true
  });
  template.resourceCountIs('AWS::KMS::Key', 1);
});

test('CloudTrail Trail created', () => {
  const app = new cdk.App();
  const stack = new CdkPackage.CdkPackageStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::CloudTrail::Trail', {
    TrailName: 'qwizEvents_euWest2'
  });
  template.resourceCountIs('AWS::CloudTrail::Trail', 1);
});