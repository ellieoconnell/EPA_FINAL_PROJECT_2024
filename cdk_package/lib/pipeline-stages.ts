import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs";
import { CdkPackageStack } from './cdk_package-stack';
import { MonitoringStack } from './monitoring_stack';

export interface ServiceStageProps extends cdk.StageProps {
    readonly stageName: string;
}

export class ServiceStage extends cdk.Stage {
    constructor(scope: Construct, id: string, props?: ServiceStageProps) {
        super(scope, id, props);

        const stageNameProp = props?.stageName;

        new CdkPackageStack(this, 'cdkStack', {
            stageName: stageNameProp || ''
        });

        const displayName = props?.stageName ? props?.stageName : "";

        //Only create and deploy lambdaDashboardStack for "prod" stage
        if (props?.stageName && props.stageName.toLowerCase() === 'prod') {
            const monitoringStack = new MonitoringStack(this, 'serviceDashboardStack', {
                stageName: stageNameProp || '',
                dashboardName: "QwizDashboard"
            });

            monitoringStack.addLambda(displayName + "GetFunction", displayName + "GetFunction");
            monitoringStack.addLambda(displayName + "PutFunction", displayName + "PutFunction");
            monitoringStack.addAPI(displayName + "epaApi_euWest2", displayName + "API");
            monitoringStack.addDynamo(displayName + "qwizGurusInterviewTable_euWest2", displayName + "DynamoDB");

            console.log("Monitoring stack has been skipped on this stage as it is only being deployed in 'prod'");
        }
    }
}