#!/bin/bash
set -euo pipefail

# Usage: pr-review-deploy.sh <subnet-ids> <security-group-ids>
# Required env vars: FUNCTION_NAME, PR_NUMBER, REGISTRY, IMAGE, ROLE_ARN, GITHUB_REPOSITORY, GITHUB_ENV, GITHUB_SHA

SUBNET_IDS="$1"
SECURITY_GROUP_IDS="$2"

FULL_FUNCTION_NAME="${FUNCTION_NAME}-${PR_NUMBER}"
IMAGE_URI="${REGISTRY}/${IMAGE}:pr-${PR_NUMBER}-${GITHUB_SHA}"

if aws lambda get-function --function-name "$FULL_FUNCTION_NAME"; then
  aws lambda update-function-code \
    --function-name "$FULL_FUNCTION_NAME" \
    --image-uri "$IMAGE_URI"
else
  aws lambda create-function \
    --function-name "$FULL_FUNCTION_NAME" \
    --package-type Image \
    --role "$ROLE_ARN" \
    --timeout 15 \
    --memory-size 2048 \
    --code "ImageUri=$IMAGE_URI" \
    --description "$GITHUB_REPOSITORY/pull/$PR_NUMBER" \
    --vpc-config "SubnetIds=$SUBNET_IDS,SecurityGroupIds=$SECURITY_GROUP_IDS"

  aws lambda wait function-active --function-name "$FULL_FUNCTION_NAME"

  aws lambda add-permission \
    --function-name "$FULL_FUNCTION_NAME" \
    --statement-id AllowPublicInvokeFunctionUrl \
    --action lambda:InvokeFunctionUrl \
    --principal "*" \
    --function-url-auth-type NONE
  aws lambda add-permission \
    --function-name "$FULL_FUNCTION_NAME" \
    --statement-id AllowPublicInvokeFunction \
    --action lambda:InvokeFunction \
    --principal "*"

  URL="$(aws lambda create-function-url-config --function-name "$FULL_FUNCTION_NAME" --auth-type NONE | jq .FunctionUrl)"
  echo "URL=$URL" >> "$GITHUB_ENV"

  aws lambda update-function-configuration \
    --function-name "$FULL_FUNCTION_NAME" \
    --environment "Variables={NEXTAUTH_URL=$URL}"

  aws logs create-log-group --log-group-name "/aws/lambda/$FULL_FUNCTION_NAME"
  aws logs put-retention-policy \
    --log-group-name "/aws/lambda/$FULL_FUNCTION_NAME" \
    --retention-in-days 14
fi

aws lambda wait function-updated --function-name "$FULL_FUNCTION_NAME"
aws lambda put-function-concurrency \
  --function-name "$FULL_FUNCTION_NAME" \
  --reserved-concurrent-executions 10
