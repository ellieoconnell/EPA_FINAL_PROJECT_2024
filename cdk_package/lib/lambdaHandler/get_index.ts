import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const dnsStage = process.env.DNS_STAGE ? process.env.DNS_STAGE: "";

const tableName = dnsStage + "qwizGurusInterviewTable_euWest2";

interface Headers {
  'Content-Type': string;
  'Access-Control-Allow-Headers': string;
  'Access-Control-Allow-Credentials': string;
  'Access-Control-Allow-Methods': string;
  'Access-Control-Allow-Origin'?: string;
};

export const handler = async (event: { requestContext: any; }) => {
  let body;
  let statusCode = 200;
  let headers: Headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, PUT',
  };
  console.log(event)

  try {
    switch(event.requestContext.httpMethod) {
      case "GET":
          console.log('its a GET method');
          body = await dynamo.send(
          new ScanCommand({ TableName: tableName })
        );
        body = body.Items;
          break;
      default:
        throw new Error(`Unsupported route: "${event.requestContext.httpMethod}"`);
    }
  } catch (err: any) {
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body);
  }

  if (dnsStage !== 'prod') {
    headers['Access-Control-Allow-Origin'] = 'https://' + dnsStage + 'qwiz.ocoelean.people.aws.dev';
  } else {
    headers['Access-Control-Allow-Origin'] = 'https://qwiz.ocoelean.people.aws.dev';
  };

  return {
    statusCode,
    body,
    headers,
  };
}
