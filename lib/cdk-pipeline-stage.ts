import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { CdkPipelineStackResource } from "./cdk-pipeline-stack-resource";

export class CdkPipelineStage extends cdk.Stage {
  public readonly urlOutput: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    const service = new CdkPipelineStackResource(this, "PipelineAppStack");
    this.urlOutput = service.urlOutput;
  }
}
