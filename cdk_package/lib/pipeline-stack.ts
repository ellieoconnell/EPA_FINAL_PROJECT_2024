import { Construct } from 'constructs';
import { ServiceStage, ServiceStageProps } from './pipeline-stages';
import * as cdk from 'aws-cdk-lib';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { CodeBuildStep, CodePipeline, CodePipelineSource } from "aws-cdk-lib/pipelines";

export class QwizPipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const repo = codecommit.Repository.fromRepositoryName(this, 'qwizRepo_euWest2', "qwiz_guru_epa_project");

        const pipelineSetUp = {
            stages: [
                { name: "Alpha", accountID: "*********", region: "eu-west-2", isProd: false },
                { name: "Prod", accountID: "*********", region: "eu-west-2", isProd: true },
            ]
        };

        const pipeline = new CodePipeline(this, 'qwizPipeline_euWest2', {
            pipelineName: 'QwizPipeline',
            crossAccountKeys: true,
            synth: new CodeBuildStep('SynthStep', {
                input: CodePipelineSource.codeCommit(repo, 'master'),
                installCommands: [
                    'npm install -g aws-cdk',
                    'npm install -g typescript',
                ],
                commands: [
                    'cdk --version',
                    'tsc --version',
                    'pwd',
                    'cd cdk_package',
                    'ls',
                    'npm install',
                    'npm run build',
                    'cdk synth',
                    'npm run test',
                    'ls -al',
                ],
                primaryOutputDirectory: 'cdk_package/cdk.out'
            })
        });

        pipelineSetUp.stages.map((stage) => {
            const deploymentStages = new ServiceStage(this, (stage.name.toLowerCase() + 'Deployment'), {
                env: { account: stage.accountID, region: stage.region},
                stageName: stage.name.toLowerCase(),
            });

            pipeline.addStage(deploymentStages)
        });
    };  
}