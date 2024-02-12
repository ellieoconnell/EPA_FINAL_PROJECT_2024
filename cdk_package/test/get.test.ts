import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../lib/lambdaHandler/get_index';
import { describe, beforeEach, test, expect } from '@jest/globals';

const ddbMock = mockClient(DynamoDBDocumentClient);

const dnsStage = process.env.DNS_STAGE ? process.env.DNS_STAGE: "";

const getquestion = {
    question: 'BEEP_TEST_QUESTION',
    level: 'fourth',
    role: 'fourth',
  };

const getmalformed_question = {};

const getheaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://' + dnsStage + 'qwiz.ocoelean.people.aws.dev',
  'Access-Control-Allow-Methods': 'GET, PUT',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
};

const getevent = {
  requestContext: {
    httpMethod: 'GET',
  },
};

beforeEach(() => {
  ddbMock.reset();
});

const getmockScanCommand = (result: any) => {
  ddbMock.on(ScanCommand).resolves({ Items: [result] });
};

const getexecuteHandler = async (event: any) => {
  return await handler(event);
};

describe('Lambda Handler - get_index', () => {
  test('should handle a successful scan', async () => {
    getmockScanCommand(getquestion);

    const response = await getexecuteHandler(getevent);
    expect(response.headers).toEqual(getheaders);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([getquestion]);
  });

  test('should handle a malformed question from DynamoDB', async () => {
    getmockScanCommand(getmalformed_question);

    const response = await getexecuteHandler(getevent);
    expect(response.headers).toEqual(getheaders);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([getmalformed_question]);
  });

});