#!/bin/bash

# Check if AWS_ACCOUNT_ID is set
if [ -z "$AWS_ACCOUNT_ID" ]; then
  echo "Error: AWS_ACCOUNT_ID environment variable is not set"
  exit 1
fi

if [ -z "$AWS_REGION" ]; then
  AWS_REGION="us-east-1"  # Default region
fi

echo "Using AWS Account ID: $AWS_ACCOUNT_ID"
echo "Using AWS Region: $AWS_REGION"

# Function to build and push a service
build_and_push() {
  local SERVICE_PATH=$1
  local SERVICE_NAME=$2
  
  echo "Processing: $SERVICE_NAME"
  
  echo "Building Docker image..."
  docker build -t "$SERVICE_NAME" "$SERVICE_PATH"
  
  echo "Logging into ECR..."
  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
  
  echo "Tagging image..."
  docker tag "$SERVICE_NAME":latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$SERVICE_NAME:latest
  
  echo "Pushing image to ECR..."
  docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$SERVICE_NAME:latest
  
  echo "Done for $SERVICE_NAME"
  echo "---------------------------"
}

# Process backend services
SERVICES="services/*"
for f in $SERVICES
do
  if [ -d "$f" ]; then
    SERVICE_NAME=$(basename $f)
    build_and_push "$f" "$SERVICE_NAME"
  fi
done

# Process frontend
echo "Building and pushing frontend..."
build_and_push "./frontend" "frontend"

echo "All services and frontend built and pushed successfully!"