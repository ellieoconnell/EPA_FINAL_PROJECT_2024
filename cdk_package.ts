#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {QwizPipelineStack} from "../lib/pipeline-stack";

const app = new cdk.App();
new QwizPipelineStack(app, 'QwizPipelineStack', {
    env : {
        account: '**********',
        region:'eu-west-2',
    }
});
app.synth();
