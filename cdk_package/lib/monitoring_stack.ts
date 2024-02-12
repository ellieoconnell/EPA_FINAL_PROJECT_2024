import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { Alarm, ComparisonOperator, Dashboard, GraphWidget, Metric } from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Topic } from 'aws-cdk-lib/aws-sns';
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from 'constructs';

export interface MonitoringStackProps extends StackProps {
    stageName?: string;
    dashboardName?: string;
}

const api = "AWS/ApiGateway";
const lambda = "AWS/Lambda";
const ddb = "AWS/DynamoDB";

export class MonitoringStack extends cdk.Stack {

    protected readonly serviceDashboard: Dashboard

    protected readonly invocations = new Metric ({
        namespace: lambda,
        metricName: "Invocations",
        statistic: "sum"
    });

    protected readonly duration = new Metric ({
        namespace: lambda,
        metricName: "Duration",
        statistic: "min"
    });

    protected readonly lambdaErrors = new Metric ({
        namespace: lambda,
        metricName: "Error",
        statistic: "sum"
    });

    protected readonly lambdaThrottle = new Metric ({
        namespace: lambda,
        metricName: "Throttles",
        statistic: "sum"
    });

    protected readonly concurrentExecutions = new Metric ({
        namespace: lambda,
        metricName: "ConcurrentExecutions",
        statistic: "sum"
    });

    protected readonly fourHundredError = new Metric ({
        namespace: api,
        metricName: "4XXError",
        statistic: "sum"
    });

    protected readonly fiveHundredError = new Metric ({
        namespace: api,
        metricName: "5XXError",
        statistic: "sum"
    });

    protected readonly requestCount = new Metric ({
        namespace: api,
        metricName: "Count",
        statistic: "sum" 
    });

    protected readonly requestLatency = new Metric ({
        namespace: api,
        metricName: "Latency",
        statistic: "max"
    });

    protected readonly writeThrottleEvents = new Metric ({
        namespace: ddb,
        metricName: "WriteThrottleEvents",
        statistic: "sum"
    });

    protected readonly readThrottleEvents = new Metric ({
        namespace: ddb,
        metricName: "ReadThrottleEvents",
        statistic: "sum"
    });

    protected readonly dynamoErrors = new Metric ({
        namespace: ddb,
        metricName: "SystemErrors",
        statistic: "sum"
    });

    protected readonly topic: Topic;

    protected readonly my_email = "ocoelean@amazon.com"

    constructor(scope: Construct, id: string, props: MonitoringStackProps) {
        super(scope, id);

        if (props?.stageName && props.stageName.toLowerCase() === 'prod') {
            this.serviceDashboard = new Dashboard(this, props?.dashboardName || "", {
                dashboardName: (props?.stageName || "") + (props?.dashboardName || "ProdDashboard")
            });
        } else {
            console.log("Dashboard creation skipped. Only deployed in the 'prod' stage.");
        };
        this.topic = new Topic(this, 'AlarmTopic', {topicName: "AlarmTopic"});
        this.topic.addSubscription(new subscriptions.EmailSubscription(this.my_email));
    };

    public addLambda(functionName: string, displayName: string) {

        const dimensionsMap = {
            "FunctionName": functionName
        };

        this.serviceDashboard.addWidgets(
            new GraphWidget({
                title: displayName + "Invocations",
                left: [
                    this.invocations.with({
                        dimensionsMap: dimensionsMap
                    })
                ]
            }),
        
            new GraphWidget({
                title: displayName + "Duration",
                left: [
                    this.duration.with({
                        dimensionsMap: dimensionsMap
                    }),
                    this.duration.with({
                        dimensionsMap: dimensionsMap,
                        statistic: "avg"
                    }),
                    this.duration.with({
                        dimensionsMap: dimensionsMap,
                        statistic: "max"
                    })
                ]
            }),

            new GraphWidget({
                title: displayName + "Errors",
                left: [
                    this.lambdaErrors.with({
                        dimensionsMap: dimensionsMap
                    }),
                    this.lambdaThrottle.with({
                        dimensionsMap: dimensionsMap
                    })
                ]
            }),

            new GraphWidget({
                title: displayName + "ConcurrentExecutions",
                left: [
                    this.concurrentExecutions.with({
                        dimensionsMap: dimensionsMap
                    })
                ]
            })
        );

        const lambdaDurationAlarm = new Alarm(this, displayName + "LambdaDuration", {
            alarmName: displayName + "LambdaDuration",
            comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
            threshold: 1000,
            evaluationPeriods: 1,
            metric: this.duration.with({dimensionsMap: dimensionsMap}),
            actionsEnabled: true
            });
        
        lambdaDurationAlarm.addAlarmAction(new actions.SnsAction(this.topic))
        
        const lambdaErrorAlarm= new Alarm(this, displayName + "LambdaErrors", {
            alarmName: displayName + " LambdaErrors",
            comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
            threshold: 0,
            evaluationPeriods: 1,
            metric: this.lambdaErrors.with({dimensionsMap: dimensionsMap}),
            actionsEnabled: true
            });

        lambdaErrorAlarm.addAlarmAction(new actions.SnsAction(this.topic))
    };

    public addAPI(apiName: string, displayName: string){

        const dimensionsMap = {
            "APIName": apiName
        };

        this.serviceDashboard.addWidgets(
            new GraphWidget({
                title: displayName + "4XXError",
                left: [
                    this.fourHundredError.with({
                        dimensionsMap: dimensionsMap
                    })
                ]
            }),

            new GraphWidget({
                title: displayName + "5XXError",
                left: [
                    this.fiveHundredError.with({
                        dimensionsMap: dimensionsMap
                    })
                ]
            }),

            new GraphWidget({
                title: displayName + "RequestCount",
                left: [
                    this.requestCount.with({
                        dimensionsMap: dimensionsMap
                    }),
                    this.requestCount.with({
                        statistic: "min"
                    }),
                    this.requestCount.with({
                        statistic: "max"
                    }),
                    this.requestCount.with({
                        statistic: "avg"
                    })
                ]
            }),

            new GraphWidget({
                title: displayName + "RequestLatency",
                left: [
                    this.requestLatency.with({
                        dimensionsMap: dimensionsMap
                    }),
                    this.requestLatency.with({
                        statistic: "min"
                    }),
                    this.requestLatency.with({
                        statistic: "avg"
                    })
                ]
            })
        );

        const apiLatency = new Alarm(this, displayName + " ApiLatency", {
            alarmName: displayName + " ApiLatency",
            comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
            threshold: 2000,
            evaluationPeriods: 1,
            metric: this.requestLatency.with({dimensionsMap: dimensionsMap}),
            actionsEnabled: true
        });

        apiLatency.addAlarmAction(new actions.SnsAction(this.topic));

        const apiIntegrationLatency = new Alarm(this, displayName + " ApiIntegrationLatency", {
            alarmName: displayName + " ApiIntegrationLatency",
            comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
            threshold: 2000,
            evaluationPeriods: 1,
            metric: this.requestCount.with({dimensionsMap: dimensionsMap}),
            actionsEnabled: true
        });

        apiIntegrationLatency.addAlarmAction(new actions.SnsAction(this.topic));
    };

    public addDynamo(dynamoName: string, displayName: string) {
        
        const dimensionsMap = {
            "dynamoName": dynamoName
        };

        this.serviceDashboard.addWidgets(
            new GraphWidget({
                title: displayName + "WriteThrottleEvents",
                left: [
                    this.writeThrottleEvents.with({
                        dimensionsMap: dimensionsMap,
                    })
                ]
            }),

            new GraphWidget({
                title: displayName + "ReadThrottleEvents",
                left: [
                    this.readThrottleEvents.with({
                        dimensionsMap: dimensionsMap
                    })
                ]
            }),

            new GraphWidget({
                title: displayName + "Errors",
                left: [
                    this.dynamoErrors.with({
                        dimensionsMap: dimensionsMap
                    })
                ]
            })
        );

        const dynamoReadErrors = new Alarm(this, displayName + " ConsumedReadCapacityUnits", {
            alarmName: displayName + " ConsumedReadCapacityUnits",
            comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
            threshold: 10000,
            evaluationPeriods: 1,
            metric: this.readThrottleEvents.with({dimensionsMap: dimensionsMap}),
            actionsEnabled: true
        });

        dynamoReadErrors.addAlarmAction(new actions.SnsAction(this.topic));

        const dynamoWriteErrors = new Alarm(this, displayName + " ConsumedWriteCapacityUnits", {
            alarmName: displayName + " ConsumedWriteCapacityUnits",
            comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
            threshold: 5000,
            evaluationPeriods: 1,
            metric: this.writeThrottleEvents.with({dimensionsMap: dimensionsMap}),
            actionsEnabled: true
        });

        dynamoWriteErrors.addAlarmAction(new actions.SnsAction(this.topic));
    };
}
