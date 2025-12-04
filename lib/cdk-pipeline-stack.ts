import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as pipelines from "aws-cdk-lib/pipelines";
import { CdkPipelineStackResource } from "./cdk-pipeline-stack-resource";

export class CdkPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. GitHub source
    const githubToken = cdk.SecretValue.ssmSecure(
      "/github/token",
      "1" // version number, usually always "1"
    );

    // 2. Pipeline
    const pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      synth: new pipelines.ShellStep("Synth", {
        input: pipelines.CodePipelineSource.gitHub(
          "khemrajneupane/cdk-app",
          "main",
          { authentication: githubToken }
        ),
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });

    // 3. Add a deployment stage
    pipeline.addStage(new CdkPipelineStackResource(this, "DevStage"));
  }
}
