import { describe, beforeEach, test, expect } from '@jest/globals';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand} from '@aws-sdk/lib-dynamodb';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { handler } from '../lib/lambdaHandler/put_index';

const ddbMock = mockClient(DynamoDBDocumentClient);

const dnsStage = process.env.DNS_STAGE ? process.env.DNS_STAGE: "";

const putquestion = {
  role: 'fourth',
  question: 'BEEP_TEST_QUESTION',
  type: 'fourth',
};

const putmalformed_question = {
  roles: ',BEEP_TEST_QUESTION',
  question: 'fourth,',
  question_type: 'code,',
};

const putheaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://' + dnsStage + 'qwiz.ocoelean.people.aws.dev',
  'Access-Control-Allow-Methods': 'GET, PUT',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
};

const putevent = {
  requestContext: {
    httpMethod: 'PUT',
  },
  body: JSON.stringify(putquestion),
};

const putwrong_event = {
  requestContext: {
    httpMethod: 'PUT',
  },
  body: JSON.stringify(putmalformed_question),
};

beforeEach(() => {
  ddbMock.reset();
});

const putmockPutCommand = (result: any) => {
  ddbMock.on(PutCommand).resolves(result);
};

const putmockPutItemCommand = (result: any) => {
  ddbMock.on(PutItemCommand).resolves(result);
};

const putexecuteHandler = async (event: any) => {
  return await handler(event);
};

describe('Lambda Handler - put_index', () => {
  test('should handle a successful PutCommand', async () => {
    putmockPutCommand({});

    const response = await putexecuteHandler(putevent);
    expect(response.headers).toEqual(putheaders);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('"Put item BEEP_TEST_QUESTION"');
  });

  test('should handle a malformed question in PutCommand', async () => {
    putmockPutCommand({});

    const response = await putexecuteHandler(putwrong_event);
    expect(response.headers).toEqual(putheaders);
    expect(response.statusCode).toBe(400);
  });

});
