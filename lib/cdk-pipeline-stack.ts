import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as pipelines from "aws-cdk-lib/pipelines";
import { CdkPipelineStage } from "./cdk-pipeline-stage";

export class CdkPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const connectionArn = this.node.tryGetContext("githubConnectionArn");

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

    modernPipeline.addStage(new CdkPipelineStage(this, "DevStage"));
  }
}
