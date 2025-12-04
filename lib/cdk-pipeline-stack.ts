import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as pipelines from "aws-cdk-lib/pipelines";
import { CdkPipelineStackResource } from "./cdk-pipeline-stack-resource";

export class CdkPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * 1. Use CodeStar Connection (NOT SSM!)
     * Replace this ARN with your actual connection ARN from AWS Console.
     */
    // const connectionArn =
    //   "arn:aws:codestar-connections:eu-north-1:123456789012:connection/xxxxxx";
    const connectionArn = this.node.tryGetContext("githubConnectionArn"); //get connection arn from cdk.json context.

    /**
     * 2. Define pipeline
     */
    const modernPipeline = new pipelines.CodePipeline(this, "Pipeline", {
      selfMutation: false,
      synth: new pipelines.ShellStep("Synth", {
        input: pipelines.CodePipelineSource.connection(
          "khemrajneupane/cdk-app",
          "main",
          {
            connectionArn: connectionArn,
          }
        ),
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });

    /**
     * 3. Add a deployment stage
     */
    modernPipeline.addStage(new CdkPipelineStackResource(this, "DevStage"));
  }
}
