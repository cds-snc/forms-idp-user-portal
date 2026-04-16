#!/bin/bash

#
# Retrieves the latest task definition for the IdP login service and updates
# the SSM ParameterStore `/idp-login-pr/env` value with the latest environment
# variable and secret values.  This is then used by the PR review environment
# lambda functions as its source of values.
#
# This script expects to be run with an `AWS_REGION` environment variable
# in the execution context and depends on the AWS cli and jq being installed.
#
# export AWS_REGION="ca-central-1"
# ./pr-review-update-vars.sh cluster_name service_name
#

set -euo pipefail

CLUSTER_NAME="$1"
SERVICE_NAME="$2"

# Get current IdP login task definition
echo "🔎 Get current IdP login task definition"
TASK_ARN="$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name $SERVICE_NAME --output text --query 'taskArns[0]')"
TASK_DEF_ARN="$(aws ecs describe-tasks --cluster $CLUSTER_NAME --task "$TASK_ARN" --output text --query 'tasks[0].taskDefinitionArn')"
TASK_DEF="$(aws ecs describe-task-definition --task-definition "$TASK_DEF_ARN")"

# Get env vars
echo "🔎 Get task environment variables"
ENV_VARS="$(echo "$TASK_DEF" | jq -r '.taskDefinition.containerDefinitions[0].environment | flatten[] | [.name,.value] | join("=")')"

# Get secrets
echo "🔎 Get task secrets"
SECRET_VARS="$(echo "$TASK_DEF" | jq -r '.taskDefinition.containerDefinitions[0].secrets | flatten[] | [.name,.valueFrom] | join("=")')"
while IFS= read -r SECRET; do
    SECRET_NAME="${SECRET%%=*}"
    SECRET_ARN="${SECRET#*=}"
    SECRET_VALUE="$(aws ssm get-parameter --name "$SECRET_ARN" --query 'Parameter.Value' --with-decryption --output text)"
    ENV_VARS="$ENV_VARS"$'\n'"$SECRET_NAME=$SECRET_VALUE"
done <<< "$SECRET_VARS"

# Update ParameterStore value
echo "🖋 Update parameter store"
SORTED_ENV_VARS="$(echo "$ENV_VARS" | sort)"
aws ssm put-parameter  --name /idp-login-pr/env --type SecureString --value "$SORTED_ENV_VARS" --overwrite > /dev/null 2>&1

echo "🎉 All done!"
