#!/bin/bash

if [ -z "$AWS_ACCOUNT_ID" ]; then
  echo "Error: AWS_ACCOUNT_ID environment variable is not set"
  exit 1
fi

if [ -z "$AWS_REGION" ]; then
  AWS_REGION="eu-central-1"
fi

echo "Using AWS Account ID: $AWS_ACCOUNT_ID"
echo "Using AWS Region: $AWS_REGION"

build_and_push() {
  local SERVICE_PATH=$1
  local SERVICE_NAME=$2
  
  echo "Processing: $SERVICE_NAME"

  echo "Building Docker image..."
  docker build -t "$SERVICE_NAME" "$SERVICE_PATH"
  
  echo "Tagging image..."
  docker tag "$SERVICE_NAME:latest" \
    "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$SERVICE_NAME:latest"
  
  echo "Pushing image..."
  docker push \
    "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$SERVICE_NAME:latest"
  
  echo "Done for $SERVICE_NAME"
  echo "------------------------------------"
}

# Build backend services
for f in services/*; do
  if [ -d "$f" ]; then
    SERVICE_NAME=$(basename "$f")
    build_and_push "$f" "$SERVICE_NAME"
  fi
done

# Build frontend
build_and_push "./frontend" "frontend"

echo "All services built and pushed successfully!"
