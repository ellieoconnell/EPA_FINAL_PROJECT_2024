import { Stack, StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origin from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as target from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
import * as s3deployment from 'aws-cdk-lib/aws-s3-deployment';

export interface ServiceStackProps extends StackProps {
    readonly stageName: string;
    setDestroyPolicyToAllResources?: boolean;
};

export class CdkPackageStack extends Stack {
    constructor(scope: Construct, id: string, props?: ServiceStackProps) {
        super(scope, id, props);

        //  DynamoDB table
        const table = new ddb.Table(this, 'qwizGurusInterviewTable_euWest2', {
            tableName: props?.stageName + 'qwizGurusInterviewTable_euWest2',
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            partitionKey: {
                name: 'level',
                type: ddb.AttributeType.STRING,
            },
            sortKey: {
                name: 'question',
                type: ddb.AttributeType.STRING
            }
        });

        table.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY)

        // LambdaGET interview question data
        const getFunction = new lambda.Function(this, 'getFunction_euWest2', {
            functionName: props?.stageName + "GetFunction",
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'get_index.handler',
            code: lambda.Code.fromAsset('./lib/lambdaHandler'),
        });

        if (getFunction.role === null) {
            throw new Error('Lambda function role cannot be null');
        }

        getFunction.role?.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'))

        getFunction.addEnvironment("TABLE_NAME", table.tableName)

        table.grantReadWriteData(getFunction)

        if (props?.stageName != undefined) {
            getFunction.addEnvironment("DNS_STAGE", props?.stageName)
        }

        // LambdaPUT interview question data
        const putFunction = new lambda.Function(this, 'putFunction_euWest2', {
            functionName: props?.stageName + "PutFunction",
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'put_index.handler',
            code: lambda.Code.fromAsset('./lib/lambdaHandler'),
        });

        if (putFunction.role === null) {
            throw new Error('Lambda function role cannot be null');
        }

        putFunction.role?.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'))

        putFunction.addEnvironment("TABLE_NAME", table.tableName)

        table.grantReadWriteData(putFunction)

        if (props?.stageName != undefined) {
            putFunction.addEnvironment("DNS_STAGE", props?.stageName)
        }

        let allowedOrigins: string[]
        
        if (props?.stageName != 'prod') {
            allowedOrigins = ["https://" + props?.stageName + "qwiz.ocoelean.people.aws.dev"]
        } else {
            allowedOrigins = ["https://qwiz.ocoelean.people.aws.dev"]
        };

        // creating API 
        const api = new apigateway.RestApi(this, 'epaApi_euWest2', {
            restApiName: props?.stageName + 'epaApi_euWest2',
            defaultCorsPreflightOptions: {
                 allowOrigins: allowedOrigins,
                 allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
                 allowMethods: ["GET", "PUT"],
                }
        });

        const putlambdaintegration = new apigateway.LambdaIntegration(putFunction);
        const getlambdaintegration = new apigateway.LambdaIntegration(getFunction);

        // creating varibles for zone name, zone ID and nova DNS role
        const hosted_zone_name = 'ocoelean.people.aws.dev'
        const hosted_zone_ID = '***************'
        const cross_DNS_role_ID = 'arn:aws:iam::*********:role/CrossDNSDelegationRole-DO-NOT-DELETE'

        let qwiz_api_zone_name: string;

        // constructing the api url with the domain name
        if (props?.stageName != 'prod') {
            qwiz_api_zone_name = props?.stageName + 'api.' + hosted_zone_name
        } else {
            qwiz_api_zone_name = 'api.' + hosted_zone_name
        }

        // looking up hosted zone already created to find the records
        route53.HostedZone.fromHostedZoneAttributes(this, 'hosted_zone', {
            hostedZoneId: hosted_zone_ID,
            zoneName: hosted_zone_name,
        });

        // creating a public zone for the sub domain for the api
        const api_hosted_sub_zone = new route53.PublicHostedZone(this, 'api_sub', {
            zoneName: qwiz_api_zone_name,
        });

        // creating the cross domain delgation for the child accounts for the api url
        new route53.CrossAccountZoneDelegationRecord(this, 'zoneDelegationAPI', {
            delegatedZone: api_hosted_sub_zone,
            parentHostedZoneId: hosted_zone_ID,
            delegationRole: iam.Role.fromRoleArn(this, "DelegationRoleAPI", cross_DNS_role_ID)
        });

        // SSL certificate for api
        const ssl_cert_api = new acm.Certificate(this, 'certificate_api', {
            domainName: qwiz_api_zone_name,
            certificateName: 'qwiz_cert_ssl_api',
            validation: acm.CertificateValidation.fromDns(api_hosted_sub_zone),
        });

        // adding the domain name to the api gateway
        api.addDomainName('api_domain', {
            domainName: qwiz_api_zone_name,
            certificate: ssl_cert_api,
        }); 

        // creating the a record for IPV4 for the api domain
        new route53.ARecord(this, 'epa_arecord_api', {
            zone: api_hosted_sub_zone,
            recordName: qwiz_api_zone_name,
            target: route53.RecordTarget.fromAlias(new target.ApiGateway(api))
        });

        // creating the a record for IPV6 for the api domain
        new route53.AaaaRecord(this, 'epa_Aaaarecord_api', {
            zone: api_hosted_sub_zone,
            recordName: qwiz_api_zone_name,
            target: route53.RecordTarget.fromAlias(new target.ApiGateway(api))
        });

        // creating text records for security
        // values provided state that no email addresses/IPs are allowed to send emails from this domain
        new route53.TxtRecord(this, 'api_domain_txt_record_spf', {
            zone: api_hosted_sub_zone,
            recordName: qwiz_api_zone_name,
            values: ['v=spf1 -all'],
            comment: 'https://w.amazon.com/bin/view/SuperNova/PreventEmailSpoofing/'
        });

        // creating text records for security
        // values provided aids the spf records to mitigate spoofing 
        new route53.TxtRecord(this, 'api_domain_txt_record', {
            zone: api_hosted_sub_zone,
            recordName: '_dmarc.' + qwiz_api_zone_name,
            values: ['v=DMARC1; p=reject; rua=mailto:report@dmarc.amazon.com; ruf=mailto:report@dmarc.amazon.com'],
            comment: 'https://w.amazon.com/bin/view/SuperNova/PreventEmailSpoofing/'
        });

        // constructing the distribution url using the parent domain name
        let qwiz_distribution_zone_name: string

        if (props?.stageName != 'prod') {
            qwiz_distribution_zone_name = props?.stageName + 'qwiz.' + hosted_zone_name
        } else {
            qwiz_distribution_zone_name = 'qwiz.' + hosted_zone_name
        }

        // create a zone for the sub domain for the distribution
        const distribution_hosted_sub_zone = new route53.PublicHostedZone(this, 'distribution_sub', {
            zoneName: qwiz_distribution_zone_name,
        });

        // creating the cross domain delgation for the child accounts for the distribution url
        new route53.CrossAccountZoneDelegationRecord(this, 'zoneDelegationDistribution', {
            delegatedZone: distribution_hosted_sub_zone,
            parentHostedZoneId: hosted_zone_ID,
            delegationRole: iam.Role.fromRoleArn(this, "DelegationRoleDistribution", cross_DNS_role_ID)
        });

        // SSL certificate for distribution domain
        const ssl_cert_distribution = new acm.DnsValidatedCertificate(this, 'certificate_distribution', {
            domainName: qwiz_distribution_zone_name,
            hostedZone: distribution_hosted_sub_zone,
            region: 'us-east-1'
        });

        let bucketName: string

        if (props?.stageName != 'prod') {
            bucketName = props?.stageName + '********'
        } else {
            bucketName = '***********'
        };

        // bucket to hold cloudscape stack
        const bucket = new s3.Bucket(this, '*********', {
            bucketName: bucketName,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const deployment = new s3deployment.BucketDeployment(this, 'deployWebsite', {
            sources: [s3deployment.Source.asset('../cloudscape_stacks')],
            destinationBucket: bucket,
        });

        // adding cors rules to the bucket
        bucket.addCorsRule({
            allowedOrigins: allowedOrigins,
            allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
            allowedHeaders: ["*"],
            exposedHeaders: ["Access-Control-Allow-Origin"]
         });

        const oai = new cloudfront.OriginAccessIdentity(this, 'epaOai_euWest2');

        bucket.grantRead(oai);

        const distribution = new cloudfront.Distribution(this, 'epaCloudFront_euWest2', {
            defaultBehavior: {
                origin: new origin.S3Origin(deployment.deployedBucket, {
                    originAccessIdentity: oai,
                    originPath: '/lib',
                }),
                        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
                        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
                        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            },
                domainNames: [qwiz_distribution_zone_name],
                certificate: ssl_cert_distribution,
                enableIpv6: true,
                defaultRootObject: 'tablepage/index.html'
        });

        // creating the a record for IPV4 for the distribution domain
        new route53.ARecord(this, 'epa_arecord_distribution', {
            zone: distribution_hosted_sub_zone,
            recordName: qwiz_distribution_zone_name,
            target: route53.RecordTarget.fromAlias(new target.CloudFrontTarget(distribution))
        });

        // creating the a record for IPV6 for the distribution domain
        new route53.AaaaRecord(this, 'epa_Aaaarecord_website', {
            zone: distribution_hosted_sub_zone,
            recordName: qwiz_distribution_zone_name,
            target: route53.RecordTarget.fromAlias(new target.CloudFrontTarget(distribution))
        });

        // creating text records for security
        // values provided state that no email addresses/IPs are allowed to send emails from this domain
        new route53.TxtRecord(this, 'distribution_domain_txt_record_spf', {
            zone: distribution_hosted_sub_zone,
            recordName: qwiz_distribution_zone_name,
            values: ['v=spf1 -all'],
            comment: 'https://w.amazon.com/bin/view/SuperNova/PreventEmailSpoofing/'
        });

        // creating text records for security
        // values provided aids the spf records to mitigate spoofing 
        new route53.TxtRecord(this, 'distribution_domain_txt_record', {
            zone: distribution_hosted_sub_zone,
            recordName: '_dmarc.' + qwiz_distribution_zone_name,
            values: ['v=DMARC1; p=reject; rua=mailto:report@dmarc.amazon.com; ruf=mailto:report@dmarc.amazon.com'],
            comment: 'https://w.amazon.com/bin/view/SuperNova/PreventEmailSpoofing/'
        });

        const putresource = api.root.addResource("put-question");
        putresource.addMethod("PUT", putlambdaintegration);

        const getresource = api.root.addResource("question");
        getresource.addMethod("GET", getlambdaintegration);

        // cloud trail
        const key = new kms.Key(this, 'epaCloudTrailKey_euwest2', {
            enableKeyRotation: true,
        });

        key.grantEncrypt(new iam.ServicePrincipal('cloudtrail.amazonaws.com'));

        new cloudtrail.Trail(this, 'epaCloudTrail_euwest2', {
            sendToCloudWatchLogs: true,
            cloudWatchLogsRetention: logs.RetentionDays.FOUR_MONTHS,
            trailName: 'qwizEvents_euWest2',
            encryptionKey: key
        });
    };
};
